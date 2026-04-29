'use client';

import { cn } from '@/lib/utils';
import type { CrossDaySpan } from '@/types/cross-day-span';

interface CalendarSpanBarProps {
  span: CrossDaySpan;
  left: number;
  width: number;
  top: number;
  height: number;
  onTaskClick?: (taskId: string) => void;
}

// 获取任务等级对应的背景颜色
function getSpanBgColor(level?: { value: number } | null) {
  if (!level) return 'bg-gray-100 dark:bg-gray-800';
  if (level.value === 3) return 'bg-red-100 dark:bg-red-900/30';
  if (level.value === 2) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-gray-100 dark:bg-gray-800';
}

// 获取任务等级对应的左侧标记颜色
function getSpanMarkerColor(level?: { value: number } | null) {
  if (!level) return 'bg-gray-400';
  if (level.value === 3) return 'bg-red-500';
  if (level.value === 2) return 'bg-yellow-500';
  return 'bg-gray-400';
}

export function CalendarSpanBar({
  span,
  left,
  width,
  top,
  height,
  onTaskClick,
}: CalendarSpanBarProps) {
  const isCompleted = span.status === 'completed';

  return (
    <div
      className={cn(
        'absolute rounded-md px-2 flex items-center gap-1.5',
        'pointer-events-auto cursor-pointer',
        'hover:shadow-md hover:ring-1 hover:ring-primary/30 transition-all',
        getSpanBgColor(span.level),
        isCompleted && 'opacity-60'
      )}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 60)}px`, // 最小宽度 60px
        top: `${top}px`,
        height: `${height}px`,
      }}
      onClick={() => onTaskClick?.(span.taskId)}
    >
      {/* 左侧等级标记 */}
      <span
        className={cn(
          'w-1 h-4 rounded flex-shrink-0',
          getSpanMarkerColor(span.level)
        )}
      />

      {/* 任务标题 */}
      <span
        className={cn(
          'text-xs truncate flex-1',
          isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {span.title}
      </span>
    </div>
  );
}