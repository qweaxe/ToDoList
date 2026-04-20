'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, Plus, Target, TrendingUp, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskForm } from '@/components/task/TaskForm';
import { TaskListDialog } from '@/components/task/TaskListDialog';
import { useWeeklyTodos, useToggleTodo, useDeleteTodo, useUpdateTodo, useUpdateCompletedAt } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { getTodayString, addWeeksToDate, formatDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

// 可拖拽任务卡片组件
interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startDate: string;
  dueDate: string;
  completedAt?: string | null;
  categoryId?: string | null;
  levelId?: string | null;
  subTasks?: string | null;
  isCycleTask: boolean;
  isMilestone: boolean;
  priority: number;
  category?: { id: string; name: string; emoji?: string | null } | null;
  level?: { id: string; name: string; value: number } | null;
}

interface DraggableTaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onToggle: (id: string) => void;
  isDragging?: boolean;
}

function DraggableTaskCard({ task, onEdit, onToggle, isDragging }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const isCompleted = task.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'text-xs p-1.5 rounded cursor-pointer transition-colors group relative',
        'hover:bg-muted/80',
        isCompleted
          ? 'bg-muted/30 text-muted-foreground'
          : 'bg-muted/50',
        isSortableDragging && 'ring-2 ring-primary shadow-lg'
      )}
    >
      <div className="flex items-center gap-1">
        {/* Checkbox */}
        <div
          className="flex-shrink-0 -ml-0.5 p-0.5 rounded hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
        >
          <Checkbox
            checked={isCompleted}
            className="h-3 w-3 pointer-events-none"
          />
        </div>
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        {task.level && (
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              task.level.value === 3
                ? 'bg-red-500'
                : task.level.value === 2
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            )}
          />
        )}
        <span className={cn('truncate flex-1', isCompleted && 'line-through')}>{task.title}</span>
      </div>
    </div>
  );
}

// 日期列组件（可放置区域）
interface DateColumnProps {
  dateInfo: {
    date: string;
    dayName: string;
    dayNumber: string;
    isToday: boolean;
    isWeekend: boolean;
  };
  tasks: TaskItem[];
  isToday: boolean;
  onDateClick: (date: string) => void;
  onCreateTask: (date: string) => void;
  onEditTask: (task: TaskItem) => void;
  onToggleTask: (id: string) => void;
  today: string;
  addTaskText: string;
  dropHereText: string;
}

function DateColumn({
  dateInfo,
  tasks,
  isToday,
  onDateClick,
  onCreateTask,
  onEditTask,
  onToggleTask,
  today,
  addTaskText,
  dropHereText,
}: DateColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateInfo.date,
    data: { date: dateInfo.date },
  });

  const isWeekendDay = dateInfo.isWeekend;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[100px] min-h-[160px] sm:min-w-0 sm:min-h-[200px] md:min-h-[300px] border rounded-lg overflow-hidden transition-colors',
        'bg-card',
        isToday && 'ring-2 ring-primary',
        isWeekendDay && 'bg-red-50/30 dark:bg-red-950/10',
        isOver && 'bg-primary/10 ring-2 ring-primary/50'
      )}
    >
      {/* 日期头部 */}
      <div
        className={cn(
          'p-2 border-b cursor-pointer hover:bg-muted/50 flex items-center justify-between',
          isToday && 'bg-primary/10'
        )}
        onClick={() => onDateClick(dateInfo.date)}
      >
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'text-sm sm:text-base font-semibold',
              isWeekendDay && 'text-red-500'
            )}
          >
            {dateInfo.dayNumber}
          </span>
          <span className="text-xs text-muted-foreground">{dateInfo.dayName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onCreateTask(dateInfo.date);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* 任务列表 */}
      <div className="p-1 sm:p-2 space-y-1 max-h-[180px] sm:max-h-[260px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div
            className="text-xs text-center text-muted-foreground py-4 cursor-pointer hover:text-foreground"
            onClick={() => onCreateTask(dateInfo.date)}
          >
            {addTaskText}
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onToggle={onToggleTask}
              />
            ))}
          </SortableContext>
        )}
        {isOver && tasks.length > 0 && (
          <div className="border-2 border-dashed border-primary/50 rounded p-2 text-center text-xs text-primary">
            {dropHereText}
          </div>
        )}
      </div>
    </div>
  );
}

