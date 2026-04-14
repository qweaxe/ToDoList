'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface InboxItem {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  convertedToTodoId: string | null;
  convertedAt: string | null;
}

/**
 * 获取捕获箱条目列表
 */
export function useInboxItems(includeConverted = false) {
  return useQuery<{
    success: boolean;
    data: InboxItem[];
  }>({
    queryKey: ['inbox', includeConverted],
    queryFn: async () => {
      const params = includeConverted ? '?includeConverted=true' : '';
      const res = await fetch(`/api/inbox${params}`);
      return res.json();
    },
  });
}

/**
 * 获取捕获箱未处理条目数（用于侧边栏徽章）
 */
export function useInboxCount() {
  return useQuery<{
    success: boolean;
    data: { count: number };
  }>({
    queryKey: ['inbox', 'count'],
    queryFn: async () => {
      const res = await fetch('/api/inbox/count');
      return res.json();
    },
    staleTime: 30 * 1000, // 30 秒
  });
}

/**
 * 创建捕获箱条目（乐观更新）
 */
export function useCreateInboxItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onMutate: async (content: string) => {
      // 取消进行中的查询
      await queryClient.cancelQueries({ queryKey: ['inbox'] });

      // 保存旧数据
      const previousData = queryClient.getQueryData(['inbox', false]);

      // 乐观更新：在列表顶部插入临时条目
      const tempItem: InboxItem = {
        id: `temp-${Date.now()}`,
        content,
        userId: '',
        createdAt: new Date().toISOString(),
        convertedToTodoId: null,
        convertedAt: null,
      };

      queryClient.setQueryData<{ success: boolean; data: InboxItem[] }>(
        ['inbox', false],
        (old) => {
          if (!old?.data) return { success: true, data: [tempItem] };
          return { ...old, data: [tempItem, ...old.data] };
        }
      );

      // 同时更新计数
      queryClient.setQueryData<{ success: boolean; data: { count: number } }>(
        ['inbox', 'count'],
        (old) => {
          if (!old?.data) return { success: true, data: { count: 1 } };
          return { ...old, data: { count: old.data.count + 1 } };
        }
      );

      return { previousData };
    },
    onError: (_error, _content, context) => {
      // 回滚
      if (context?.previousData) {
        queryClient.setQueryData(['inbox', false], context.previousData);
      }
    },
    onSettled: () => {
      // 重新获取数据
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

/**
 * 更新捕获箱条目内容
 */
export function useUpdateInboxItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/inbox/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

/**
 * 删除捕获箱条目（乐观更新）
 */
export function useDeleteInboxItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inbox/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['inbox'] });

      const previousData = queryClient.getQueryData(['inbox', false]);

      // 乐观更新：从列表移除
      queryClient.setQueryData<{ success: boolean; data: InboxItem[] }>(
        ['inbox', false],
        (old) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.filter((item) => item.id !== id) };
        }
      );

      // 更新计数
      queryClient.setQueryData<{ success: boolean; data: { count: number } }>(
        ['inbox', 'count'],
        (old) => {
          if (!old?.data) return old;
          return { ...old, data: { count: Math.max(0, old.data.count - 1) } };
        }
      );

      return { previousData };
    },
    onError: (_error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['inbox', false], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

/**
 * 将捕获箱条目转化为任务
 */
export function useConvertInboxItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        description?: string;
        startDate: string;
        dueDate: string;
        categoryId?: string;
        levelId?: string;
      };
    }) => {
      const res = await fetch(`/api/inbox/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      // 同时刷新 inbox 和 todos
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
