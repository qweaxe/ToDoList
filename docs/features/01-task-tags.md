# 任务标签系统实现方案

## 一、功能概述

为任务添加多标签支持，区别于单一分类，允许任务属于多个标签，便于灵活筛选和组织。

## 二、数据库模型

### 2.1 新增模型

```prisma
// prisma/schema.prisma

// 标签表
model Tag {
  id        String   @id @default(cuid())
  name      String                    // 标签名称
  color     String   @default("#6366f1") // hex 颜色，默认靛蓝色
  userId    String                    // 所属用户
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  todos     TodoTag[]                 // 关联的任务
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// 任务-标签多对多关联表
model TodoTag {
  todoId   String
  tagId    String
  todo     Todo @relation(fields: [todoId], references: [id], onDelete: Cascade)
  tag      Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@primaryKey([todoId, tagId])
  @@index([tagId])
}
```

### 2.2 修改现有模型

```prisma
// Todo 模型添加关联
model Todo {
  // ... 现有字段保持不变
  tags     TodoTag[]  // 新增：任务标签关联
}
```

## 三、API 端点

### 3.1 标签管理 API

#### GET /api/tags
获取当前用户所有标签

```typescript
// src/app/api/tags/route.ts
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const d1 = await getD1Client();
  const tags = await d1.all<Tag>(
    'SELECT id, name, color, createdAt FROM tags WHERE userId = ? ORDER BY name',
    session.user.id
  );

  // 获取每个标签的任务数量
  for (const tag of tags) {
    const count = await d1.first<{ count: number }>(
      'SELECT COUNT(*) as count FROM TodoTag WHERE tagId = ?',
      tag.id
    );
    (tag as any).todoCount = count?.count || 0;
  }

  return NextResponse.json(tags);
}
```

#### POST /api/tags
创建新标签

```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { name, color } = await request.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 });
  }

  // 检查是否已存在同名标签
  const d1 = await getD1Client();
  const existing = await d1.first<Tag>(
    'SELECT id FROM tags WHERE userId = ? AND name = ?',
    session.user.id,
    name.trim()
  );

  if (existing) {
    return NextResponse.json({ error: '标签已存在' }, { status: 400 });
  }

  const id = cuid();
  await d1.run(
    'INSERT INTO tags (id, name, color, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    name.trim(),
    color || '#6366f1',
    session.user.id,
    new Date().toISOString(),
    new Date().toISOString()
  );

  return NextResponse.json({ id, name: name.trim(), color: color || '#6366f1' });
}
```

#### PUT /api/tags/[id]
更新标签

```typescript
// src/app/api/tags/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const { name, color } = await request.json();

  const d1 = await getD1Client();

  // 验证标签所有权
  const existing = await d1.first<Tag>(
    'SELECT id FROM tags WHERE id = ? AND userId = ?',
    id,
    session.user.id
  );

  if (!existing) {
    return NextResponse.json({ error: '标签不存在' }, { status: 404 });
  }

  await d1.run(
    'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
    name.trim(),
    color,
    new Date().toISOString(),
    id
  );

  return NextResponse.json({ success: true });
}
```

#### DELETE /api/tags/[id]
删除标签

```typescript
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

  // 验证标签所有权
  const existing = await d1.first<Tag>(
    'SELECT id FROM tags WHERE id = ? AND userId = ?',
    id,
    session.user.id
  );

  if (!existing) {
    return NextResponse.json({ error: '标签不存在' }, { status: 404 });
  }

  // 删除关联（级联删除会自动处理）
  await d1.run('DELETE FROM TodoTag WHERE tagId = ?', id);
  await d1.run('DELETE FROM tags WHERE id = ?', id);

  return NextResponse.json({ success: true });
}
```

### 3.2 任务标签关联 API

#### POST /api/todos/[id]/tags
为任务添加标签

```typescript
// src/app/api/todos/[id]/tags/route.ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id: todoId } = await params;
  const { tagIds } = await request.json(); // string[]

  const d1 = await getD1Client();

  // 验证任务所有权
  const todo = await d1.first<Todo>(
    'SELECT id FROM todos WHERE id = ? AND userId = ?',
    todoId,
    session.user.id
  );

  if (!todo) {
    return NextResponse.json({ error: '任务不存在' }, { status: 404 });
  }

  // 批量添加标签关联
  for (const tagId of tagIds) {
    await d1.run(
      'INSERT OR IGNORE INTO TodoTag (todoId, tagId, createdAt) VALUES (?, ?, ?)',
      todoId,
      tagId,
      new Date().toISOString()
    );
  }

  return NextResponse.json({ success: true });
}
```

#### DELETE /api/todos/[id]/tags/[tagId]
移除任务的某个标签

```typescript
// src/app/api/todos/[id]/tags/[tagId]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id: todoId, tagId } = await params;
  const d1 = await getD1Client();

  await d1.run(
    'DELETE FROM TodoTag WHERE todoId = ? AND tagId = ?',
    todoId,
    tagId
  );

  return NextResponse.json({ success: true });
}
```