// 拖拽覆盖层中的任务卡片
function OverlayTaskCard({ task }: { task: TaskItem }) {
  const isCompleted = task.status === 'completed';

  return (
    <div
      className={cn(
        'text-xs p-1.5 rounded cursor-grabbing shadow-lg',
        'bg-background border-2 border-primary',
        isCompleted
          ? 'bg-muted/30 text-muted-foreground'
          : 'bg-muted/50'
      )}
    >
      <div className="flex items-center gap-1">
        <Checkbox
          checked={isCompleted}
          className="h-3 w-3 pointer-events-none"
        />
        {task.level && (
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              task.level.value === 3
                ? 'bg-red-500'
                : task.level.value === 2
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            )}
          />
        )}
        <span className={cn('truncate', isCompleted && 'line-through')}>{task.title}</span>
      </div>
    </div>
  );
}

export function WeekView() {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;

  const { selectedDate, setSelectedDate, setCurrentView } = useViewStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDateForForm, setSelectedDateForForm] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // 任务列表弹窗状态
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [taskListTitle, setTaskListTitle] = useState('');
  const [taskListFilter, setTaskListFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // 从翻译获取星期名称
  const DAY_NAMES = [
    t('weekday.monShort'),
    t('weekday.tueShort'),
    t('weekday.wedShort'),
    t('weekday.thuShort'),
    t('weekday.friShort'),
    t('weekday.satShort'),
    t('weekday.sunShort'),
  ];

  // 计算当前周的起始日期
  const weekStart = (() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  })();

  const { data, isLoading } = useWeeklyTodos(formatDate(weekStart));
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const updateMutation = useUpdateTodo();
  const updateCompletedAtMutation = useUpdateCompletedAt();

  const today = getTodayString();

  // 提取数据（在提前返回之前，避免 React hooks 规则违反）
  const stats = data?.data.stats || { total: 0, completed: 0, pending: 0, completionRate: 0 };
  const importantTasks = data?.data.importantTasks || [];

  // 获取所有任务列表（扁平化）
  const allTasks = useMemo(() => {
    const tasksByDate = data?.data.tasksByDate || {};
    return Object.values(tasksByDate).flat();
  }, [data?.data.tasksByDate]);

  // 点击统计数字
  const handleStatClick = (type: 'total' | 'completed' | 'pending') => {
    const weekNum = data?.data.weekNumber || 1;
    setTaskListTitle(`${t('view.weekNumber', { week: weekNum })} - ${t(`task.${type === 'total' ? 'total' : type}`)}`);
    setTaskListFilter(type === 'total' ? 'all' : type);
    setIsTaskListOpen(true);
  };

  // 根据筛选条件过滤任务
  const filteredTasksForDialog = useMemo(() => {
    if (taskListFilter === 'all') return allTasks;
    if (taskListFilter === 'completed') return allTasks.filter(t => t.status === 'completed');
    return allTasks.filter(t => t.status !== 'completed');
  }, [allTasks, taskListFilter]);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移动 8px 才开始拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 切换到上一周
  const goToPreviousWeek = () => {
    const newDate = addWeeksToDate(selectedDate, -1);
    setSelectedDate(formatDate(newDate));
  };

  // 切换到下一周
  const goToNextWeek = () => {
    const newDate = addWeeksToDate(selectedDate, 1);
    setSelectedDate(formatDate(newDate));
  };

  // 回到本周
  const goToThisWeek = () => {
    setSelectedDate(today);
  };

  // 点击日期 - 跳转到当日视图
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  // 编辑任务
  const handleEdit = (task: TaskItem) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // 切换任务状态
  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  // 新建任务
  const handleCreateTask = (date?: string) => {
    setSelectedDateForForm(date || null);
    setIsFormOpen(true);
  };

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // 查找被拖拽的任务
    const allTasks = Object.values(data?.data.tasksByDate || {}).flat();
    const task = allTasks.find((t: TaskItem) => t.id === active.id);
    
    if (task) {
      setActiveTask(task);
    }
  };

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const newDate = over.id as string;

      // 更新任务的 dueDate 和 startDate
      // 如果是单天任务，同时更新 startDate 和 dueDate
      // 如果是跨天任务，只更新 dueDate
      const allTasks = Object.values(data?.data.tasksByDate || {}).flat();
      const task = allTasks.find((t: TaskItem) => t.id === taskId);

      if (task) {
        // 比较日期部分（需将 UTC 转换为本地时间）
        const getDateLocal = (iso: string) => {
          const d = new Date(iso);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        const taskStartDate = getDateLocal(task.startDate);
        const taskDueDate = getDateLocal(task.dueDate);
        const isSameDay = taskStartDate === taskDueDate;

        // 提取时间部分（从 UTC ISO 字符串）
        const dueTime = task.dueDate.includes('T') ? task.dueDate.split('T')[1] : '23:59:59.000Z';
        const startTime = task.startDate.includes('T') ? task.startDate.split('T')[1] : '00:00:00.000Z';

        // 构建新的日期时间（本地时间转 UTC）
        const combineDateTime = (dateStr: string, timeStr: string) => {
          return new Date(`${dateStr}T${timeStr}`).toISOString();
        };
        const newDueDate = combineDateTime(newDate, dueTime.slice(0, 5)); // 取 HH:mm
        const newStartDate = isSameDay ? combineDateTime(newDate, startTime.slice(0, 5)) : task.startDate;

        updateMutation.mutate({
          id: taskId,
          data: {
            dueDate: newDueDate,
            // 如果是单天任务，同时更新 startDate
            ...(isSameDay && { startDate: newStartDate }),
          },
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-7xl px-4 sm:px-6">
      {/* 标题和控制区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            {t('view.weekNumber', { week: data?.data.weekNumber })}
          </h1>
          <span className="text-sm text-muted-foreground">
            {data?.data.startDate} - {data?.data.endDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToThisWeek}>
            {t('view.thisWeek')}
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleCreateTask()}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('task.newTask')}</span>
          </Button>
        </div>
      </div>

      {/* 周总结 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleStatClick('total')}>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">{t('task.total')}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleStatClick('completed')}>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">{t('task.completed')}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1 text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleStatClick('pending')}>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">{t('task.pending')}</div>
            <div className="text-2xl sm:text-3xl font-bold mt-1 text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">{t('stats.completionRate')}</div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* 重点任务 */}
      {importantTasks.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🔥 {t('view.importantTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {importantTasks.map((task) => (
                <Badge
                  key={task.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900"
                  onClick={() => handleEdit(task)}
                >
                  {task.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 周视图网格 - 移动端支持横向滚动 */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[700px] sm:min-w-0">
            {/* 星期头部 */}
            {DAY_NAMES.map((day, index) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs sm:text-sm font-medium py-2',
                  index >= 5 ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                {day}
              </div>
            ))}

            {/* 日期列 */}
            {data?.data.dates.map((dateInfo) => {
              const dayTasks = (data.data.tasksByDate[dateInfo.date] || []) as TaskItem[];
              const isToday = dateInfo.date === today;

              return (
                <DateColumn
                  key={dateInfo.date}
                  dateInfo={dateInfo}
                  tasks={dayTasks}
                  isToday={isToday}
                  onDateClick={handleDateClick}
                  onCreateTask={handleCreateTask}
                  onEditTask={handleEdit}
                  onToggleTask={handleToggle}
                  today={today}
                  addTaskText={t('view.addTask')}
                  dropHereText={t('view.dropHere')}
                />
              );
            })}
          </div>
        </div>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeTask ? <OverlayTaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* 任务表单 */}
      <TaskForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
          setSelectedDateForForm(null);
        }}
        initialData={editingTask || undefined}
        defaultDate={selectedDateForForm || selectedDate}
      />

      {/* 任务列表弹窗 */}
      <TaskListDialog
        open={isTaskListOpen}
        onClose={() => setIsTaskListOpen(false)}
        title={taskListTitle}
        tasks={filteredTasksForDialog}
      />
    </div>
  );
}
