# 智能提醒实现方案

## 一、功能概述

为任务设置提醒，在截止时间前通过浏览器通知或邮件提醒用户，帮助用户按时完成任务。

## 二、数据库模型

### 2.1 现有模型（Reminder 已存在）

```prisma
// prisma/schema.prisma

model Reminder {
  id        String   @id @default(cuid())
  todoId    String
  todo      Todo     @relation(fields: [todoId], references: [id], onDelete: Cascade)
  remindAt  DateTime // 提醒时间
  type      String   // "browser" | "email"
  sent      Boolean  @default(false) // 是否已发送
  createdAt DateTime @default(now())

  @@index([todoId])
  @@index([remindAt])
  @@index([sent])
}
```

### 2.2 Todo 模型关联（已有）

```prisma
model Todo {
  // ... 现有字段
  reminders Reminder[]
}
```

## 三、API 端点

### 3.1 提醒管理 API

#### GET /api/reminders
获取用户所有提醒

```typescript
// src/app/api/reminders/route.ts
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

  const reminders = await d1.all(`
    SELECT r.id, r.todoId, r.remindAt, r.type, r.sent, r.createdAt,
           t.title as todoTitle, t.dueDate
    FROM Reminder r
    JOIN todos t ON r.todoId = t.id
    WHERE t.userId = ?
    ORDER BY r.remindAt ASC
  `, session.user.id);

  return NextResponse.json(reminders);
}
```

#### POST /api/reminders
创建提醒

```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { todoId, remindAt, type = 'browser' } = await request.json();

  if (!todoId || !remindAt) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const d1 = await getD1Client();

  // 验证任务所有权
  const todo = await d1.first(
    'SELECT id FROM todos WHERE id = ? AND userId = ?',
    todoId,
    session.user.id
  );

  if (!todo) {
    return NextResponse.json({ error: '任务不存在' }, { status: 404 });
  }

  const id = cuid();
  await d1.run(
    'INSERT INTO Reminder (id, todoId, remindAt, type, sent, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    todoId,
    new Date(remindAt).toISOString(),
    type,
    0,
    new Date().toISOString()
  );

  return NextResponse.json({ id, todoId, remindAt, type, sent: false });
}
```

#### DELETE /api/reminders/[id]
删除提醒

```typescript
// src/app/api/reminders/[id]/route.ts
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

  // 验证提醒所有权（通过任务关联）
  const reminder = await d1.first(`
    SELECT r.id FROM Reminder r
    JOIN todos t ON r.todoId = t.id
    WHERE r.id = ? AND t.userId = ?
  `, id, session.user.id);

  if (!reminder) {
    return NextResponse.json({ error: '提醒不存在' }, { status: 404 });
  }

  await d1.run('DELETE FROM Reminder WHERE id = ?', id);

  return NextResponse.json({ success: true });
}
```

### 3.2 待发送提醒 API

#### GET /api/reminders/pending
获取待发送的提醒（供前端轮询）

```typescript
// src/app/api/reminders/pending/route.ts
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
  const now = new Date().toISOString();

  // 获取当前时间之前未发送的提醒
  const reminders = await d1.all(`
    SELECT r.id, r.todoId, r.remindAt, r.type,
           t.title as todoTitle, t.description as todoDescription
    FROM Reminder r
    JOIN todos t ON r.todoId = t.id
    WHERE t.userId = ?
      AND r.sent = 0
      AND r.remindAt <= ?
    ORDER BY r.remindAt ASC
  `, session.user.id, now);

  return NextResponse.json(reminders);
}
```

#### POST /api/reminders/[id]/sent
标记提醒为已发送

```typescript
// src/app/api/reminders/[id]/sent/route.ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const d1 = await getD1Client();

  await d1.run('UPDATE Reminder SET sent = 1 WHERE id = ?', id);

  return NextResponse.json({ success: true });
}
```

## 四、前端服务

### 4.1 通知服务

```typescript
// src/lib/notification-service.ts

/** 请求浏览器通知权限 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('浏览器不支持通知');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/** 显示浏览器通知 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (Notification.permission !== 'granted') {
    console.warn('未获得通知权限');
    return null;
  }

  const notification = new Notification(title, {
    icon: '/icon.svg',
    badge: '/icon.svg',
    requireInteraction: true,
    ...options,
  });

  // 点击通知时聚焦窗口
  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

/** 显示任务提醒通知 */
export function showTaskReminder(
  todoTitle: string,
  dueDate?: string
): Notification | null {
  const body = dueDate
    ? `任务将于 ${formatDateTime(dueDate)} 到期`
    : '任务即将到期，请及时处理';

  return showNotification(`⏰ ${todoTitle}`, {
    body,
    tag: 'task-reminder',
  });
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

### 4.2 提醒轮询服务

```typescript
// src/lib/reminder-polling-service.ts

