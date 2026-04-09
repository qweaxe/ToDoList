'use client';

import { useMemo } from 'react';
import { format, isToday, isWeekend as checkIsWeekend } from 'date-fns';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface Task {
  id: string;
  title: string;
  status: string;
  level?: {
    id: string;
    name: string;
    value: number;
  } | null;
}

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  holiday?: {
    name: string;
    isHoliday: boolean;
  };
  maxVisibleTasks?: number;
  onClick?: () => void;
  onTaskClick?: (taskId: string) => void;
}

// 获取任务等级对应的颜色（使用 value 而非 name，支持 i18n）
function getTaskColor(level?: { name: string; value: number } | null) {
  if (!level) return 'bg-muted';
  if (level.value === 3) return 'bg-red-500';
  if (level.value === 2) return 'bg-yellow-500';
  return 'bg-gray-400';
}

export function CalendarCell({
  date,
  isCurrentMonth,
  tasks,
  holiday,
  maxVisibleTasks = 3,
  onClick,
  onTaskClick,
}: CalendarCellProps) {
  const t = useTranslations();
  const isTodayDate = isToday(date);
  const isWeekendDay = checkIsWeekend(date);

  // 判断是否是休息日（用于显示红色）
  // 优先使用节假日数据，否则使用周末判断
  const isRestDay = holiday !== undefined
    ? holiday.isHoliday  // 有节假日数据时，以数据为准
    : isWeekendDay;      // 无数据时，周末为休息日

  // 判断是否是调休工作日（周末但需要上班）
  const isAdjustedWorkday = holiday && !holiday.isHoliday && isWeekendDay;

  // 按优先级排序任务（使用 memoization）
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aValue = a.level?.value || 0;
      const bValue = b.level?.value || 0;
      return bValue - aValue;
    });
  }, [tasks]);

  const visibleTasks = sortedTasks.slice(0, maxVisibleTasks);
  const hiddenCount = sortedTasks.length - maxVisibleTasks;

  return (
    <div
      className={cn(
        'min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] p-1 sm:p-2 border rounded-lg cursor-pointer transition-colors',
        'hover:bg-muted/50 hover:border-primary/50',
        !isCurrentMonth && 'bg-muted/20 opacity-40',
        isCurrentMonth && 'bg-card hover:shadow-sm',
        isTodayDate && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={onClick}
    >
      {/* 日期头部 */}
      <div className="flex items-start justify-between mb-1">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 text-sm rounded-full',
            !isCurrentMonth && 'text-muted-foreground',
            // 使用 isRestDay 判断是否显示红色（休息日）
            isRestDay && isCurrentMonth && !isTodayDate && 'text-red-500',
            // 调休工作日特殊标记（周末但上班）
            isAdjustedWorkday && 'text-foreground',
            isTodayDate && 'bg-primary text-primary-foreground font-bold'
          )}
        >
          {format(date, 'd')}
        </span>

        {/* 节假日标记 */}
        {holiday && (
          <span
            className={cn(
              'text-[10px] px-1 py-0.5 rounded whitespace-nowrap',
              holiday.isHoliday
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            )}
          >
            {holiday.name}
          </span>
        )}
      </div>

      {/* 任务列表 - 即使是非当前月也显示任务 */}
      {tasks.length > 0 && (
        <div className="space-y-0.5 overflow-hidden">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'text-xs truncate px-1.5 py-0.5 rounded cursor-pointer transition-colors',
                'hover:bg-muted/80',
                task.status === 'completed'
                  ? 'line-through text-muted-foreground bg-muted/30'
                  : 'text-foreground bg-muted/20'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(task.id);
              }}
            >
              <span
                className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full mr-1',
                  getTaskColor(task.level)
                )}
              />
              {task.title}
            </div>
          ))}

          {/* 更多任务提示 */}
          {hiddenCount > 0 && (
            <div className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/10 rounded">
              +{hiddenCount} {t('calendar.more')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
