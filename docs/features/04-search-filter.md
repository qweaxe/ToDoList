# 搜索与筛选增强实现方案

## 一、功能概述

提供全文搜索和高级筛选功能，帮助用户快速找到任务，支持保存筛选预设。

## 二、API 端点

### 2.1 全文搜索

#### GET /api/todos/search
全文搜索任务

```typescript
// src/app/api/todos/search/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getD1Client } from '@/lib/d1';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const view = searchParams.get('view') || 'all'; // all, pending, completed
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const d1 = await getD1Client();
  const searchTerm = `%${q.trim()}%`;

  // 构建状态筛选条件
  let statusCondition = '';
  if (view === 'pending') {
    statusCondition = "AND status IN ('pending', 'in_progress')";
  } else if (view === 'completed') {
    statusCondition = "AND status = 'completed'";
  }

  // 搜索标题和描述
  const results = await d1.all(`
    SELECT
      t.id, t.title, t.description, t.startDate, t.dueDate, t.status,
      t.isMilestone, t.categoryId, t.levelId, t.createdAt, t.updatedAt,
      c.name as categoryName, c.emoji as categoryEmoji,
      l.name as levelName, l.value as levelValue
    FROM todos t
    LEFT JOIN categories c ON t.categoryId = c.id
    LEFT JOIN levels l ON t.levelId = l.id
    WHERE t.userId = ?
      AND t.parentId IS NULL
      ${statusCondition}
      AND (t.title LIKE ? OR t.description LIKE ?)
    ORDER BY t.updatedAt DESC
    LIMIT ? OFFSET ?
  `, session.user.id, searchTerm, searchTerm, limit, offset);

  // 获取总数
  const countResult = await d1.first<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM todos
    WHERE userId = ?
      AND parentId IS NULL
      ${statusCondition}
      AND (title LIKE ? OR description LIKE ?)
  `, session.user.id, searchTerm, searchTerm);

  return NextResponse.json({
    results,
    total: countResult?.count || 0,
    query: q,
  });
}
```

### 2.2 高级筛选

#### GET /api/todos/filter
高级筛选任务

```typescript
// src/app/api/todos/filter/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getD1Client } from '@/lib/d1';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // 筛选参数
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const levels = searchParams.get('levels')?.split(',').filter(Boolean) || [];
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const isMilestone = searchParams.get('isMilestone');
  const hasSubTasks = searchParams.get('hasSubTasks');
  const sortBy = searchParams.get('sortBy') || 'updatedAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const d1 = await getD1Client();

  // 构建查询条件
  const conditions: string[] = ['t.userId = ?', 't.parentId IS NULL'];
  const params: any[] = [session.user.id];

  // 分类筛选
  if (categories.length > 0) {
    conditions.push(`t.categoryId IN (${categories.map(() => '?').join(', ')})`);
    params.push(...categories);
  }

  // 等级筛选
  if (levels.length > 0) {
    conditions.push(`t.levelId IN (${levels.map(() => '?').join(', ')})`);
    params.push(...levels);
  }

  // 状态筛选
  if (status.length > 0) {
    conditions.push(`t.status IN (${status.map(() => '?').join(', ')})`);
    params.push(...status);
  }

  // 日期范围
  if (dateFrom) {
    conditions.push('t.dueDate >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('t.dueDate <= ?');
    params.push(dateTo);
  }

  // 里程碑
  if (isMilestone === 'true') {
    conditions.push('t.isMilestone = 1');
  } else if (isMilestone === 'false') {
    conditions.push('t.isMilestone = 0');
  }

  // 有子任务
  if (hasSubTasks === 'true') {
    conditions.push(`EXISTS (SELECT 1 FROM todos sub WHERE sub.parentId = t.id)`);
  }

  // 标签筛选（如果有标签功能）
  if (tags.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM TodoTag tt
        WHERE tt.todoId = t.id
        AND tt.tagId IN (${tags.map(() => '?').join(', ')})
      )
    `);
    params.push(...tags);
  }

  // 构建排序
  const validSortFields = ['updatedAt', 'createdAt', 'dueDate', 'startDate', 'title', 'status'];
  const validSortOrders = ['asc', 'desc'];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
  const order = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

  const whereClause = conditions.join(' AND ');

  // 执行查询
  const results = await d1.all(`
    SELECT
      t.id, t.title, t.description, t.startDate, t.dueDate, t.status,
      t.isMilestone, t.categoryId, t.levelId, t.createdAt, t.updatedAt,
      c.name as categoryName, c.emoji as categoryEmoji,
      l.name as levelName, l.value as levelValue
    FROM todos t
    LEFT JOIN categories c ON t.categoryId = c.id
    LEFT JOIN levels l ON t.levelId = l.id
    WHERE ${whereClause}
    ORDER BY t.${orderBy} ${order.toUpperCase()}
    LIMIT ? OFFSET ?
  `, ...params, limit, offset);

  // 获取总数
  const countResult = await d1.first<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM todos t
    WHERE ${whereClause}
  `, ...params);

  return NextResponse.json({
    results,
    total: countResult?.count || 0,
    filters: {
      categories,
      levels,
      tags,
      status,
      dateFrom,
      dateTo,
      isMilestone,
      hasSubTasks,
    },
  });
}
```

### 2.3 筛选预设

#### 数据库模型

```prisma
// 筛选预设表
model FilterPreset {
  id        String   @id @default(cuid())
  name      String                    // 预设名称
  filters   String                    // JSON 格式的筛选条件
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([userId])
}
```

#### GET /api/filter-presets
获取用户的筛选预设

```typescript
// src/app/api/filter-presets/route.ts
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const d1 = await getD1Client();
  const presets = await d1.all(`
    SELECT id, name, filters, createdAt
    FROM FilterPreset
    WHERE userId = ?
    ORDER BY name
  `, session.user.id);

  // 解析 JSON
  return NextResponse.json(
    presets.map(p => ({ ...p, filters: JSON.parse(p.filters) }))
  );
}
```

#### POST /api/filter-presets
保存筛选预设

```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { name, filters } = await request.json();

  if (!name || !filters) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const d1 = await getD1Client();
  const id = cuid();

  await d1.run(
    'INSERT INTO FilterPreset (id, name, filters, userId, createdAt) VALUES (?, ?, ?, ?, ?)',
    id,
    name,
    JSON.stringify(filters),
    session.user.id,
    new Date().toISOString()
  );

  return NextResponse.json({ id, name, filters });
}
```

#### DELETE /api/filter-presets/[id]
删除筛选预设

```typescript
// src/app/api/filter-presets/[id]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const d1 = await getD1Client();

  await d1.run(
    'DELETE FROM FilterPreset WHERE id = ? AND userId = ?',
    id,
    session.user.id
  );

  return NextResponse.json({ success: true });
}
```

## 三、前端组件

### 3.1 SearchBar - 全局搜索栏

```typescript
// src/components/search/SearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearch } from '@/hooks/use-search';

