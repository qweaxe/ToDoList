'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCard } from '@/components/task/TaskCard';
import { TaskForm } from '@/components/task/TaskForm';
import { useDailyTodos, useToggleTodo, useDeleteTodo, useUpdateCompletedAt, useUpdateSubTask } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { getTodayString, formatDateDisplay } from '@/lib/date-utils';

export function OverdueView() {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;

  const { setSelectedDate, setCurrentView, setCalendarYear, setCalendarMonth } = useViewStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    id: string;
    title: string;
    description?: string | null;
    startDate: string;
    dueDate: string;
    completedAt?: string | null;
    categoryId?: string | null;
    levelId?: string | null;
    subTasks?: string | null;
    isCycleTask: boolean;
    isMilestone: boolean;
    priority: number;
    status?: string;
  } | null>(null);

  const { data, isLoading } = useDailyTodos(getTodayString());
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const updateCompletedAtMutation = useUpdateCompletedAt();
  const updateSubTaskMutation = useUpdateSubTask();

  const today = getTodayString();

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCompletedAtChange = (id: string, completedAt: string | null) => {
    updateCompletedAtMutation.mutate({ id, completedAt });
  };

  const handleEdit = (task: {
    id: string;
    title: string;
    description?: string | null;
    startDate: string;
    dueDate: string;
    completedAt?: string | null;
    categoryId?: string | null;
    levelId?: string | null;
    subTasks?: string | null;
    isCycleTask: boolean;
    isMilestone: boolean;
    priority: number;
    status?: string;
  }) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // 子任务状态切换
  const handleSubTaskToggle = (taskId: string, subTaskId: string, isDone: boolean) => {
    updateSubTaskMutation.mutate({ taskId, subTaskId, isDone });
  };

  // 关闭编辑表单
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  // 跳转到任务创建日期的那一天
  const handleJumpToDate = (date: string) => {
    setSelectedDate(date);
    const d = new Date(date);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth() + 1);
    setCurrentView('day');
  };

  // 返回今日视图
  const handleGoBack = () => {
    setCurrentView('day');
  };

  // 按日期分组历史待办（提取日期部分）
  const groupedOverdue = data?.data.overdue.reduce(
    (acc, task) => {
      const date = task.dueDate.split('T')[0]; // 提取日期部分
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    },
    {} as Record<string, typeof data.data.overdue>
  );

  // 按日期排序（从最远到最近）
  const sortedDates = groupedOverdue
    ? Object.keys(groupedOverdue).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    : [];

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-4xl px-4 sm:px-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h1 className="text-xl sm:text-2xl font-bold">{t('overdue.title')}</h1>
            {data?.data.overdueCount && (
              <Badge variant="destructive">{data.data.overdueCount}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <Card className="mb-6 border-destructive/30 bg-destructive/5">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            {t('overdue.description')}
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : sortedDates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-muted-foreground">
              {t('overdue.noOverdue')}
            </p>
            <Button variant="outline" className="mt-4" onClick={handleGoBack}>
              {t('overdue.returnToday')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-6 pr-2 sm:pr-4">
            {sortedDates.map((date) => {
              const tasks = groupedOverdue![date];
              const overdueDays = Math.ceil(
                (new Date(today).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={date} className="space-y-3">
                  {/* 日期标题 */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => handleJumpToDate(date)}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDateDisplay(date)}</span>
                      <Badge variant="outline" className="text-destructive border-destructive/50">
                        {t('task.overdueDays', { days: overdueDays })}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground hover:text-primary">
                      {t('overdue.tasksCount', { count: tasks.length })}
                    </span>
                  </div>

                  {/* 任务列表 */}
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="group relative flex items-start gap-2">
                        <div className="flex-1">
                          <TaskCard
                            task={task}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onCompletedAtChange={handleCompletedAtChange}
                            onSubTaskToggle={handleSubTaskToggle}
                            compact={false}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mt-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleJumpToDate(task.dueDate)}
                          title={t('overdue.jumpToDate')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* 任务编辑表单 */}
      <TaskForm
        open={isFormOpen}
        onClose={handleFormClose}
        initialData={editingTask ?? undefined}
      />
    </div>
  );
}
