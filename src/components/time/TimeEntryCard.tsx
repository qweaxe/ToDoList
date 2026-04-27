'use client';

import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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
}

export function TimeEntryCard({ entry, onEdit, onDelete }: TimeEntryCardProps) {
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
    <div className="group flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      {/* 时间范围 */}
      <div className="flex-shrink-0 text-sm text-muted-foreground font-medium w-24">
        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
      </div>

      {/* 分类 emoji */}
      <div className="flex-shrink-0 w-8 text-center">
        {entry.category?.emoji ? (
          <span className="text-lg">{entry.category.emoji}</span>
        ) : (
          <span className="text-sm text-muted-foreground">○</span>
        )}
      </div>

      {/* 标题和描述 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{entry.title}</span>
          {entry.todo && (
            <span className="text-xs text-muted-foreground truncate">
              → {entry.todo.title}
            </span>
          )}
        </div>
        {entry.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {entry.description}
          </p>
        )}
      </div>

      {/* 时长 */}
      <div className="flex-shrink-0 text-sm font-medium text-muted-foreground">
        {formatDuration(entry.duration)}
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(entry.id)}
              className="text-destructive"
            >
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}