interface SearchBarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchBar({ open, onOpenChange }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(open ?? false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data, isLoading } = useSearch(query, { enabled: query.length >= 2 });

  useEffect(() => {
    // 快捷键 Cmd/Ctrl + K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleSelect = (todoId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/?todo=${todoId}`);
  };

  const results = data?.results || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground sm:w-64"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">搜索任务...</span>
          <span className="hidden sm:inline ml-auto text-xs">
            ⌘K
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索任务..."
              className="pl-8"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-64 overflow-auto">
          {isLoading && (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              未找到匹配的任务
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="p-1">
              {results.map(todo => (
                <button
                  key={todo.id}
                  onClick={() => handleSelect(todo.id)}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded-md"
                >
                  <div className="font-medium truncate">{todo.title}</div>
                  {todo.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {todo.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              输入至少 2 个字符搜索
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="p-2 border-t text-xs text-muted-foreground">
            共 {data?.total} 个结果
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

### 3.2 AdvancedFilter - 高级筛选面板

```typescript
// src/components/search/AdvancedFilter.tsx
'use client';

import { useState } from 'react';
import { Filter, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { useFilterPresets, useCreateFilterPreset } from '@/hooks/use-filter-presets';

interface FilterState {
  categories: string[];
  levels: string[];
  status: string[];
  dateFrom: string;
  dateTo: string;
  isMilestone: string;
  hasSubTasks: string;
}

interface AdvancedFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const defaultFilters: FilterState = {
  categories: [],
  levels: [],
  status: [],
  dateFrom: '',
  dateTo: '',
  isMilestone: '',
  hasSubTasks: '',
};

export function AdvancedFilter({ filters, onChange, onReset }: AdvancedFilterProps) {
  const [presetName, setPresetName] = useState('');
  const { data: categories = [] } = useCategories();
  const { data: levels = [] } = useLevels();
  const { data: presets = [] } = useFilterPresets();
  const createPreset = useCreateFilterPreset();

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== '';
  });

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    await createPreset.mutateAsync({ name: presetName, filters });
    setPresetName('');
  };

  const handleLoadPreset = (preset: any) => {
    onChange(preset.filters);
  };

  const toggleArrayValue = (key: 'categories' | 'levels' | 'status', value: string) => {
    const current = filters[key];
    if (current.includes(value)) {
      onChange({ ...filters, [key]: current.filter(v => v !== value) });
    } else {
      onChange({ ...filters, [key]: [...current, value] });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          筛选
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              活跃
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>高级筛选</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* 筛选预设 */}
          {presets.length > 0 && (
            <div>
              <Label>预设</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {presets.map(preset => (
                  <Button
                    key={preset.id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 分类 */}
          <div>
            <Label>分类</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map(cat => (
                <Checkbox
                  key={cat.id}
                  checked={filters.categories.includes(cat.id)}
                  onCheckedChange={() => toggleArrayValue('categories', cat.id)}
                  label={`${cat.emoji} ${cat.name}`}
                />
              ))}
            </div>
          </div>

          {/* 等级 */}
          <div>
            <Label>等级</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {levels.map(level => (
                <Checkbox
                  key={level.id}
                  checked={filters.levels.includes(level.id)}
                  onCheckedChange={() => toggleArrayValue('levels', level.id)}
                  label={level.name}
                />
              ))}
            </div>
          </div>

          {/* 状态 */}
          <div>
            <Label>状态</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { value: 'pending', label: '待办' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' },
              ].map(s => (
                <Checkbox
                  key={s.value}
                  checked={filters.status.includes(s.value)}
                  onCheckedChange={() => toggleArrayValue('status', s.value)}
                  label={s.label}
                />
              ))}
            </div>
          </div>

          {/* 日期范围 */}
          <div>
            <Label>日期范围</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                placeholder="开始"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                placeholder="结束"
              />
            </div>
          </div>

          {/* 其他选项 */}
          <div>
            <Label>其他</Label>
            <div className="space-y-2 mt-2">
              <Select
                value={filters.isMilestone}
                onValueChange={v => onChange({ ...filters, isMilestone: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="里程碑" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="true">是里程碑</SelectItem>
                  <SelectItem value="false">非里程碑</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.hasSubTasks}
                onValueChange={v => onChange({ ...filters, hasSubTasks: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="子任务" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="true">有子任务</SelectItem>
                  <SelectItem value="false">无子任务</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 保存预设 */}
          <div>
            <Label>保存为预设</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="预设名称"
              />
              <Button size="sm" onClick={handleSavePreset} disabled={!presetName}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onReset}>
            重置
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

### 3.3 SearchResults - 搜索结果展示

```typescript
// src/components/search/SearchResults.tsx
'use client';

import { TodoItem } from '@/components/todos/TodoItem';

interface SearchResultsProps {
  results: any[];
  total: number;
  isLoading: boolean;
}

export function SearchResults({ results, total, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        未找到匹配的任务
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        共 {total} 个结果
      </div>
      <div className="space-y-2">
        {results.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}
```

## 四、React Query Hooks

```typescript
// src/hooks/use-search.ts
import { useQuery } from '@tanstack/react-query';

interface SearchOptions {
  view?: 'all' | 'pending' | 'completed';
  limit?: number;
  enabled?: boolean;
}

export function useSearch(query: string, options: SearchOptions = {}) {
  const { view = 'all', limit = 50, enabled = true } = options;

  return useQuery({
    queryKey: ['search', query, view, limit],
    queryFn: () => {
      const params = new URLSearchParams({ q: query, view, limit: limit.toString() });
      return fetch(`/api/todos/search?${params}`).then(r => r.json());
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // 30 秒内不重新请求
  });
}

// src/hooks/use-filter.ts
export function useFilter(filters: Record<string, any>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(','));
    } else if (value && typeof value === 'string') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();

  return useQuery({
    queryKey: ['filter', queryString],
    queryFn: () => fetch(`/api/todos/filter?${queryString}`).then(r => r.json()),
    enabled: queryString.length > 0,
  });
}

// src/hooks/use-filter-presets.ts
export function useFilterPresets() {
  return useQuery({
    queryKey: ['filter-presets'],
    queryFn: () => fetch('/api/filter-presets').then(r => r.json()),
  });
}

export function useCreateFilterPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; filters: any }) =>
      fetch('/api/filter-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
    },
  });
}

export function useDeleteFilterPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/filter-presets/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] });
    },
  });
}
```

## 五、集成到 Header

```typescript
// src/components/layout/Header.tsx
import { SearchBar } from '@/components/search/SearchBar';

