'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import {
  Calendar,
  Check,
  Edit2,
  Flag,
  MoreHorizontal,
  Repeat,
  Trash2,
  X,
  Save,
  Plus,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useTodo,
  useUpdateTodo,
  useToggleTodo,
  useDeleteTodo,
} from '@/hooks/use-todos';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { cn } from '@/lib/utils';
import type { SubTask } from '@/types';

interface TaskDetailDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  onDeleted?: () => void;
}

// 解析子任务
function parseSubTasks(subTasksStr: string | null): SubTask[] {
  if (!subTasksStr) return [];
  try {
    return JSON.parse(subTasksStr);
  } catch {
    return [];
  }
}

export function TaskDetailDialog({
  open,
  onClose,
  taskId,
  onDeleted,
}: TaskDetailDialogProps) {
  const t = useTranslations('taskDetail');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editLevelId, setEditLevelId] = useState('');
  const [editSubTasks, setEditSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskText, setNewSubTaskText] = useState('');
  // 时间选择器状态
  const [editStartTime, setEditStartTime] = useState<string>('00:00');
  const [editDueTime, setEditDueTime] = useState<string>('23:59');

  // 从 ISO 字符串提取时间部分
  const extractTimeFromISO = (isoString: string, isDueDate: boolean = false): string => {
    if (isoString.includes('T')) {
      const date = new Date(isoString);
      return format(date, 'HH:mm');
    }
    return isDueDate ? '23:59' : '00:00';
  };

  // 合并日期和时间为 ISO 字符串
  const combineDateAndTime = (dateStr: string, timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  const { data, isLoading, refetch } = useTodo(taskId);
  const updateMutation = useUpdateTodo();
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const { data: categoriesData } = useCategories();
  const { data: levelsData } = useLevels();

  const task = data?.data;
  const categories = categoriesData?.data || [];
  const levels = levelsData?.data || [];

  // 解析后的子任务
  const parsedSubTasks = useMemo(() => parseSubTasks(task?.subTasks || null), [task?.subTasks]);

  // 重置编辑状态 - 直接从 task 初始化，不使用 effect
  const getInitialEditValues = useCallback(() => {
    if (!task) return null;
    return {
      title: task.title,
      description: task.description || '',
      startDate: task.startDate,
      dueDate: task.dueDate,
      categoryId: task.categoryId || '',
      levelId: task.levelId || '',
      subTasks: parsedSubTasks,
    };
  }, [task, parsedSubTasks]);

  // 重置编辑状态
  const resetEdit = useCallback(() => {
    const initial = getInitialEditValues();
    if (initial) {
      setEditTitle(initial.title);
      setEditDescription(initial.description);
      setEditStartDate(initial.startDate);
      setEditDueDate(initial.dueDate);
      setEditCategoryId(initial.categoryId);
      setEditLevelId(initial.levelId);
      setEditSubTasks(initial.subTasks);
      // 重置时间
      setEditStartTime(extractTimeFromISO(initial.startDate, false));
      setEditDueTime(extractTimeFromISO(initial.dueDate, true));
    }
    setIsEditing(false);
  }, [getInitialEditValues]);

  // 保存编辑
  const handleSave = () => {
    if (!taskId || !editTitle.trim()) return;

    // 合并日期和时间
    const startDateWithTime = combineDateAndTime(editStartDate, editStartTime);
    const dueDateWithTime = combineDateAndTime(editDueDate, editDueTime);

    updateMutation.mutate(
      {
        id: taskId,
        data: {
          title: editTitle,
          description: editDescription || undefined,
          startDate: startDateWithTime,
          dueDate: dueDateWithTime,
          categoryId: editCategoryId || undefined,
          levelId: editLevelId || undefined,
          subTasks: editSubTasks.length > 0 ? editSubTasks : undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          refetch();
        },
      }
    );
  };

  // 切换任务状态
  const handleToggle = () => {
    if (taskId) {
      toggleMutation.mutate(taskId);
    }
  };

  // 删除任务
  const handleDelete = () => {
    if (taskId) {
      deleteMutation.mutate(taskId, {
        onSuccess: () => {
          onDeleted?.();
          onClose();
        },
      });
    }
  };

  // 添加子任务
  const handleAddSubTask = () => {
    if (!newSubTaskText.trim()) return;
    setEditSubTasks([
      ...editSubTasks,
      {
        id: `subtask-${Date.now()}`,
        text: newSubTaskText.trim(),
        isDone: false,
      },
    ]);
    setNewSubTaskText('');
  };

  // 切换子任务状态
  const handleToggleSubTask = (subTaskId: string) => {
    setEditSubTasks(
      editSubTasks.map((st) =>
        st.id === subTaskId ? { ...st, isDone: !st.isDone } : st
      )
    );
  };

  // 删除子任务
  const handleDeleteSubTask = (subTaskId: string) => {
    setEditSubTasks(editSubTasks.filter((st) => st.id !== subTaskId));
  };

  if (!open || !taskId) return null;

  const isCompleted = task?.status === 'completed';
  const isCrossDay = task?.startDate !== task?.dueDate;
  const completedSubTasks = parsedSubTasks.filter((st) => st.isDone).length;
  const subTaskProgress =
    parsedSubTasks.length > 0
      ? Math.round((completedSubTasks / parsedSubTasks.length) * 100)
      : 0;

  // 开始编辑时初始化编辑状态
  const startEditing = () => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditStartDate(task.startDate);
      setEditDueDate(task.dueDate);
      setEditCategoryId(task.categoryId || '');
      setEditLevelId(task.levelId || '');
      setEditSubTasks(parsedSubTasks);
      // 设置时间
      setEditStartTime(extractTimeFromISO(task.startDate, false));
      setEditDueTime(extractTimeFromISO(task.dueDate, true));
      setIsEditing(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        onClose();
        setIsEditing(false);
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              {isEditing ? t('editTask') : t('taskDetail')}
            </DialogTitle>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={resetEdit}>
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!editTitle.trim() || updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {t('save')}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={startEditing}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    {t('edit')}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleToggle}>
                        <Check className="h-4 w-4 mr-2" />
                        {isCompleted ? t('markAsIncomplete') : t('markAsComplete')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('deleteTask')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : task ? (
            <div className="space-y-4 py-4">
              {/* 标签栏 */}
              <div className="flex items-center gap-2 flex-wrap">
                {task.category && (
                  <Badge variant="secondary">
                    {task.category.emoji} {task.category.name}
                  </Badge>
                )}
                {task.level && (
                  <Badge
                    variant="outline"
                    className={cn(
                      task.level.value === 3 && 'border-red-500 text-red-500',
                      task.level.value === 2 && 'border-yellow-500 text-yellow-500',
                      task.level.value === 1 && 'border-gray-500 text-gray-500'
                    )}
                  >
                    {task.level.name}{t('priority')}
                  </Badge>
                )}
                {task.isMilestone && (
                  <Badge variant="default">
                    <Flag className="h-3 w-3 mr-1" />
                    {t('milestone')}
                  </Badge>
                )}
                {task.isCycleTask && (
                  <Badge variant="outline">
                    <Repeat className="h-3 w-3 mr-1" />
                    {t('recurring')}
                  </Badge>
                )}
                {isCrossDay && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {t('crossDay')}
                  </Badge>
                )}
              </div>

              {/* 标题 */}
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={t('taskTitle')}
                  className="text-lg font-medium"
                />
              ) : (
                <h3
                  className={cn(
                    'text-lg font-medium',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </h3>
              )}

              {/* 描述 */}
              {isEditing ? (
                <div className="space-y-2">
                  <Label>{t('description')}</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
              ) : task.description ? (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              ) : null}

              {/* 日期时间 */}
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('startDate')}</Label>
                    <div className="flex gap-2 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="min-w-[140px] justify-start">
                            <Calendar className="h-4 w-4 mr-2" />
                            {editStartDate ? format(new Date(editStartDate), 'yyyy-MM-dd') : ''}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={editStartDate ? new Date(editStartDate) : undefined}
                            onSelect={(date) =>
                              date && setEditStartDate(format(date, 'yyyy-MM-dd'))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-36 pr-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('dueDate')}</Label>
                    <div className="flex gap-2 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="min-w-[140px] justify-start">
                            <Calendar className="h-4 w-4 mr-2" />
                            {editDueDate ? format(new Date(editDueDate), 'yyyy-MM-dd') : ''}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={editDueDate ? new Date(editDueDate) : undefined}
                            onSelect={(date) =>
                              date && setEditDueDate(format(date, 'yyyy-MM-dd'))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={editDueTime}
                        onChange={(e) => setEditDueTime(e.target.value)}
                        className="w-36 pr-2"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {isCrossDay ? (
                    <span>
                      {format(new Date(task.startDate), 'MMM d, yyyy HH:mm', { locale: dateFnsLocale })} -{' '}
                      {format(new Date(task.dueDate), 'MMM d, yyyy HH:mm', { locale: dateFnsLocale })}
                    </span>
                  ) : (
                    <span>{format(new Date(task.dueDate), 'MMM d, yyyy HH:mm', { locale: dateFnsLocale })}</span>
                  )}
                </div>
              )}

              {/* 分类和等级选择 */}
              {isEditing && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('category')}</Label>
                    <Select
                      value={editCategoryId || '__none__'}
                      onValueChange={(v) => setEditCategoryId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t('noCategory')}</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('level')}</Label>
                    <Select
                      value={editLevelId || '__none__'}
                      onValueChange={(v) => setEditLevelId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectLevel')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t('noLevel')}</SelectItem>
                        {levels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 子任务 */}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">{t('subtask')}</Label>
                  {parsedSubTasks.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {completedSubTasks}/{parsedSubTasks.length} ({subTaskProgress}%)
                    </span>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSubTaskText}
                      onChange={(e) => setNewSubTaskText(e.target.value)}
                      placeholder={t('addSubtask')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubTask();
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleAddSubTask} disabled={!newSubTaskText.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* 子任务列表 */}
                <div className="space-y-2">
                  {(isEditing ? editSubTasks : parsedSubTasks).map((st) => (
                    <div key={st.id} className="flex items-center gap-2 group">
                      <Checkbox
                        checked={st.isDone}
                        onCheckedChange={() => isEditing && handleToggleSubTask(st.id)}
                        disabled={!isEditing}
                      />
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          st.isDone && 'line-through text-muted-foreground'
                        )}
                      >
                        {st.text}
                      </span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteSubTask(st.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {!isEditing && parsedSubTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('noSubtask')}</p>
                )}
              </div>

              {/* 完成信息 */}
              {isCompleted && task.completedAt && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {t('completedOn')} {format(new Date(task.completedAt), 'MMM d, yyyy', { locale: dateFnsLocale })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">{t('taskNotFound')}</div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
