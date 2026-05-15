'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { CreateTodoInput, UpdateTodoInput } from '@/types/api';
import { mutationManager, isAbortError } from '@/lib/mutation-manager';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string; // ISO 8601 datetime string from API
  dueDate: string;   // ISO 8601 datetime string from API
  completedAt: string | null;
  subTasks: string | null;
  isCycleTask: boolean;
  recurrenceRuleId: string | null;
  recurrenceRule: RecurrenceRule | null;
  parentRuleId: string | null;
  categoryId: string | null;
  category: Category | null;
  levelId: string | null;
  level: Level | null;
  priority: number;
  isMilestone: boolean;
  estimatedDuration: number | null;  // 预计耗时（分钟）
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

interface Level {
  id: string;
  name: string;
  value: number;
}

interface RecurrenceRule {
  id: string;
  frequency: string;
  interval: number;
  byDay: string | null;
  cronExpr: string | null;
  startDate: string; // ISO 8601 datetime string from API
  endDate: string | null;
  isActive: boolean;
}

// 获取任务列表
export function useTodos(params?: {
  status?: string;
  categoryId?: string;
  levelId?: string;
  startDate?: string;
  endDate?: string;
  isMilestone?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.levelId) searchParams.set('levelId', params.levelId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.isMilestone) searchParams.set('isMilestone', 'true');

  const query = searchParams.toString();

  return useQuery<{
    success: boolean;
    data: Todo[];
  }>({
    queryKey: ['todos', params],
    queryFn: async () => {
      const res = await fetch(`/api/todos${query ? `?${query}` : ''}`);
      return res.json();
    },
  });
}

// 获取每日任务
export function useDailyTodos(date?: string) {
  const params = date ? `?date=${date}` : '';

  return useQuery<{
    success: boolean;
    data: {
      date: string;
      today: {
        pending: Todo[];
        completed: Todo[];
        total: number;
        completedCount: number;
      };
      overdue: Todo[];
      overdueCount: number;
    };
  }>({
    queryKey: ['todos', 'daily', date],
    queryFn: async () => {
      const res = await fetch(`/api/todos/daily${params}`);
      return res.json();
    },
  });
}

// 获取月度任务
export function useMonthlyTodos(year: number, month: number) {
  return useQuery<{
    success: boolean;
    data: {
      year: number;
      month: number;
      tasks: Record<string, Todo[]>;
      stats: {
        total: number;
        completed: number;
        pending: number;
        completionRate: number;
      };
    };
  }>({
    queryKey: ['todos', 'monthly', year, month],
    queryFn: async () => {
      const res = await fetch(`/api/todos/monthly?year=${year}&month=${month}`);
      return res.json();
    },
  });
}

// 获取单个任务
export function useTodo(id: string | null) {
  return useQuery<{
    success: boolean;
    data: Todo;
  }>({
    queryKey: ['todos', id],
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const res = await fetch(`/api/todos/${id}`);
      return res.json();
    },
    enabled: !!id,
  });
}

// 创建任务
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodoInput) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success('Task created successfully');
      } else {
        toast.error(result.error || 'Creation failed');
      }
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });
}

// 更新任务
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoInput }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success('Task updated successfully');
      } else {
        toast.error(result.error || 'Update failed');
      }
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });
}

