'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskDetailDialog } from './TaskDetailDialog';
import { cn } from '@/lib/utils';

// 任务数据类型
interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startDate: string;
  dueDate: string;
  completedAt?: string | null;
  subTasks?: string | null;
  isCycleTask: boolean;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    emoji?: string | null;
  } | null;
  levelId?: string | null;
  level?: {
    id: string;
    name: string;
    value: number;
  } | null;
  isMilestone: boolean;
  priority: number;
}

interface TaskListDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  tasks: TaskItem[];
  pageSize?: number;
  emptyMessage?: string;
}

export function TaskListDialog({
  open,
  onClose,
  title,
  tasks,
  pageSize = 20,
  emptyMessage,
}: TaskListDialogProps) {
  const t = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 根据状态筛选任务
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    if (statusFilter === 'completed') return tasks.filter(task => task.status === 'completed');
    return tasks.filter(task => task.status !== 'completed');
  }, [tasks, statusFilter]);

  // 分页
  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // 统计
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.length - completedCount;

  // 重置页码当筛选改变
  const handleStatusChange = (status: 'all' | 'completed' | 'pending') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // 点击任务
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDetailOpen(true);
  };

  // 获取优先级颜色
  const getLevelColor = (level?: { value: number } | null) => {
    if (!level) return 'bg-gray-400';
    if (level.value >= 3) return 'bg-red-500';
    if (level.value >= 2) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{title}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {t('task.total')}: {tasks.length}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* 筛选标签 */}
          <div className="flex items-center gap-2 py-2 border-b">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('all')}
            >
              {t('common.all')} ({tasks.length})
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('completed')}
              className="text-green-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {t('task.completed')} ({completedCount})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('pending')}
              className="text-yellow-600"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              {t('task.pending')} ({pendingCount})
            </Button>
          </div>

          {/* 任务列表 */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {paginatedTasks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Circle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>{emptyMessage || t('common.noData')}</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {paginatedTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-2 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors',
                        'hover:bg-muted/50 hover:border-primary/30',
                        isCompleted && 'bg-muted/20'
                      )}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      {/* 状态图标 */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* 优先级标记 */}
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          getLevelColor(task.level)
                        )}
                      />

                      {/* 标题 */}
                      <span
                        className={cn(
                          'flex-1 truncate text-sm',
                          isCompleted && 'line-through text-muted-foreground'
                        )}
                      >
                        {task.title}
                      </span>

                      {/* 分类标签 */}
                      {task.category && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 flex-shrink-0">
                          {task.category.emoji} {task.category.name}
                        </Badge>
                      )}

                      {/* 里程碑标记 */}
                      {task.isMilestone && (
                        <Badge variant="default" className="text-xs px-1.5 py-0 h-5 flex-shrink-0">
                          {t('task.milestone')}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                {t('common.page')} {currentPage} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 任务详情弹窗 */}
      <TaskDetailDialog
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        onDeleted={() => {
          setIsDetailOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </>
  );
}