export function Header() {
  return (
    <header className="...">
      {/* 其他内容 */}
      <SearchBar />
    </header>
  );
}
```

## 六、国际化

```json
// messages/zh.json
{
  "search": {
    "placeholder": "搜索任务...",
    "noResults": "未找到匹配的任务",
    "minChars": "输入至少 2 个字符搜索",
    "totalResults": "共 {{count}} 个结果",
    "shortcut": "⌘K",
    "filter": "筛选",
    "advancedFilter": "高级筛选",
    "resetFilter": "重置",
    "savePreset": "保存为预设",
    "loadPreset": "加载预设",
    "presetName": "预设名称",
    "active": "活跃",
    "categories": "分类",
    "levels": "等级",
    "status": "状态",
    "dateRange": "日期范围",
    "milestone": "里程碑",
    "hasSubTasks": "子任务",
    "all": "全部",
    "yes": "是",
    "no": "否"
  }
}
```

## 七、实现步骤

1. **API 实现**
   - 创建 `/api/todos/search` 端点
   - 创建 `/api/todos/filter` 端点
   - 创建 `/api/filter-presets` 端点

2. **前端组件**
   - 创建 `SearchBar` 组件
   - 创建 `AdvancedFilter` 组件
   - 创建 `SearchResults` 组件

3. **集成**
   - 在 Header 添加搜索栏
   - 在视图页面添加筛选按钮
   - 添加快捷键支持

4. **测试**
   - 测试搜索功能
   - 测试筛选功能
   - 测试预设保存/加载

## 八、工作量估算

- API：0.5 天
- 前端：1 天
- 集成测试：0.5 天

**总计：约 2 天**

## 九、性能优化

### 9.1 搜索防抖

```typescript
import { useDebouncedValue } from '@/hooks/use-debounce';

export function useSearch(query: string, options?: SearchOptions) {
  const [debouncedQuery] = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => fetch(`/api/todos/search?q=${debouncedQuery}`).then(r => r.json()),
    enabled: debouncedQuery.length >= 2,
  });
}
```

### 9.2 结果缓存

```typescript
// 使用 React Query 的缓存
{
  staleTime: 60000, // 1 分钟内不重新请求
  cacheTime: 300000, // 缓存 5 分钟
}
```

### 9.3 虚拟列表（大量结果时）

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function SearchResultsVirtual({ results }: { results: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 每项高度
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TodoItem todo={results[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```
