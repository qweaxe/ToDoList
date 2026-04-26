'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/api';

interface TimeEntry {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  userId: string;
  categoryId: string | null;
  todoId: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
  todo: TodoRef | null;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
}

interface TodoRef {
  id: string;
  title: string;
}

interface DailyTimeEntriesData {
  date: string;
  entries: TimeEntry[];
  stats: {
    totalDuration: number;
    taskTime: number;
    otherTime: number;
    categoryDistribution: Array<{
      categoryId: string;
      categoryName: string;
      categoryEmoji: string;
      categoryColor: string;
      duration: number;
    }>;
  };
}

// 获取时间记录列表
export function useTimeEntries(params?: {
  date?: string;
  categoryId?: string;
  todoId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set('date', params.date);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.todoId) searchParams.set('todoId', params.todoId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();

  return useQuery<{
    success: boolean;
    data: TimeEntry[];
  }>({
    queryKey: ['time-entries', params],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries${query ? `?${query}` : ''}`);
      return res.json();
    },
  });
}

// 获取日统计数据
export function useDailyTimeEntries(date: string) {
  return useQuery<{
    success: boolean;
    data: DailyTimeEntriesData;
  }>({
    queryKey: ['time-entries', 'daily', date],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries/daily?date=${date}`);
      return res.json();
    },
    enabled: !!date,
  });
}

// 获取单条时间记录
export function useTimeEntry(id: string | null) {
  return useQuery<{
    success: boolean;
    data: TimeEntry;
  }>({
    queryKey: ['time-entries', id],
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const res = await fetch(`/api/time-entries/${id}`);
      return res.json();
    },
    enabled: !!id,
  });
}

// 创建时间记录
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeEntryInput) => {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        toast.success('时间记录已创建');
      } else {
        toast.error(result.error || '创建失败');
      }
    },
    onError: () => {
      toast.error('创建时间记录失败');
    },
  });
}

// 更新时间记录
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimeEntryInput }) => {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        toast.success('时间记录已更新');
      } else {
        toast.error(result.error || '更新失败');
      }
    },
    onError: () => {
      toast.error('更新时间记录失败');
    },
  });
}

// 删除时间记录
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        toast.success('时间记录已删除');
      } else {
        toast.error(result.error || '删除失败');
      }
    },
    onError: () => {
      toast.error('删除时间记录失败');
    },
  });
}