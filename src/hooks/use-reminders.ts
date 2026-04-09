'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

interface Reminder {
  id: string;
  todoId: string;
  remindAt: string;
  type: string;
  offset: number | null;
  sent: boolean;
  createdAt: string;
}

interface ReminderPreset {
  label: string;
  offset: number | null;
  type: 'before_due' | 'custom';
}

// 预设提醒选项
export const REMINDER_PRESETS: ReminderPreset[] = [
  { label: '任务开始时', offset: null, type: 'custom' },
  { label: '截止时', offset: 0, type: 'before_due' },
  { label: '提前5分钟', offset: 5, type: 'before_due' },
  { label: '提前15分钟', offset: 15, type: 'before_due' },
  { label: '提前30分钟', offset: 30, type: 'before_due' },
  { label: '提前1小时', offset: 60, type: 'before_due' },
  { label: '提前2小时', offset: 120, type: 'before_due' },
  { label: '提前1天', offset: 1440, type: 'before_due' },
];

// ==================== Hooks ====================

// 获取任务的提醒列表
export function useTodoReminders(todoId: string | null) {
  return useQuery<{
    success: boolean;
    data: Reminder[];
  }>({
    queryKey: ['reminders', todoId],
    queryFn: async () => {
      if (!todoId) return { success: true, data: [] };
      const res = await fetch(`/api/todos/${todoId}/reminders`);
      return res.json();
    },
    enabled: !!todoId,
  });
}

// 创建提醒
export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      todoId: string;
      remindAt: string;
      type: string;
      offset?: number;
    }) => {
      const res = await fetch(`/api/todos/${data.todoId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['reminders', variables.todoId] });
        toast.success('提醒已创建');
      } else {
        toast.error(result.error || '创建失败');
      }
    },
    onError: () => {
      toast.error('创建提醒失败');
    },
  });
}

// 删除提醒
export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reminderId, todoId }: { reminderId: string; todoId: string }) => {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['reminders', variables.todoId] });
        toast.success('提醒已删除');
      } else {
        toast.error(result.error || '删除失败');
      }
    },
    onError: () => {
      toast.error('删除提醒失败');
    },
  });
}

// 获取待发送的提醒
export function usePendingReminders() {
  return useQuery<{
    success: boolean;
    data: Array<{
      id: string;
      todoId: string;
      todoTitle: string;
      remindAt: string;
      type: string;
      offset: number | null;
    }>;
  }>({
    queryKey: ['reminders', 'pending'],
    queryFn: async () => {
      const res = await fetch('/api/reminders/pending');
      return res.json();
    },
    refetchInterval: 60000, // 每分钟检查一次
  });
}

// 标记提醒为已发送
export function useMarkReminderSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const res = await fetch(`/api/reminders/${reminderId}/sent`, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', 'pending'] });
    },
  });
}
