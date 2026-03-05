'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TaskCard } from '@/components/task/TaskCard';
import { TaskForm } from '@/components/task/TaskForm';
import { BatchActionsToolbar } from '@/components/task/BatchActionsToolbar';
import { useDailyTodos, useToggleTodo, useDeleteTodo, useUpdateCompletedAt, useUpdateSubTask } from '@/hooks/use-todos';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import { useViewStore } from '@/hooks/use-view-store';
import { getTodayString, formatDateDisplay, isDateBefore } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export function DayView() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const { selectedDate, setSelectedDate, setCurrentView, setCalendarYear, setCalendarMonth } = useViewStore();
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

  const { data, isLoading } = useDailyTodos(selectedDate);
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const updateCompletedAtMutation = useUpdateCompletedAt();
  const updateSubTaskMutation = useUpdateSubTask();

  // 批量选择功能
  const allTaskIds = useMemo(() => {
    if (!data?.data) return [];
    const pending = data.data.today.pending.map(t => t.id);
    const completed = data.data.today.completed.map(t => t.id);
    return [...pending, ...completed];
  }, [data?.data]);

  const batchSelection = useBatchSelection({ totalCount: allTaskIds.length });

  const today = getTodayString();
  const isToday = selectedDate === today;

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      setSelectedDate(dateStr);
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(today);
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(format(current, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(format(current, 'yyyy-MM-dd'));
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

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCompletedAtChange = (id: string, completedAt: string | null) => {
    updateCompletedAtMutation.mutate({ id, completedAt });
  };

  const handleSubTaskToggle = (taskId: string, subTaskId: string, isDone: boolean) => {
    updateSubTaskMutation.mutate({ taskId, subTaskId, isDone });
  };

  const handleJumpToCalendar = () => {
    const date = new Date(selectedDate);
    setCalendarYear(date.getFullYear());
    setCalendarMonth(date.getMonth() + 1);
    setCurrentView('calendar');
  };

  // 跳转到历史待办专属页面
  const handleViewAllOverdue = () => {
    setCurrentView('overdue');
  };

  // 按日期分组历史待办
  const groupedOverdue = data?.data.overdue.reduce(
    (acc, task) => {
      const date = task.dueDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    },
    {} as Record<string, typeof data.data.overdue>
  );

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-4xl px-4 sm:px-6">
      {/* 日期导航 - 响应式布局 */}
      <div className="space-y-4 mb-6">
        {/* 第一行：日期标题 + 新建任务按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">
              {formatDateDisplay(selectedDate)}
            </h1>
            {!isToday && (
              <Button variant="outline" size="sm" onClick={handleGoToToday} className="text-xs sm:text-sm">
                {t('nav.backToToday')}
              </Button>
            )}
          </div>
          
          {/* 右侧按钮组 */}
          <div className="flex items-center gap-2">
            {/* 批量选择按钮 - 仅当有任务时显示 */}
            {allTaskIds.length > 0 && (
              <Button
                variant={batchSelection.isSelectMode ? 'default' : 'outline'}
                size="sm"
                onClick={batchSelection.toggleSelectMode}
              >
                <CheckSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {batchSelection.isSelectMode ? t('batch.cancelSelection') : t('batch.batchActions')}
                </span>
              </Button>
            )}
            {/* 新建任务按钮 - 移动端只显示图标 */}
            <Button onClick={() => setIsFormOpen(true)} size="sm" className="sm:size-default">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('task.newTask')}</span>
            </Button>
          </div>
        </div>

        {/* 第二行：日期导航控制 */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[120px] sm:min-w-[140px]">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('task.selectDate')}</span>
                <span className="sm:hidden">{format(new Date(selectedDate), 'M/d', { locale: dateLocale })}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={new Date(selectedDate)}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 历史待办区域 */}
          {data?.data.overdueCount > 0 && (
            <Card className="border-destructive/50 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
                    <span className="truncate">{t('task.overdue')}</span>
                    <Badge variant="destructive" className="flex-shrink-0">{data.data.overdueCount}</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewAllOverdue}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t('task.viewAll')} →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <ScrollArea className="max-h-[50vh] sm:max-h-80">
                  <div className="space-y-3 sm:space-y-4 pr-2 sm:pr-4">
                    {Object.entries(groupedOverdue || {}).map(([date, tasks]) => (
                      <div key={date} className="space-y-2">
                        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                          <span className="font-medium">{formatDateDisplay(date)}</span>
                          <span className="text-destructive">
                            ({t('task.overdueDays', { days: Math.ceil((new Date(today).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)) })})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {tasks.slice(0, 5).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggle={handleToggle}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onCompletedAtChange={handleCompletedAtChange}
                              onSubTaskToggle={handleSubTaskToggle}
                              compact={true}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* 当日任务统计 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">{data?.data.today.total || 0}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('task.totalTasks')}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-500">
                    {data?.data.today.pending.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('task.pendingTasks')}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-500">
                    {data?.data.today.completedCount || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{t('task.completedTasks')}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 待完成任务 */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('task.pending')}</h2>
            {data?.data.today.pending.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('task.noPendingTasks')}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {data?.data.today.pending.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCompletedAtChange={handleCompletedAtChange}
                    onSubTaskToggle={handleSubTaskToggle}
                    selectMode={batchSelection.isSelectMode}
                    isSelected={batchSelection.isSelected(task.id)}
                    onSelect={batchSelection.toggleSelection}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 已完成任务 */}
          {data?.data.today.completed.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-3 text-muted-foreground">
                {t('task.completed')}
              </h2>
              <div className={cn('space-y-2', !batchSelection.isSelectMode && 'opacity-60')}>
                {data?.data.today.completed.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCompletedAtChange={handleCompletedAtChange}
                    onSubTaskToggle={handleSubTaskToggle}
                    selectMode={batchSelection.isSelectMode}
                    isSelected={batchSelection.isSelected(task.id)}
                    onSelect={batchSelection.toggleSelection}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {data?.data.today.total === 0 && data?.data.overdueCount === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-muted-foreground mb-4">
                  {t('task.noTasksToday')}
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('task.createTask')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 任务表单 */}
      <TaskForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        initialData={editingTask || undefined}
        defaultDate={selectedDate}
      />

      {/* 批量操作工具栏 */}
      {batchSelection.isSelectMode && (
        <BatchActionsToolbar
          selectedCount={batchSelection.selectedCount}
          totalCount={allTaskIds.length}
          selectedIds={batchSelection.getSelectedIds()}
          allIds={allTaskIds}
          isAllSelected={batchSelection.isAllSelected}
          isPartialSelected={batchSelection.isPartialSelected}
          onSelectAll={() => batchSelection.selectAll(allTaskIds)}
          onDeselectAll={batchSelection.deselectAll}
          onExit={batchSelection.exitSelectMode}
        />
      )}
    </div>
  );
}