import { showTaskReminder } from './notification-service';

let pollingInterval: NodeJS.Timeout | null = null;
let isPolling = false;

/** 开始提醒轮询 */
export function startReminderPolling(intervalMs: number = 60000) {
  if (pollingInterval) {
    console.warn('提醒轮询已在运行');
    return;
  }

  // 立即检查一次
  checkReminders();

  // 定时轮询
  pollingInterval = setInterval(checkReminders, intervalMs);
  console.log('提醒轮询已启动');
}

/** 停止提醒轮询 */
export function stopReminderPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('提醒轮询已停止');
  }
}

/** 检查待发送提醒 */
async function checkReminders() {
  if (isPolling) return;
  isPolling = true;

  try {
    const response = await fetch('/api/reminders/pending');
    if (!response.ok) {
      console.error('获取提醒失败');
      return;
    }

    const reminders = await response.json();

    for (const reminder of reminders) {
      // 显示通知
      showTaskReminder(reminder.todoTitle, reminder.todoDescription);

      // 标记为已发送
      await fetch(`/api/reminders/${reminder.id}/sent`, {
        method: 'POST',
      });
    }
  } catch (error) {
    console.error('检查提醒出错:', error);
  } finally {
    isPolling = false;
  }
}
```

## 五、前端组件

### 5.1 ReminderPicker - 提醒时间选择器

```typescript
// src/components/reminders/ReminderPicker.tsx
'use client';

import { useState } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 预设提醒时间选项
const REMINDER_PRESETS = [
  { label: '5 分钟前', value: 5 * 60 * 1000 },
  { label: '15 分钟前', value: 15 * 60 * 1000 },
  { label: '30 分钟前', value: 30 * 60 * 1000 },
  { label: '1 小时前', value: 60 * 60 * 1000 },
  { label: '2 小时前', value: 2 * 60 * 60 * 1000 },
  { label: '1 天前', value: 24 * 60 * 60 * 1000 },
];

interface ReminderPickerProps {
  dueDate: string; // ISO 格式
  reminders: { id?: string; remindAt: string; type: string }[];
  onChange: (reminders: { remindAt: string; type: string }[]) => void;
}

