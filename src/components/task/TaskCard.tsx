'use client';

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  MoreHorizontal,
  Trash2,
  Flag,
  Repeat,
  GripVertical,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubTask } from '@/types';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    startDate: string; // ISO datetime string from API
    dueDate: string;   // ISO datetime string from API
    completedAt?: string | null;
    subTasks?: string | null;
    isCycleTask: boolean;
    categoryId?: string | null;
    category?: {
      id: string;
      name: string;
      emoji?: string | null;
      color?: string | null;
    } | null;
    levelId?: string | null;
    level?: {
      id: string;
      name: string;
      value: number;
    } | null;
    isMilestone: boolean;
    priority: number;
  };
  onToggle: (id: string) => void;
  onEdit: (task: TaskCardProps['task']) => void;
  onDelete: (id: string) => void;
  onCompletedAtChange?: (id: string, completedAt: string | null) => void;
  onSubTaskToggle?: (taskId: string, subTaskId: string, isDone: boolean) => void;
  isDragging?: boolean;
  showDate?: boolean;
  compact?: boolean;
  // 批量选择模式
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

// 辅助函数：从 ISO datetime 提取本地日期部分进行比较
// 存储的是 UTC 时间，需要转换为本地时间再提取日期
function getDateOnly(isoString: string): string {
  const date = new Date(isoString);
  // 使用本地时间的年月日格式化
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onCompletedAtChange,
  onSubTaskToggle,
  isDragging,
  showDate = false,
  compact = false,
  selectMode = false,
  isSelected = false,
  onSelect,
}: TaskCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;
  const [expanded, setExpanded] = useState(false);

  // 解析子任务（使用 memoization）
  const subTasks: SubTask[] = useMemo(() => {
    if (!task.subTasks) return [];
    try {
      return JSON.parse(task.subTasks);
    } catch {
      return [];
    }
  }, [task.subTasks]);

  // 计算子任务完成进度
  const completedSubTasks = subTasks.filter((st) => st.isDone).length;
  const subTaskProgress =
    subTasks.length > 0
      ? Math.round((completedSubTasks / subTasks.length) * 100)
      : 0;

  // 判断是否跨天任务（比较本地日期部分）
  const isCrossDay = getDateOnly(task.startDate) !== getDateOnly(task.dueDate);

  // 判断是否过期（比较本地日期部分）
  const todayLocal = getDateOnly(new Date().toISOString());
  const dueDateLocal = getDateOnly(task.dueDate);
  const isOverdue =
    task.status !== 'completed' &&
    dueDateLocal < todayLocal;

  // 是否已完成
  const isCompleted = task.status === 'completed';

  // 切换子任务状态
  const handleSubTaskToggle = (subTaskId: string) => {
    if (onSubTaskToggle) {
      // 找到当前子任务的完成状态
      const currentSubTask = subTasks.find(st => st.id === subTaskId);
      const newIsDone = !currentSubTask?.isDone;
      onSubTaskToggle(task.id, subTaskId, newIsDone);
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 sm:p-3 rounded-md bg-background border text-sm cursor-pointer transition-colors',
          isCompleted && 'opacity-60',
          isOverdue && !isCompleted && 'border-destructive/30 bg-destructive/5',
          isDragging && 'shadow-lg',
          selectMode && isSelected && 'border-primary bg-primary/5',
          selectMode && 'hover:border-primary/50'
        )}
        onClick={selectMode ? () => onSelect?.(task.id) : undefined}
      >
        {selectMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(task.id)}
            className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {!selectMode && (
          <div
            className="flex-shrink-0 p-2 -m-1 rounded hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
          >
            <Checkbox
              checked={isCompleted}
              className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <motion.span
              layout
              className={cn(
                'truncate text-xs sm:text-sm relative',
                isCompleted && 'text-muted-foreground'
              )}
            >
              {task.title}
              <AnimatePresence mode="wait">
                {isCompleted && (
                  <motion.span
                    key="strikethrough"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute left-0 top-1/2 w-full h-[1px] bg-current origin-left"
                    style={{ transform: 'translateY(-50%)' }}
                  />
                )}
              </AnimatePresence>
            </motion.span>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 hidden sm:block">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.category && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 h-5">
              {task.category.emoji}
            </Badge>
          )}
          {task.level && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] sm:text-xs px-1.5 py-0 h-5',
                task.level.value >= 8 && 'border-destructive text-destructive',
                task.level.value >= 5 && task.level.value < 8 && 'border-orange-500 text-orange-500'
              )}
            >
              Lv.{task.level.value}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-3 sm:p-4 transition-all cursor-pointer',
        isCompleted && 'opacity-60',
        isOverdue && !isCompleted && 'border-destructive/50',
        isDragging && 'shadow-lg',
        selectMode && isSelected && 'border-primary bg-primary/5',
        selectMode && 'hover:border-primary/50'
      )}
      onClick={selectMode ? () => onSelect?.(task.id) : undefined}
    >
      {/* 选择模式复选框 - 左上角 */}
      {selectMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(task.id)}
            className="h-5 w-5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {/* 顶部标签栏 */}
      <div className={cn(
        'flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap',
        selectMode && 'ml-7'
      )}>
        {/* 分类标签 */}
        {task.category && (
          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5 sm:h-6">
            <span className="sm:hidden">{task.category.emoji}</span>
            <span className="hidden sm:inline">{task.category.emoji} {task.category.name}</span>
          </Badge>
        )}

        {/* 优先级标签 */}
        {task.level && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5 sm:h-6',
              task.level.value >= 8 && 'border-destructive text-destructive',
              task.level.value >= 5 &&
                task.level.value < 8 &&
                'border-orange-500 text-orange-500'
            )}
          >
            <span className="sm:hidden">Lv.{task.level.value}</span>
            <span className="hidden sm:inline">Lv.{task.level.value} {task.level.name}</span>
          </Badge>
        )}

        {/* 里程碑标记 */}
        {task.isMilestone && (
          <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5 sm:h-6">
            <Flag className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">{t('taskCard.milestone')}</span>
          </Badge>
        )}

        {/* 周期任务标记 */}
        {task.isCycleTask && (
          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5 sm:h-6">
            <Repeat className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">{t('taskCard.recurring')}</span>
          </Badge>
        )}

        {/* 跨天标记 */}
        {isCrossDay && (
          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5 sm:h-6">
            <Clock className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">{t('taskCard.crossDay')}</span>
          </Badge>
        )}
      </div>

      {/* 主内容区 */}
      <div className={cn(
        'flex items-start gap-2 sm:gap-3',
        selectMode && 'ml-7'
      )}>
        {/* 完成状态复选框 - 非选择模式下显示 */}
        {!selectMode && (
          <div
            className="flex-shrink-0 p-2 -m-1 rounded-md hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
          >
            <Checkbox
              checked={isCompleted}
              className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none"
            />
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <motion.h4
              layout
              className={cn(
                'font-medium text-xs sm:text-sm relative',
                isCompleted && 'text-muted-foreground'
              )}
            >
              {task.title}
              {/* 完成时的划线动画 */}
              <AnimatePresence mode="wait">
                {isCompleted && (
                  <motion.span
                    key="strikethrough"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute left-0 top-1/2 w-full h-[1px] bg-current origin-left"
                    style={{ transform: 'translateY(-50%)' }}
                  />
                )}
              </AnimatePresence>
            </motion.h4>

            {/* 完成日期显示和编辑 */}
            {isCompleted && task.completedAt && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-green-600 hover:text-green-700 hover:bg-green-50 px-1 sm:px-1.5 py-0.5 rounded transition-colors">
                    <CalendarCheck className="h-3 w-3" />
                    <span>{format(parseISO(task.completedAt), 'MMM d', { locale: dateFnsLocale })} {t('taskCard.completed')}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 border-b">
                    <p className="text-xs text-muted-foreground">{t('taskCard.changeCompletionDate')}</p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={task.completedAt ? parseISO(task.completedAt) : undefined}
                    onSelect={(date) => {
                      if (date && onCompletedAtChange) {
                        onCompletedAtChange(task.id, format(date, 'yyyy-MM-dd'));
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* 描述 */}
          {task.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* 日期时间显示 */}
          {showDate && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              {isCrossDay ? (
                <>
                  {format(new Date(task.startDate), 'MM/dd HH:mm')} -{' '}
                  {format(new Date(task.dueDate), 'MM/dd HH:mm')}
                </>
              ) : (
                format(new Date(task.dueDate), 'MM/dd HH:mm')
              )}
            </p>
          )}

          {/* 子任务进度 */}
          {subTasks.length > 0 && (
            <div className="mt-1.5 sm:mt-2">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
                <span>
                  {t('taskCard.subtask')} {completedSubTasks}/{subTasks.length}
                </span>
                <span>{subTaskProgress}%</span>
              </div>
              <div className="h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${subTaskProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 子任务列表 */}
          {subTasks.length > 0 && expanded && (
            <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5">
              {subTasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                  <div
                    className="flex-shrink-0 p-1.5 -m-1 rounded hover:bg-accent/50 transition-colors cursor-pointer touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubTaskToggle(st.id);
                    }}
                  >
                    <Checkbox
                      checked={st.isDone}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 pointer-events-none"
                    />
                  </div>
                  <span
                    className={cn(
                      st.isDone && 'line-through text-muted-foreground'
                    )}
                  >
                    {st.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 - 移动端始终可见 */}
        <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* 展开/收起子任务 */}
          {subTasks.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          )}

          {/* 更多操作 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit2 className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
