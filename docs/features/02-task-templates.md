# 任务模板实现方案

## 一、功能概述

允许用户保存常用任务结构为模板，快速创建重复性任务，提高效率。

## 二、数据库模型

### 2.1 新增模型

```prisma
// prisma/schema.prisma

// 任务模板表
model TaskTemplate {
  id          String   @id @default(cuid())
  name        String                    // 模板名称（如"周报"、"会议"）
  title       String                    // 默认任务标题
  description String?                  // 默认任务描述
  categoryId  String?                  // 默认分类 ID
  levelId     String?                   // 默认等级 ID
  isMilestone Boolean  @default(false) // 默认是否里程碑
  subTasks    String?                  // JSON 格式的子任务列表
  userId      String                    // 所属用户
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

### 2.2 子任务 JSON 格式

```typescript
// subTasks 字段存储的 JSON 格式
interface SubTaskTemplate {
  title: string;
  completed?: boolean; // 默认 false
}

// 示例
const subTasksJson = JSON.stringify([
  { title: "收集数据", completed: false },
  { title: "整理文档", completed: false },
  { title: "提交审核", completed: false },
]);
```

## 三、API 端点

### 3.1 模板管理 API

#### GET /api/templates
获取当前用户所有模板

```typescript
// src/app/api/templates/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getD1Client } from '@/lib/d1';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const d1 = await getD1Client();
  const templates = await d1.all<TaskTemplate>(
    `SELECT id, name, title, description, categoryId, levelId, isMilestone, subTasks, createdAt
     FROM TaskTemplate 
     WHERE userId = ? 
     ORDER BY name`,
    session.user.id
  );

  return NextResponse.json(templates);
}
```

#### POST /api/templates
创建新模板

```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const body = await request.json();
  const { name, title, description, categoryId, levelId, isMilestone, subTasks } = body;

  if (!name || !title) {
    return NextResponse.json({ error: '模板名称和标题不能为空' }, { status: 400 });
  }

  const d1 = await getD1Client();
  const id = cuid();

  await d1.run(
    `INSERT INTO TaskTemplate (id, name, title, description, categoryId, levelId, isMilestone, subTasks, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    name,
    title,
    description || null,
    categoryId || null,
    levelId || null,
    isMilestone ? 1 : 0,
    subTasks ? JSON.stringify(subTasks) : null,
    session.user.id,
    new Date().toISOString(),
    new Date().toISOString()
  );

  return NextResponse.json({ id, ...body });
}
```

#### PUT /api/templates/[id]
更新模板

```typescript
// src/app/api/templates/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, title, description, categoryId, levelId, isMilestone, subTasks } = body;

  const d1 = await getD1Client();

  // 验证模板所有权
  const existing = await d1.first<TaskTemplate>(
    'SELECT id FROM TaskTemplate WHERE id = ? AND userId = ?',
    id,
    session.user.id
  );

  if (!existing) {
    return NextResponse.json({ error: '模板不存在' }, { status: 404 });
  }

  await d1.run(
    `UPDATE TaskTemplate 
     SET name = ?, title = ?, description = ?, categoryId = ?, levelId = ?, isMilestone = ?, subTasks = ?, updatedAt = ?
     WHERE id = ?`,
    name,
    title,
    description || null,
    categoryId || null,
    levelId || null,
    isMilestone ? 1 : 0,
    subTasks ? JSON.stringify(subTasks) : null,
    new Date().toISOString(),
    id
  );

  return NextResponse.json({ success: true });
}
```

#### DELETE /api/templates/[id]
删除模板

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

  const result = await d1.run(
    'DELETE FROM TaskTemplate WHERE id = ? AND userId = ?',
    id,
    session.user.id
  );

  return NextResponse.json({ success: true });
}
```

### 3.2 从模板创建任务

#### POST /api/templates/[id]/apply
从模板创建任务实例

```typescript
// src/app/api/templates/[id]/apply/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getD1Client } from '@/lib/d1';
import cuid from 'cuid';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id: templateId } = await params;
  const body = await request.json();

  // 可选：覆盖日期
  const { startDate, dueDate } = body;

  const d1 = await getD1Client();

  // 获取模板
  const template = await d1.first<TaskTemplate>(
    'SELECT * FROM TaskTemplate WHERE id = ? AND userId = ?',
    templateId,
    session.user.id
  );

  if (!template) {
    return NextResponse.json({ error: '模板不存在' }, { status: 404 });
  }

  const todoId = cuid();
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // 创建任务
  await d1.run(
    `INSERT INTO todos (id, title, description, startDate, dueDate, status, categoryId, levelId, isMilestone, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    todoId,
    template.title,
    template.description,
    startDate || today,
    dueDate || today,
    'pending',
    template.categoryId,
    template.levelId,
    template.isMilestone ? 1 : 0,
    session.user.id,
    now,
    now
  );

  // 创建子任务
  if (template.subTasks) {
    const subTasks = JSON.parse(template.subTasks);
    for (const subTask of subTasks) {
      const subTaskId = cuid();
      await d1.run(
        `INSERT INTO todos (id, title, startDate, dueDate, status, parentId, userId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        subTaskId,
        subTask.title,
        startDate || today,
        dueDate || today,
        'pending',
        todoId,
        session.user.id,
        now,
        now
      );
    }
  }

  return NextResponse.json({ id: todoId, success: true });
}
```

## 四、前端组件

### 4.1 TemplateList - 模板列表

```typescript
// src/components/templates/TemplateList.tsx
'use client';

