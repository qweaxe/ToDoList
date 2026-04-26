'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarIcon, Clock, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { createTimeEntrySchema, type CreateTimeEntryInput } from '@/types/api';
import { useCategories } from '@/hooks/use-categories';
import { useCreateTimeEntry, useUpdateTimeEntry } from '@/hooks/use-time-entries';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimeEntryFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    categoryId?: string | null;
    todoId?: string | null;
  };
  date: string;
}

// 从 ISO 字符串提取日期部分
function extractDateFromISO(isoString: string): string {
  if (!isoString) return format(new Date(), 'yyyy-MM-dd');
  if (!isoString.includes('T')) return isoString;
  return isoString.split('T')[0];
}

// 从 ISO 字符串提取时间部分
function extractTimeFromISO(isoString: string): string {
  if (!isoString || !isoString.includes('T')) {
    return '09:00';
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '09:00';
  }
  return format(date, 'HH:mm');
}

// 合并日期和时间
function combineDateAndTime(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`;
}

export function TimeEntryForm({ open, onClose, initialData, date }: TimeEntryFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const isMobile = useIsMobile();

  const [entryDate, setEntryDate] = useState(date);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const { data: categoriesData } = useCategories();
  const createMutation = useCreateTimeEntry();
  const updateMutation = useUpdateTimeEntry();

  const categories = categoriesData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTimeEntryInput>({
    resolver: zodResolver(createTimeEntrySchema),
    defaultValues: {
      title: '',
      description: '',
      date: date,
      startTime: combineDateAndTime(date, '09:00'),
      endTime: combineDateAndTime(date, '10:00'),
      categoryId: null,
      todoId: null,
    },
  });

  // 初始化或编辑时设置表单值
  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title);
      setValue('description', initialData.description || '');
      setValue('categoryId', initialData.categoryId || null);
      setValue('todoId', initialData.todoId || null);

      const initialDate = extractDateFromISO(initialData.startTime);
      const initialStartTime = extractTimeFromISO(initialData.startTime);
      const initialEndTime = extractTimeFromISO(initialData.endTime);

      setEntryDate(initialDate);
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setValue('date', initialDate);
      setValue('startTime', combineDateAndTime(initialDate, initialStartTime));
      setValue('endTime', combineDateAndTime(initialDate, initialEndTime));
    } else {
      reset();
      setEntryDate(date);
      setStartTime('09:00');
      setEndTime('10:00');
      setValue('date', date);
      setValue('startTime', combineDateAndTime(date, '09:00'));
      setValue('endTime', combineDateAndTime(date, '10:00'));
    }
  }, [initialData, date, setValue, reset]);

  // 监听日期和时间变化，更新 ISO 字符串
  useEffect(() => {
    setValue('date', entryDate);
    setValue('startTime', combineDateAndTime(entryDate, startTime));
    setValue('endTime', combineDateAndTime(entryDate, endTime));
  }, [entryDate, startTime, endTime, setValue]);

  const onSubmit = async (data: CreateTimeEntryInput) => {
    if (initialData) {
      updateMutation.mutate(
        { id: initialData.id, data },
        {
          onSuccess: (result) => {
            if (result.success) {
              onClose();
            }
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (result) => {
          if (result.success) {
            onClose();
          }
        },
      });
    }
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setEntryDate(dateStr);
    }
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 活动名称 */}
      <div className="space-y-2">
        <Label htmlFor="title">{t('time.activity')}</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder={t('time.activityPlaceholder')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('task.description')}</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder={t('task.descriptionPlaceholder')}
          rows={2}
        />
      </div>

      {/* 日期和时间 */}
      <div className="space-y-2">
        <Label>{t('time.dateTime')}</Label>
        <div className="flex gap-2 items-center">
          {/* 日期选择 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {entryDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseISO(`${entryDate}T12:00:00`)}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* 开始时间 */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{t('time.startTime')}</span>
            <TimePicker value={startTime} onChange={setStartTime} />
          </div>

          {/* 结束时间 */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{t('time.endTime')}</span>
            <TimePicker value={endTime} onChange={setEndTime} />
          </div>
        </div>
        {/* 时间验证提示 */}
        {startTime && endTime && startTime >= endTime && (
          <p className="text-sm text-destructive">{t('time.timeOrderError')}</p>
        )}
      </div>

      {/* 分类 */}
      <div className="space-y-2">
        <Label>{t('task.category')}</Label>
        <Select
          value={watch('categoryId') || 'none'}
          onValueChange={(value) => setValue('categoryId', value === 'none' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('task.selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('task.noCategory')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  {cat.emoji && <span>{cat.emoji}</span>}
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting || (startTime >= endTime)}>
          {initialData ? t('common.update') : t('time.newEntry')}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {initialData ? t('time.editEntry') : t('time.newEntry')}
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <FormContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('time.editEntry') : t('time.newEntry')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <FormContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}