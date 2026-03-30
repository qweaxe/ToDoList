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

// Get task list
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

// Get daily tasks
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

// Get monthly tasks
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

// Get single task
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

// Create task
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

// Update task
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

// Toggle task status
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
        toast.success(result.data?.status === 'completed' ? 'Task completed' : 'Task restored');
      } else {
        toast.error(result.error || 'Operation failed');
      }
    },
    onError: () => {
      toast.error('Failed to toggle status');
    },
  });
}

// Get weekly tasks
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

// Get quarterly data
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

// Get yearly stats
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

// Update completion date
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

// Delete task
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

// Batch delete tasks
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
        toast.error(result.error || 'Deletion failed');
      }
    },
    onError: () => {
      toast.error('Batch deletion failed');
    },
  });
}

// Batch update tasks
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
        toast.error(result.error || 'Update failed');
      }
    },
    onError: () => {
      toast.error('Batch update failed');
    },
  });
}

// Update subtask status
export function useUpdateSubTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subTaskId, isDone }: { taskId: string; subTaskId: string; isDone: boolean }) => {
      // First get current task data
      const getRes = await fetch(`/api/todos/${taskId}`);
      const taskData = await getRes.json();

      if (!taskData.success) {
        throw new Error(taskData.error || 'Failed to get task');
      }

      // Parse existing subtasks
      const subTasks = taskData.data.subTasks ? JSON.parse(taskData.data.subTasks) : [];

      // Update specified subtask status
      const updatedSubTasks = subTasks.map((st: { id: string; isDone: boolean }) =>
        st.id === subTaskId ? { ...st, isDone } : st
      );

      // Send update request
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
      } else {
        toast.error(result.error || 'Failed to update subtask');
      }
    },
    onError: () => {
      toast.error('Failed to update subtask');
    },
  });
}

// Get filtered task list (by category or level)
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