// 切换任务状态（乐观更新 + 请求取消）
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 创建 AbortController，自动取消之前的请求
      const controller = mutationManager.createController(`toggle-${id}`);

      const res = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      // 清理 controller
      mutationManager.clear(`toggle-${id}`);

      // 检查是否被取消
      if (controller.signal.aborted) {
        return { cancelled: true };
      }

      return res.json();
    },
    onMutate: async (id: string) => {
      // 取消所有进行中的查询，防止乐观更新被覆盖
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // 获取所有 todos 相关的查询
      const queries = queryClient.getQueriesData({ queryKey: ['todos'] });

      // 保存旧数据用于回滚
      const previousData = new Map(queries);

      // 更新每个查询中的任务状态
      queries.forEach(([queryKey, data]) => {
        if (!data) return;

        // 递归更新数据中的任务
        const updateTodoInData = (obj: unknown): unknown => {
          if (!obj || typeof obj !== 'object') return obj;

          if (Array.isArray(obj)) {
            return obj.map(item => updateTodoInData(item));
          }

          const record = obj as Record<string, unknown>;

          // 如果是 todo 对象且 id 匹配
          if (record.id === id && typeof record.status === 'string') {
            const newStatus = record.status === 'completed' ? 'pending' : 'completed';
            // 使用本地日期而非 UTC 日期
            const today = format(new Date(), 'yyyy-MM-dd');
            return {
              ...record,
              status: newStatus,
              completedAt: newStatus === 'completed' ? today : null,
            };
          }

          // 递归处理嵌套对象
          const result: Record<string, unknown> = {};
          for (const key in record) {
            result[key] = updateTodoInData(record[key]);
          }
          return result;
        };

        queryClient.setQueryData(queryKey, updateTodoInData(data));
      });

      return { previousData };
    },
    onError: (error, _id, context) => {
      // 如果是取消错误，不处理
      if (isAbortError(error)) return;

      // 回滚到之前的数据
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to toggle status');
    },
    onSettled: () => {
      // 重新获取数据确保同步
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onSuccess: (result) => {
      // 如果是被取消的请求，不处理
      if (result?.cancelled) return;

      if (result.success) {
        toast.success(result.data?.status === 'completed' ? 'Task completed' : 'Task restored');

        // 同步 toggle 状态到 PiP 悬浮窗
        try {
          const { getPipManager } = require('@/components/pip/PiPManager');
          const pipManager = getPipManager();
          if (pipManager.isOpen()) {
            pipManager.sendTaskToggle(
              result.data?.id ?? '',
              result.data?.status ?? 'pending'
            );
          }
        } catch {}
      } else {
        toast.error(result.error || 'Operation failed');
      }
    },
  });
}

// 获取周任务
export function useWeeklyTodos(date?: string) {
  const params = date ? `?date=${date}` : '';

  return useQuery<{
    success: boolean;
    data: {
      weekNumber: number;
      startDate: string;
      endDate: string;
      dates: Array<{
        date: string;
        dayName: string;
        dayNumber: string;
        isToday: boolean;
        isWeekend: boolean;
      }>;
      tasksByDate: Record<string, Todo[]>;
      stats: {
        total: number;
        completed: number;
        pending: number;
        completionRate: number;
      };
      importantTasks: Todo[];
    };
  }>({
    queryKey: ['todos', 'weekly', date],
    queryFn: async () => {
      const res = await fetch(`/api/todos/weekly${params}`);
      return res.json();
    },
  });
}

// 获取季度数据
export function useQuarterlyTodos(date?: string) {
  const params = date ? `?date=${date}` : '';

  return useQuery<{
    success: boolean;
    data: {
      year: number;
      quarter: number;
      startDate: string;
      endDate: string;
      months: Array<{
        month: string;
        monthNumber: number;
        total: number;
        completed: number;
        pending: number;
        completionRate: number;
      }>;
      milestones: Array<{
        id: string;
        title: string;
        description?: string | null;
        startDate: string;
        dueDate: string;
        status: string;
        category?: { id: string; name: string; emoji?: string | null } | null;
        level?: { id: string; name: string; value: number } | null;
      }>;
      stats: {
        total: number;
        completed: number;
        pending: number;
        completionRate: number;
        highPriority: number;
        milestoneCount: number;
        completedMilestones: number;
      };
    };
  }>({
    queryKey: ['todos', 'quarterly', date],
    queryFn: async () => {
      const res = await fetch(`/api/todos/quarterly${params}`);
      return res.json();
    },
  });
}