import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { useTemplates, useDeleteTemplate } from '@/hooks/use-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateForm } from './TemplateForm';
import { TemplateApplyDialog } from './TemplateApplyDialog';
import { useState } from 'react';

export function TemplateList() {
  const { data: templates = [], isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">任务模板</h2>
        <Button onClick={() => setEditingId('new')}>
          <Plus className="h-4 w-4 mr-2" />
          新建模板
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无模板，点击上方按钮创建
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.title}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setApplyingId(template.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(template.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {template.subTasks && (
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    子任务：{JSON.parse(template.subTasks).length} 项
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 编辑/新建对话框 */}
      {editingId && (
        <TemplateForm
          templateId={editingId === 'new' ? null : editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* 应用模板对话框 */}
      {applyingId && (
        <TemplateApplyDialog
          templateId={applyingId}
          onClose={() => setApplyingId(null)}
        />
      )}
    </div>
  );
}
```

### 4.2 TemplateForm - 模板表单

```typescript
// src/components/templates/TemplateForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '@/hooks/use-templates';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TemplateFormProps {
  templateId: string | null; // null = 新建
  onClose: () => void;
}

export function TemplateForm({ templateId, onClose }: TemplateFormProps) {
  const { data: existingTemplate } = useTemplate(templateId || '');
  const { data: categories = [] } = useCategories();
  const { data: levels = [] } = useLevels();

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    categoryId: '',
    levelId: '',
    isMilestone: false,
    subTasks: [] as { title: string }[],
  });

  useEffect(() => {
    if (existingTemplate) {
      setForm({
        name: existingTemplate.name,
        title: existingTemplate.title,
        description: existingTemplate.description || '',
        categoryId: existingTemplate.categoryId || '',
        levelId: existingTemplate.levelId || '',
        isMilestone: existingTemplate.isMilestone,
        subTasks: existingTemplate.subTasks
          ? JSON.parse(existingTemplate.subTasks)
          : [],
      });
    }
  }, [existingTemplate]);

  const handleSubmit = async () => {
    const data = {
      ...form,
      categoryId: form.categoryId || null,
      levelId: form.levelId || null,
    };

    if (templateId) {
      await updateTemplate.mutateAsync({ id: templateId, ...data });
    } else {
      await createTemplate.mutateAsync(data);
    }

    onClose();
  };

  const addSubTask = () => {
    setForm(prev => ({
      ...prev,
      subTasks: [...prev.subTasks, { title: '' }],
    }));
  };

  const updateSubTask = (index: number, title: string) => {
    setForm(prev => ({
      ...prev,
      subTasks: prev.subTasks.map((st, i) => (i === index ? { title } : st)),
    }));
  };

  const removeSubTask = (index: number) => {
    setForm(prev => ({
      ...prev,
      subTasks: prev.subTasks.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {templateId ? '编辑模板' : '新建模板'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>模板名称</Label>
            <Input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="如：周报、会议记录"
            />
          </div>

          <div>
            <Label>任务标题</Label>
            <Input
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="任务标题"
            />
          </div>

          <div>
            <Label>描述（可选）</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>分类</Label>
              <Select
                value={form.categoryId}
                onValueChange={v => setForm(prev => ({ ...prev, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>等级</Label>
              <Select
                value={form.levelId}
                onValueChange={v => setForm(prev => ({ ...prev, levelId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择等级" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>子任务</Label>
            <div className="space-y-2">
              {form.subTasks.map((st, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={st.title}
                    onChange={e => updateSubTask(i, e.target.value)}
                    placeholder={`子任务 ${i + 1}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSubTask(i)}
                  >
                    删除
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addSubTask}>
                添加子任务
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.3 TemplateApplyDialog - 应用模板对话框

```typescript
// src/components/templates/TemplateApplyDialog.tsx
'use client';

import { useState } from 'react';
import { useTemplate, useApplyTemplate } from '@/hooks/use-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TemplateApplyDialogProps {
  templateId: string;
  onClose: () => void;
}

export function TemplateApplyDialog({ templateId, onClose }: TemplateApplyDialogProps) {
  const { data: template } = useTemplate(templateId);
  const applyTemplate = useApplyTemplate();

  const [dates, setDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
  });

  const handleApply = async () => {
    await applyTemplate.mutateAsync({
      templateId,
      ...dates,
    });
    onClose();
  };

  if (!template) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>从模板创建任务</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-muted-foreground">{template.title}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>开始日期</Label>
              <Input
                type="date"
                value={dates.startDate}
                onChange={e => setDates(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>截止日期</Label>
              <Input
                type="date"
                value={dates.dueDate}
                onChange={e => setDates(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleApply}>
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.4 TemplateSelector - 快速选择模板

```typescript
// src/components/templates/TemplateSelector.tsx
'use client';

import { FileText } from 'lucide-react';
import { useTemplates } from '@/hooks/use-templates';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const { data: templates = [] } = useTemplates();

  if (templates.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          模板
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {templates.map(template => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template.id)}
          >
            {template.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4.5 SaveAsTemplateDialog - 保存为模板

```typescript
// src/components/templates/SaveAsTemplateDialog.tsx
'use client';

import { useState } from 'react';
import { useCreateTemplate } from '@/hooks/use-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Todo {
  id: string;
  title: string;
  description?: string | null;
  categoryId?: string | null;
  levelId?: string | null;
  isMilestone: boolean;
  subTasks?: { title: string }[];
}

interface SaveAsTemplateDialogProps {
  todo: Todo;
  onClose: () => void;
}

export function SaveAsTemplateDialog({ todo, onClose }: SaveAsTemplateDialogProps) {
  const createTemplate = useCreateTemplate();
  const [name, setName] = useState(todo.title);

  const handleSave = async () => {
    await createTemplate.mutateAsync({
      name,
      title: todo.title,
      description: todo.description,
      categoryId: todo.categoryId,
      levelId: todo.levelId,
      isMilestone: todo.isMilestone,
      subTasks: todo.subTasks,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>保存为模板</DialogTitle>
        </DialogHeader>

        <div>
          <Label>模板名称</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="模板名称"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 五、React Query Hooks

```typescript
// src/hooks/use-templates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => fetch('/api/templates').then(r => r.json()),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => fetch(`/api/templates/${id}`).then(r => r.json()),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string } & any) =>
      fetch(`/api/templates/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/templates/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useApplyTemplate() {
  return useMutation({
    mutationFn: (data: { templateId: string; startDate?: string; dueDate?: string }) =>
      fetch(`/api/templates/${data.templateId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
  });
}
```

## 六、国际化

```json
// messages/zh.json
{
  "templates": {
    "title": "任务模板",
    "create": "新建模板",
    "edit": "编辑模板",
    "delete": "删除模板",
    "apply": "从模板创建",
    "saveAsTemplate": "保存为模板",
    "name": "模板名称",
    "taskTitle": "任务标题",
    "description": "描述",
    "category": "分类",
    "level": "等级",
    "subTasks": "子任务",
    "addSubTask": "添加子任务",
    "noTemplates": "暂无模板",
    "confirmDelete": "确定删除此模板？",
    "selectDate": "选择日期",
    "startDate": "开始日期",
    "dueDate": "截止日期",
    "createTask": "创建任务"
  }
}
```

## 七、实现步骤

1. **数据库迁移**
   - 添加 `TaskTemplate` 模型
   - 运行迁移

2. **API 实现**
   - 创建 `/api/templates` 端点
   - 创建 `/api/templates/[id]/apply` 端点

3. **前端实现**
   - 创建 hooks
   - 创建组件
   - 在任务表单添加"从模板创建"按钮
   - 在任务详情添加"保存为模板"按钮

4. **集成**
   - 在设置页面添加模板管理入口
   - 在日视图添加快速创建入口

## 八、工作量估算

- 数据库：0.5 天
- API：0.5 天
- 前端：1 天
- 测试：0.5 天

**总计：约 2.5 天**
