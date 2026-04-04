'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { REMINDER_PRESETS } from '@/hooks/use-reminders';

interface Reminder {
  id?: string;
  remindAt: Date;
  type: string;
  offset: number | null;
}

interface ReminderManagerProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
  startDate: Date;
  dueDate: Date;
  disabled?: boolean;
}

/**
 * 提醒管理组件
 *
 * 用于任务表单中设置提醒
 */
export function ReminderManager({
  reminders,
  onChange,
  startDate,
  dueDate,
  disabled,
}: ReminderManagerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState<Date>();
  const [customTime, setCustomTime] = useState('09:00');

  // 添加预设提醒
  const addPresetReminder = (preset: typeof REMINDER_PRESETS[number]) => {
    let remindAt: Date;

    if (preset.type === 'custom' && preset.offset === null) {
      remindAt = startDate;
    } else if (preset.type === 'before_due' && preset.offset !== null) {
      remindAt = new Date(dueDate.getTime() - preset.offset * 60000);
    } else {
      return;
    }

    // 检查是否已过期
    if (remindAt < new Date()) {
      return;
    }

    // 检查是否已存在相同提醒
    const exists = reminders.some(
      r => r.type === preset.type && r.offset === preset.offset
    );
    if (exists) {
      return;
    }

    onChange([
      ...reminders,
      {
        remindAt,
        type: preset.type,
        offset: preset.offset,
      },
    ]);
  };

  // 添加自定义提醒
  const addCustomReminder = () => {
    if (!customDate) return;

    const [hours, minutes] = customTime.split(':').map(Number);
    const remindAt = new Date(customDate);
    remindAt.setHours(hours, minutes, 0, 0);

    // 检查是否已过期
    if (remindAt < new Date()) {
      return;
    }

    onChange([
      ...reminders,
      {
        remindAt,
        type: 'custom',
        offset: null,
      },
    ]);

    setShowCustom(false);
    setCustomDate(undefined);
  };

  // 删除提醒
  const removeReminder = (index: number) => {
    onChange(reminders.filter((_, i) => i !== index));
  };

  // 格式化提醒显示
  const formatReminder = (reminder: Reminder): string => {
    if (reminder.type === 'custom' && reminder.offset === null) {
      return '任务开始时';
    }

    if (reminder.type === 'before_due') {
      if (reminder.offset === 0) {
        return '截止时';
      }
      if (reminder.offset! < 60) {
        return `提前 ${reminder.offset} 分钟`;
      }
      if (reminder.offset! < 1440) {
        return `提前 ${Math.floor(reminder.offset! / 60)} 小时`;
      }
      return `提前 ${Math.floor(reminder.offset! / 1440)} 天`;
    }

    return format(reminder.remindAt, 'MM/dd HH:mm');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          提醒
        </Label>
        {!disabled && (
          <Popover open={showCustom} onOpenChange={setShowCustom}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                自定义
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <Label>自定义提醒时间</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">日期</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                          {customDate ? format(customDate, 'MM/dd') : '选择'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customDate}
                          onSelect={setCustomDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">时间</Label>
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={addCustomReminder}
                  disabled={!customDate}
                  className="w-full"
                >
                  添加
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* 预设提醒按钮 */}
      {!disabled && (
        <div className="flex flex-wrap gap-1.5">
          {REMINDER_PRESETS.slice(0, 6).map((preset) => {
            const isActive = reminders.some(
              r => r.type === preset.type && r.offset === preset.offset
            );
            return (
              <Button
                key={preset.label}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => addPresetReminder(preset)}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* 已设置的提醒列表 */}
      {reminders.length > 0 && (
        <div className="space-y-1.5">
          {reminders.map((reminder, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">{formatReminder(reminder)}</span>
                <span className="text-xs text-muted-foreground">
                  {format(reminder.remindAt, 'MM/dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeReminder(index)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {reminders.length === 0 && disabled && (
        <p className="text-xs text-muted-foreground">未设置提醒</p>
      )}
    </div>
  );
}