// 获取年度统计
export function useYearlyStats(year: number) {
  return useQuery<{
    success: boolean;
    data: {
      year: number;
      heatmap: Array<{
        date: string;
        dayOfWeek: number;
        week: number;
        month: number;
        count: number;
        level: number;
      }>;
      monthlyStats: Array<{
        month: number;
        monthName: string;
        completed: number;
      }>;
      categoryStats: Array<{
        id: string;
        name: string;
        count: number;
      }>;
      summary: {
        totalCompleted: number;
        activeDays: number;
        avgPerDay: string;
        longestStreak: number;
        mostProductiveMonth: { month: string; completed: number };
        topCategory: { id: string; name: string; count: number } | null;
      };
    };
  }>({
    queryKey: ['todos', 'yearly', year],
    queryFn: async () => {
      const res = await fetch(`/api/todos/yearly?year=${year}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// 更新完成日期
export function useUpdateCompletedAt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completedAt }: { id: string; completedAt: string | null }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success('Completion date updated');
      } else {
        toast.error(result.error || 'Update failed');
      }
    },
    onError: () => {
      toast.error('Failed to update completion date');
    },
  });
}

// 删除任务
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success('Task deleted successfully');
      } else {
        toast.error(result.error || 'Deletion failed');
      }
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });
}

// 批量删除任务
export function useBatchDeleteTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/todos/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Deletion failed');
      }
    },
    onError: () => {
      toast.error('Batch deletion failed');
    },
  });
}

// 批量更新任务
export function useBatchUpdateTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Record<string, unknown> }) => {
      const res = await fetch('/api/todos/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ids, data }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Update failed');
      }
    },
    onError: () => {
      toast.error('Batch update failed');
    },
  });
}

// 更新子任务状态（乐观更新 + 请求取消）
export function useUpdateSubTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subTaskId, isDone }: { taskId: string; subTaskId: string; isDone: boolean }) => {
      // 创建 AbortController，自动取消之前的请求
      const controller = mutationManager.createController(`subtask-${taskId}-${subTaskId}`);

      const res = await fetch(`/api/todos/${taskId}/subtask`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subTaskId, isDone }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Request failed with status ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      // 清理 controller
      mutationManager.clear(`subtask-${taskId}-${subTaskId}`);

      // 检查是否被取消
      if (controller.signal.aborted) {
        return { cancelled: true };
      }

      return res.json();
    },
    onMutate: async ({ taskId, subTaskId, isDone }) => {
      // 取消进行中的查询
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // 获取所有 todos 相关的查询
      const queries = queryClient.getQueriesData({ queryKey: ['todos'] });
      const previousData = new Map(queries);

      // 更新每个查询中的子任务状态
      queries.forEach(([queryKey, data]) => {
        if (!data) return;

        const updateSubTaskInData = (obj: unknown): unknown => {
          if (!obj || typeof obj !== 'object') return obj;

          if (Array.isArray(obj)) {
            return obj.map(item => updateSubTaskInData(item));
          }

          const record = obj as Record<string, unknown>;

          // 如果是任务对象且 id 匹配，更新其子任务
          if (record.id === taskId && typeof record.subTasks === 'string') {
            try {
              const subTasks = JSON.parse(record.subTasks as string);
              const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) =>
                st.id === subTaskId ? { ...st, isDone } : st
              );
              return {
                ...record,
                subTasks: JSON.stringify(updatedSubTasks),
              };
            } catch {
              return record;
            }
          }

          // 递归处理嵌套对象
          const result: Record<string, unknown> = {};
          for (const key in record) {
            result[key] = updateSubTaskInData(record[key]);
          }
          return result;
        };

        queryClient.setQueryData(queryKey, updateSubTaskInData(data));
      });

      return { previousData };
    },
    onError: (error, _vars, context) => {
      // 如果是取消错误，不处理
      if (isAbortError(error)) return;

      // 回滚
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update subtask');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onSuccess: (result) => {
      // 如果是被取消的请求，不处理
      if (result?.cancelled) return;

      if (!result.success) {
        toast.error(result.error || 'Failed to update subtask');
      }
    },
  });
}

// 获取筛选后的任务列表（按分类或等级）
export function useFilteredTodos(type: 'category' | 'level', id: string, year: number) {
  return useQuery<{
    success: boolean;
    data: {
      todos: Todo[];
      stats: {
        total: number;
        completed: number;
        pending: number;
        inProgress: number;
      };
    };
  }>({
    queryKey: ['todos', 'filter', type, id, year],
    queryFn: async () => {
      const res = await fetch(`/api/todos/filter?type=${type}&id=${id}&year=${year}`);
      return res.json();
    },
    enabled: !!type && !!id && !!year,
  });
}
