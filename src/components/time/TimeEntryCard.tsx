'use client';

import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeEntryCardProps {
  entry: {
    id: string;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    duration: number;
    category?: {
      id: string;
      name: string;
      emoji?: string | null;
      color?: string | null;
    } | null;
    todo?: {
      id: string;
      title: string;
    } | null;
  };
  onEdit: (entry: {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    categoryId?: string | null;
    todoId?: string | null;
  }) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export function TimeEntryCard({ entry, onEdit, onDelete, compact = false }: TimeEntryCardProps) {
  const t = useTranslations();

  const formatTime = (isoString: string) => {
    const date = parseISO(isoString);
    return format(date, 'HH:mm');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const handleEdit = () => {
    // 从 startTime 提取日期
    const date = format(parseISO(entry.startTime), 'yyyy-MM-dd');
    onEdit({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      categoryId: entry.category?.id || null,
      todoId: entry.todo?.id || null,
    });
  };

  return (
    <Card className={cn('transition-colors', compact && 'py-2')}>
      <CardContent className={cn('p-3 sm:p-4', compact && 'py-2')}>
        <div className="flex items-start gap-3 sm:gap-4">
          {/* 分类图标/emoji */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            {entry.category?.emoji ? (
              <span className="text-lg">{entry.category.emoji}</span>
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{entry.title}</h3>
                {entry.description && !compact && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {entry.description}
                  </p>
                )}
              </div>

              {/* 时长徽章 */}
              <Badge variant="secondary" className="flex-shrink-0">
                {formatDuration(entry.duration)}
              </Badge>
            </div>

            {/* 时间和关联信息 */}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
              <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
              {entry.category && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    entry.category.color && `bg-${entry.category.color}/10`
                  )}
                >
                  {entry.category.name}
                </Badge>
              )}
              {entry.todo && (
                <Badge variant="outline" className="text-xs">
                  {t('time.linkedTask')}: {entry.todo.title}
                </Badge>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(entry.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}