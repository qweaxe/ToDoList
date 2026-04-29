'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCell } from './CalendarCell';
import { CalendarSpanLayer } from './CalendarSpanLayer';
import { formatDate, isTodayDate, isWeekend } from '@/lib/date-utils';
import { computeCalendarSpans } from '@/lib/cross-day-utils';
import type { CrossDaySpan } from '@/types/cross-day-span';

interface Task {
  id: string;
  title: string;
  status: string;
  startDate: string;
  dueDate: string;
  level?: {
    id: string;
    name: string;
    value: number;
  } | null;
  estimatedDuration?: number | null;
}

interface CalendarGridProps {
  year: number;
  month: number;
  tasks: Record<string, Task[]>;
  holidays?: Record<string, { name: string; isHoliday: boolean }>;
  isLoading?: boolean;
  onDateClick?: (date: string) => void;
  onTaskClick?: (taskId: string) => void;
  maxVisibleTasks?: number;
  /** 是否显示跨天任务横跨条 */
  showSpanBars?: boolean;
}

export function CalendarGrid({
  year,
  month,
  tasks,
  holidays,
  isLoading,
  onDateClick,
  onTaskClick,
  maxVisibleTasks = 3,
  showSpanBars = false,
}: CalendarGridProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;

  // 获取日历网格日期 (7x6 = 42天)
  const calendarDates = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = endOfMonth(firstDay);
    const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 1 });

    const dates: Date[] = [];
    let currentDate = calendarStart;

    while (currentDate <= calendarEnd) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  }, [year, month]);

  // 当前月份的Date对象
  const currentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month]);

  // 判断日期是否在当前月份
  const isInCurrentMonth = (date: Date) => {
    return isSameMonth(date, currentMonth);
  };

  // 计算跨天任务横跨条数据
  const spans: CrossDaySpan[] = useMemo(() => {
    if (!showSpanBars) return [];
    return computeCalendarSpans(tasks, calendarDates);
  }, [showSpanBars, tasks, calendarDates]);

  // 获取横跨条中涉及的任务 ID（用于在单元格中过滤）
  const spanTaskIds = useMemo(() => {
    return new Set(spans.map(s => s.taskId));
  }, [spans]);

  // 星期标签
  const WEEKDAYS = [
    t('weekday.monShort'),
    t('weekday.tueShort'),
    t('weekday.wedShort'),
    t('weekday.thuShort'),
    t('weekday.friShort'),
    t('weekday.satShort'),
    t('weekday.sunShort')
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {/* 星期头部 */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index >= 5 ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              {t('weekday.weekPrefix')}{day}
            </div>
          ))}
        </div>
        {/* 日历骨架 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] sm:h-[80px] lg:h-[100px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 星期头部 */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs sm:text-sm font-medium py-1.5 sm:py-2 ${
              index >= 5 ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            {t('weekday.weekPrefix')}{day}
          </div>
        ))}
      </div>

      {/* 日历网格 - 移动端支持横向滚动 */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[490px] sm:min-w-0 relative">
          {/* 横跨条覆盖层 */}
          {showSpanBars && spans.length > 0 && (
            <CalendarSpanLayer spans={spans} onTaskClick={onTaskClick} />
          )}

          {/* 日历单元格 */}
          {calendarDates.map((date, index) => {
            const dateStr = formatDate(date);
            const dayTasks = tasks[dateStr] || [];
            const holiday = holidays?.[dateStr];

            // 过滤掉已显示为横跨条的任务（避免重复显示）
            const filteredTasks = showSpanBars
              ? dayTasks.filter(task => !spanTaskIds.has(task.id))
              : dayTasks;

            return (
              <CalendarCell
                key={index}
                date={date}
                isCurrentMonth={isInCurrentMonth(date)}
                tasks={filteredTasks}
                holiday={holiday}
                maxVisibleTasks={maxVisibleTasks}
                onClick={() => onDateClick?.(dateStr)}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
