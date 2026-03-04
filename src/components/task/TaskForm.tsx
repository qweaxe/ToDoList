'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, Repeat, Flag, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { createTodoSchema, type CreateTodoInput } from '@/types/api';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { useCreateTodo, useUpdateTodo } from '@/hooks/use-todos';
import { getTodayString } from '@/lib/date-utils';
import { QUICK_PRESETS } from '@/lib/cron-utils';

interface SubTask {
  id: string;
  text: string;
  isDone: boolean;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
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
  };
  defaultDate?: string;
}

export function TaskForm({ open, onClose, initialData, defaultDate }: TaskFormProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [isCycleTask, setIsCycleTask] = useState(false);
  const [cycleFrequency, setCycleFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('DAILY');
  const [cycleInterval, setCycleInterval] = useState(1);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const { data: categoriesData } = useCategories();
  const { data: levelsData } = useLevels();
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();

  const categories = categoriesData?.data || [];
  const levels = levelsData?.data || [];

  // 是否为已完成的任务
  const isCompleted = initialData?.status === 'completed';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: defaultDate || getTodayString(),
      dueDate: defaultDate || getTodayString(),
      categoryId: '',
      levelId: '',
      isMilestone: false,
      priority: 0,
    },
  });

  const startDate = watch('startDate');
  const dueDate = watch('dueDate');

  // 使用 ref 跟踪已初始化的任务 ID，避免重复重置
  const initializedTaskId = useRef<string | null>(null);

  // 初始化编辑数据 - 只在任务 ID 改变时重置
  useEffect(() => {
    const currentTaskId = initialData?.id || null;
    
    // 只有当任务 ID 改变时才重置表单
    if (currentTaskId !== initializedTaskId.current) {
      initializedTaskId.current = currentTaskId;
      
      if (initialData) {
        reset({
          title: initialData.title,
          description: initialData.description || '',
          startDate: initialData.startDate,
          dueDate: initialData.dueDate,
          categoryId: initialData.categoryId || '',
          levelId: initialData.levelId || '',
          isMilestone: initialData.isMilestone,
          priority: initialData.priority,
        });
        setIsCycleTask(initialData.isCycleTask);
        setCompletedAt(initialData.completedAt || null);

        // 解析子任务
        if (initialData.subTasks) {
          try {
            const parsed = JSON.parse(initialData.subTasks);
            setSubTasks(parsed);
          } catch {
            setSubTasks([]);
          }
        } else {
          setSubTasks([]);
        }
      } else {
        reset({
          title: '',
          description: '',
          startDate: defaultDate || getTodayString(),
          dueDate: defaultDate || getTodayString(),
          categoryId: '',
          levelId: '',
          isMilestone: false,
          priority: 0,
        });
        setSubTasks([]);
        setIsCycleTask(false);
        setCompletedAt(null);
      }
    }
  }, [initialData, defaultDate, reset]);

  // 添加子任务
  const addSubTask = () => {
    if (newSubTask.trim()) {
      setSubTasks([
        ...subTasks,
        { id: crypto.randomUUID(), text: newSubTask.trim(), isDone: false },
      ]);
      setNewSubTask('');
    }
  };

  // 删除子任务
  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  // 提交表单
  const onSubmit = async (data: CreateTodoInput) => {
    // 获取表单中的值，处理空字符串为 null
    const categoryId = data.categoryId && data.categoryId !== '' && data.categoryId !== '__none__' ? data.categoryId : null;
    const levelId = data.levelId && data.levelId !== '' && data.levelId !== '__none__' ? data.levelId : null;
    
    // 调试：打印原始表单数据和处理后的值
    console.log('=== TaskForm onSubmit DEBUG ===');
    console.log('原始表单 data:', JSON.stringify(data, null, 2));
    console.log('watch categoryId:', watch('categoryId'));
    console.log('watch levelId:', watch('levelId'));
    console.log('处理后 categoryId:', categoryId);
    console.log('处理后 levelId:', levelId);
    
    const submitData = {
      ...data,
      categoryId,
      levelId,
      subTasks: subTasks.length > 0 ? subTasks : null,
      isCycleTask,
      recurrenceRule: isCycleTask
        ? {
            frequency: cycleFrequency,
            interval: cycleInterval,
            startDate: data.startDate,
          }
        : null,
    };

    // 只有已完成的任务才发送完成日期字段
    // 未完成的任务不发送 completedAt 字段（而不是发送 null）
    if (isCompleted) {
      submitData.completedAt = completedAt;
    }

    console.log('最终提交数据 submitData:', JSON.stringify(submitData, null, 2));
    console.log('initialData?.id:', initialData?.id);

    if (initialData) {
      await updateMutation.mutateAsync({
        id: initialData.id,
        data: submitData,
      });
    } else {
      await createMutation.mutateAsync(submitData);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? '编辑任务' : '创建新任务'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              placeholder="输入任务标题..."
              {...register('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="添加任务描述..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* 日期选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(new Date(startDate), 'yyyy-MM-dd') : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue('startDate', format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>截止日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue('dueDate', format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 分类和等级 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={watch('categoryId') || '__none__'}
                onValueChange={(value) => setValue('categoryId', value === '__none__' ? '' : value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">无分类</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>优先级</Label>
              <Select
                value={watch('levelId') || '__none__'}
                onValueChange={(value) => setValue('levelId', value === '__none__' ? '' : value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">无优先级</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Lv.{level.value}
                        </span>
                        {level.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 完成日期 - 仅已完成的任务可编辑 */}
          {isCompleted && (
            <div className="space-y-2 p-4 border rounded-lg bg-green-50/50 border-green-200">
              <Label className="flex items-center gap-2 text-green-700">
                <CalendarCheck className="h-4 w-4" />
                完成日期
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !completedAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {completedAt ? format(new Date(completedAt), 'yyyy年M月d日', { locale: zhCN }) : '选择完成日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={completedAt ? new Date(completedAt) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setCompletedAt(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                此任务已完成，可修改完成日期
              </p>
            </div>
          )}

          {/* 子任务 */}
          <div className="space-y-2">
            <Label>子任务</Label>
            <div className="flex gap-2">
              <Input
                placeholder="添加子任务..."
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubTask();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSubTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {subTasks.length > 0 && (
              <div className="mt-2 space-y-2">
                {subTasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-md"
                  >
                    <Checkbox
                      checked={st.isDone}
                      onCheckedChange={(checked) => {
                        setSubTasks(
                          subTasks.map((s) =>
                            s.id === st.id ? { ...s, isDone: !!checked } : s
                          )
                        );
                      }}
                    />
                    <span className="flex-1">{st.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubTask(st.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 周期任务 */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                <Label>周期任务</Label>
              </div>
              <Switch
                checked={isCycleTask}
                onCheckedChange={setIsCycleTask}
              />
            </div>

            {isCycleTask && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>重复频率</Label>
                  <Select
                    value={cycleFrequency}
                    onValueChange={(v) => setCycleFrequency(v as typeof cycleFrequency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUICK_PRESETS.slice(0, 4).map((preset) => (
                        <SelectItem
                          key={preset.frequency}
                          value={preset.frequency}
                        >
                          {preset.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="YEARLY">每年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>间隔</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cycleInterval}
                    onChange={(e) => setCycleInterval(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 里程碑 */}
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <Label className="flex-1">标记为里程碑</Label>
            <Switch
              checked={watch('isMilestone')}
              onCheckedChange={(checked) => setValue('isMilestone', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {initialData ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
