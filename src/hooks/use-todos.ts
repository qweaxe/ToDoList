'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateTodoInput, UpdateTodoInput } from '@/types/api';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  dueDate: string;
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
  startDate: string;
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

// 获取当日任务
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
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        // 强制刷新所有 todos 相关查询
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.refetchQueries({ queryKey: ['todos'] });
        toast.success('任务创建成功');
      } else {
        toast.error(result.error || '创建失败');
      }
    },
    onError: () => {
      toast.error('创建任务失败');
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
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.refetchQueries({ queryKey: ['todos'] });
        toast.success('任务更新成功');
      } else {
        toast.error(result.error || '更新失败');
      }
    },
    onError: () => {
      toast.error('更新任务失败');
    },
  });
}

// 切换任务状态
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.refetchQueries({ queryKey: ['todos'] });
        toast.success(result.data?.status === 'completed' ? '任务已完成' : '任务已恢复');
      } else {
        toast.error(result.error || '操作失败');
      }
    },
    onError: () => {
      toast.error('切换状态失败');
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
      quarterName: string;
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
    staleTime: 5 * 60 * 1000, // 5分钟缓存
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
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success('完成日期已更新');
      } else {
        toast.error(result.error || '更新失败');
      }
    },
    onError: () => {
      toast.error('更新完成日期失败');
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
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.refetchQueries({ queryKey: ['todos'] });
        toast.success('任务删除成功');
      } else {
        toast.error(result.error || '删除失败');
      }
    },
    onError: () => {
      toast.error('删除任务失败');
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
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success(result.message);
      } else {
        toast.error(result.error || '删除失败');
      }
    },
    onError: () => {
      toast.error('批量删除失败');
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
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        toast.success(result.message);
      } else {
        toast.error(result.error || '更新失败');
      }
    },
    onError: () => {
      toast.error('批量更新失败');
    },
  });
}

// 更新子任务状态
export function useUpdateSubTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subTaskId, isDone }: { taskId: string; subTaskId: string; isDone: boolean }) => {
      // 首先获取当前任务数据
      const getRes = await fetch(`/api/todos/${taskId}`);
      const taskData = await getRes.json();
      
      if (!taskData.success) {
        throw new Error(taskData.error || '获取任务失败');
      }

      // 解析现有的子任务
      const subTasks = taskData.data.subTasks ? JSON.parse(taskData.data.subTasks) : [];
      
      // 更新指定子任务的状态
      const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) => 
        st.id === subTaskId ? { ...st, isDone } : st
      );

      // 发送更新请求
      const res = await fetch(`/api/todos/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subTasks: updatedSubTasks }),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.refetchQueries({ queryKey: ['todos'] });
      } else {
        toast.error(result.error || '更新子任务失败');
      }
    },
    onError: () => {
      toast.error('更新子任务失败');
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