## 四、前端组件

### 4.1 TagSelector - 标签选择器

```typescript
// src/components/tags/TagSelector.tsx
'use client';

import { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTags, useCreateTag } from '@/hooks/use-tags';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  const handleToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tag = await createTag.mutateAsync({ name: newTagName });
    onChange([...selectedTagIds, tag.id]);
    setNewTagName('');
  };

  return (
    <div className="flex flex-wrap gap-1">
      {selectedTags.map(tag => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.color }}
          className="text-white"
        >
          {tag.name}
          <button
            onClick={() => onChange(selectedTagIds.filter(id => id !== tag.id))}
            className="ml-1 hover:opacity-70"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2">
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <div className="max-h-40 overflow-auto">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleToggle(tag.id)}
                  className="flex items-center gap-2 w-full px-2 py-1 hover:bg-muted rounded"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left">{tag.name}</span>
                  {selectedTagIds.includes(tag.id) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t pt-2 flex gap-1">
              <Input
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="新建标签..."
                className="h-8"
              />
              <Button size="sm" onClick={handleCreateTag}>
                添加
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

### 4.2 TagBadge - 标签徽章

```typescript
// src/components/tags/TagBadge.tsx
import { Badge } from '@/components/ui/badge';

interface TagBadgeProps {
  name: string;
  color: string;
  onClick?: () => void;
}

export function TagBadge({ name, color, onClick }: TagBadgeProps) {
  return (
    <Badge
      style={{ backgroundColor: color }}
      className="text-white cursor-pointer"
      onClick={onClick}
    >
      {name}
    </Badge>
  );
}
```

### 4.3 TagFilter - 标签筛选

```typescript
// src/components/tags/TagFilter.tsx
'use client';

import { useTags } from '@/hooks/use-tags';
import { TagBadge } from './TagBadge';

interface TagFilterProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTagIds, onChange }: TagFilterProps) {
  const { data: tags = [] } = useTags();

  const handleToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">标签筛选：</span>
      {tags.map(tag => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={selectedTagIds.includes(tag.id) ? tag.color : '#888'}
          onClick={() => handleToggle(tag.id)}
        />
      ))}
      {selectedTagIds.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
```

### 4.4 TagManager - 标签管理页面

```typescript
// src/components/tags/TagManager.tsx
'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTags, useUpdateTag, useDeleteTag } from '@/hooks/use-tags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function TagManager() {
  const { data: tags = [] } = useTags();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSave = async () => {
    if (!editingTag) return;
    await updateTag.mutateAsync({
      id: editingTag.id,
      name: editName,
      color: editColor,
    });
    setEditingTag(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除此标签？')) {
      await deleteTag.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">标签管理</h2>

      <div className="grid gap-2">
        {tags.map(tag => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
              <span className="text-sm text-muted-foreground">
                ({tag.todoCount} 个任务)
              </span>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleEdit(tag)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(tag.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">名称</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">颜色</label>
              <Input
                type="color"
                value={editColor}
                onChange={e => setEditColor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## 五、React Query Hooks

```typescript
// src/hooks/use-tags.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => fetch('/api/tags').then(r => r.json()),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; name: string; color: string }) =>
      fetch(`/api/tags/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/tags/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useTodoTags(todoId: string) {
  return useQuery({
    queryKey: ['todos', todoId, 'tags'],
    queryFn: () => fetch(`/api/todos/${todoId}/tags`).then(r => r.json()),
  });
}

export function useAddTagsToTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { todoId: string; tagIds: string[] }) =>
      fetch(`/api/todos/${data.todoId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: data.tagIds }),
      }).then(r => r.json()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['todos', variables.todoId, 'tags'],
      });
    },
  });
}
```

## 六、国际化

```json
// messages/zh.json
{
  "tags": {
    "title": "标签管理",
    "create": "创建标签",
    "edit": "编辑标签",
    "delete": "删除标签",
    "name": "标签名称",
    "color": "颜色",
    "confirmDelete": "确定删除此标签？",
    "alreadyExists": "标签已存在",
    "filterByTag": "按标签筛选",
    "clearFilter": "清除筛选",
    "noTags": "暂无标签",
    "addTag": "添加标签",
    "removeTag": "移除标签",
    "todoCount": "{{count}} 个任务"
  }
}
```

## 七、实现步骤

1. **数据库迁移**
   - 更新 `prisma/schema.prisma`
   - 运行 `bun run db:push` 或创建迁移

2. **API 实现**
   - 创建 `/api/tags` 端点
   - 创建 `/api/todos/[id]/tags` 端点
   - 更新任务查询接口返回标签信息

3. **前端实现**
   - 创建 hooks
   - 创建组件
   - 集成到任务表单
   - 添加筛选功能

4. **测试**
   - 创建/编辑/删除标签
   - 为任务添加/移除标签
   - 标签筛选功能

## 八、工作量估算

- 数据库：0.5 天
- API：1 天
- 前端：1.5 天
- 测试：0.5 天

**总计：约 3 天**