export function ReminderPicker({
  dueDate,
  reminders,
  onChange,
}: ReminderPickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handleAddPreset = () => {
    if (!selectedPreset || !dueDate) return;

    const presetMs = parseInt(selectedPreset);
    const dueDateTime = new Date(dueDate).getTime();
    const remindAt = new Date(dueDateTime - presetMs);

    // 检查是否已存在相同时间的提醒
    const exists = reminders.some(
      r => new Date(r.remindAt).getTime() === remindAt.getTime()
    );

    if (exists) {
      alert('该时间的提醒已存在');
      return;
    }

    onChange([
      ...reminders,
      { remindAt: remindAt.toISOString(), type: 'browser' },
    ]);
    setSelectedPreset('');
  };

  const handleRemove = (index: number) => {
    onChange(reminders.filter((_, i) => i !== index));
  };

  const formatRemindTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        提醒
      </Label>

      {reminders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reminders.map((reminder, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
            >
              <span>{formatRemindTime(reminder.remindAt)}</span>
              <button
                onClick={() => handleRemove(index)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {dueDate && (
        <div className="flex gap-2">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="选择提醒时间" />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddPreset} disabled={!selectedPreset}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!dueDate && (
        <p className="text-sm text-muted-foreground">
          请先设置截止时间
        </p>
      )}
    </div>
  );
}
```

### 5.2 NotificationPermission - 通知权限请求

```typescript
// src/components/reminders/NotificationPermission.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestNotificationPermission } from '@/lib/notification-service';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequest = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  if (!('Notification' in window)) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span className="text-sm">浏览器不支持通知</span>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Bell className="h-4 w-4" />
        <span className="text-sm">通知已启用</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span className="text-sm">通知已被禁用，请在浏览器设置中开启</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Bell className="h-4 w-4 text-muted-foreground" />
      <Button size="sm" variant="outline" onClick={handleRequest}>
        启用通知
      </Button>
    </div>
  );
}
```

### 5.3 ReminderSettings - 提醒设置

```typescript
// src/components/reminders/ReminderSettings.tsx
'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPermission } from './NotificationPermission';
import {
  startReminderPolling,
  stopReminderPolling,
} from '@/lib/reminder-polling-service';

export function ReminderSettings() {
  useEffect(() => {
    // 启动提醒轮询
    startReminderPolling(60000); // 每分钟检查一次

    return () => {
      stopReminderPolling();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>提醒设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <NotificationPermission />

        <div className="text-sm text-muted-foreground">
          <p>• 提醒会在任务截止时间前触发</p>
          <p>• 需要浏览器通知权限</p>
          <p>• 请保持页面打开以接收提醒</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 六、React Query Hooks

```typescript
// src/hooks/use-reminders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useReminders() {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: () => fetch('/api/reminders').then(r => r.json()),
  });
}

export function usePendingReminders() {
  return useQuery({
    queryKey: ['reminders', 'pending'],
    queryFn: () => fetch('/api/reminders/pending').then(r => r.json()),
    refetchInterval: 60000, // 每分钟刷新
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { todoId: string; remindAt: string; type?: string }) =>
      fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/reminders/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useMarkReminderSent() {
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/reminders/${id}/sent`, { method: 'POST' }).then(r => r.json()),
  });
}
```

## 七、集成到任务表单

```typescript
// 在 TaskForm.tsx 中添加提醒选择器

import { ReminderPicker } from '@/components/reminders/ReminderPicker';

// 表单状态添加
const [reminders, setReminders] = useState<{ remindAt: string; type: string }[]>([]);

// 提交时创建提醒
const handleSubmit = async (data: TodoFormData) => {
  // 1. 创建任务
  const todo = await createTodo(data);

  // 2. 创建提醒
  for (const reminder of reminders) {
    await createReminder({
      todoId: todo.id,
      remindAt: reminder.remindAt,
      type: reminder.type,
    });
  }
};

// 渲染
<ReminderPicker
  dueDate={form.dueDate}
  reminders={reminders}
  onChange={setReminders}
/>
```

## 八、应用初始化

```typescript
// src/components/providers.tsx 或 layout.tsx

'use client';

import { useEffect } from 'react';
import { startReminderPolling, stopReminderPolling } from '@/lib/reminder-polling-service';
import { requestNotificationPermission } from '@/lib/notification-service';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 请求通知权限
    requestNotificationPermission();

    // 启动提醒轮询
    startReminderPolling(60000);

    return () => {
      stopReminderPolling();
    };
  }, []);

  return <>{children}</>;
}
```

## 九、国际化

```json
// messages/zh.json
{
  "reminders": {
    "title": "提醒设置",
    "enable": "启用通知",
    "enabled": "通知已启用",
    "disabled": "通知已禁用",
    "notSupported": "浏览器不支持通知",
    "permissionHint": "请在浏览器设置中开启通知",
    "addReminder": "添加提醒",
    "removeReminder": "移除提醒",
    "selectTime": "选择提醒时间",
    "setDueDateFirst": "请先设置截止时间",
    "presets": {
      "5min": "5 分钟前",
      "15min": "15 分钟前",
      "30min": "30 分钟前",
      "1hour": "1 小时前",
      "2hours": "2 小时前",
      "1day": "1 天前"
    },
    "hints": [
      "提醒会在任务截止时间前触发",
      "需要浏览器通知权限",
      "请保持页面打开以接收提醒"
    ]
  }
}
```

## 十、实现步骤

1. **API 实现**
   - 创建 `/api/reminders` 端点
   - 创建 `/api/reminders/pending` 端点
   - 创建 `/api/reminders/[id]/sent` 端点

2. **服务实现**
   - 创建 `notification-service.ts`
   - 创建 `reminder-polling-service.ts`

3. **前端组件**
   - 创建 `ReminderPicker` 组件
   - 创建 `NotificationPermission` 组件
   - 创建 `ReminderSettings` 组件

4. **集成**
   - 集成到任务表单
   - 在应用初始化时启动轮询
   - 在设置页面添加提醒设置入口

5. **测试**
   - 测试通知权限请求
   - 测试提醒创建/删除
   - 测试提醒触发

## 十一、工作量估算

- API：1 天
- 服务：0.5 天
- 前端：1 天
- 集成测试：0.5 天

**总计：约 3 天**

## 十二、扩展功能（可选）

### 邮件提醒

需要配置邮件服务（如 Resend、SendGrid）：

```typescript
// src/lib/email-service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail(
  to: string,
  todoTitle: string,
  dueDate: string
) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject: `⏰ 任务提醒：${todoTitle}`,
    html: `
      <h2>任务即将到期</h2>
      <p><strong>${todoTitle}</strong></p>
      <p>截止时间：${dueDate}</p>
    `,
  });
}
```

### Service Worker 离线提醒

```typescript
// public/sw.js
self.addEventListener('push', event => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon.svg',
  });
});
```
