'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { useConvertInboxItem, type InboxItem } from '@/hooks/use-inbox';
import { getTodayString } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface ConvertToTodoDialogProps {
  item: InboxItem | null;
  open: boolean;
  onClose: () => void;
}

export function ConvertToTodoDialog({
  item,
  open,
  onClose,
}: ConvertToTodoDialogProps) {
  const t = useTranslations('inbox');
  const tTask = useTranslations('task');

  const { data: categoriesData } = useCategories();
  const { data: levelsData } = useLevels();
  const convertMutation = useConvertInboxItem();

  const categories = categoriesData?.data ?? [];
  const levels = levelsData?.data ?? [];

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [levelId, setLevelId] = useState('');

  // 初始化表单
  useEffect(() => {
    if (item) {
      setTitle(item.content);
      setDescription('');
      const today = getTodayString();
      setStartDate(today);
      setDueDate(today);
      setCategoryId('');
      setLevelId('');
    }
  }, [item]);

  // 提交
  const handleSubmit = () => {
    if (!item || !startDate || !dueDate) return;

    // 合并日期和时间（默认 00:00 - 23:59）
    const startDateTime = new Date(`${startDate}T00:00:00`);
    const dueDateTime = new Date(`${dueDate}T23:59:59`);

    convertMutation.mutate(
      {
        id: item.id,
        data: {
          title: title.trim() || item.content,
          description: description.trim() || undefined,
          startDate: startDateTime.toISOString(),
          dueDate: dueDateTime.toISOString(),
          categoryId: categoryId || undefined,
          levelId: levelId || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('convertDialogTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 原始内容 */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t('originalContent')}</Label>
            <p className="text-sm bg-muted p-2 rounded">{item.content}</p>
          </div>

          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">{tTask('title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={item.content}
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">{tTask('description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tTask('startDate')}</Label>
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
                    {startDate || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? parseISO(`${startDate}T12:00:00`) : undefined}
                    onSelect={(date) =>
                      date && setStartDate(format(date, 'yyyy-MM-dd'))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{tTask('dueDate')}</Label>
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
                    {dueDate || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? parseISO(`${dueDate}T12:00:00`) : undefined}
                    onSelect={(date) =>
                      date && setDueDate(format(date, 'yyyy-MM-dd'))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 分类和等级 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tTask('category')}</Label>
              <Select
                value={categoryId || '__none__'}
                onValueChange={(v) => setCategoryId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tTask('noCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{tTask('noCategory')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{tTask('priority')}</Label>
              <Select
                value={levelId || '__none__'}
                onValueChange={(v) => setLevelId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tTask('noPriority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{tTask('noLevel')}</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {tTask('cancel') || '取消'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!startDate || !dueDate || convertMutation.isPending}
            >
              {convertMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('convertToTodo')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
