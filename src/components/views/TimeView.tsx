'use client';

import { useState } from 'react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimeEntryCard } from '@/components/time/TimeEntryCard';
import { TimeEntryForm } from '@/components/time/TimeEntryForm';
import { TimeStatsCard } from '@/components/time/TimeStatsCard';
import { useDailyTimeEntries, useDeleteTimeEntry } from '@/hooks/use-time-entries';
import { useViewStore } from '@/hooks/use-view-store';
import { getTodayString } from '@/lib/date-utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function TimeView() {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;
  const isMobile = useIsMobile();

  const { selectedDate, setSelectedDate } = useViewStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    id: string;
    title: string;
    description?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    categoryId?: string | null;
    todoId?: string | null;
  } | null>(null);

  const { data, isLoading } = useDailyTimeEntries(selectedDate);
  const deleteMutation = useDeleteTimeEntry();

  const today = getTodayString();
  const isToday = selectedDate === today;

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      setSelectedDate(dateStr);
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(today);
  };

  const handlePrevDay = () => {
    const current = parseISO(`${selectedDate}T12:00:00`);
    const prevDay = subDays(current, 1);
    setSelectedDate(format(prevDay, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const current = parseISO(`${selectedDate}T12:00:00`);
    const nextDay = addDays(current, 1);
    setSelectedDate(format(nextDay, 'yyyy-MM-dd'));
  };

  const handleEdit = (entry: {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    categoryId?: string | null;
    todoId?: string | null;
  }) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  // 格式化显示日期
  const displayDate = format(parseISO(`${selectedDate}T12:00:00`), 'EEEE, MMMM d', { locale: dateFnsLocale });

  return (
    <div className="space-y-6 px-4 sm:px-6 max-w-3xl mx-auto">
      {/* 简洁头部 */}
      <div className="flex items-center justify-between py-4">
        {/* 日期导航 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="gap-1.5 h-8 px-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{displayDate}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseISO(`${selectedDate}T12:00:00`)}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={handleGoToToday} className="h-8 text-muted-foreground">
              {t('nav.backToToday')}
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)} size="sm" className="h-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 简洁统计条 */}
          <TimeStatsCard
            totalDuration={data?.data?.stats?.totalDuration || 0}
            taskTime={data?.data?.stats?.taskTime || 0}
            otherTime={data?.data?.stats?.otherTime || 0}
            categoryDistribution={data?.data?.stats?.categoryDistribution || []}
          />

          {/* 时间条目列表 */}
          <div className="space-y-1">
            {data?.data?.entries?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">{t('time.noRecords')}</p>
              </div>
            ) : (
              data?.data?.entries?.map((entry) => (
                <TimeEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* 时间记录表单 */}
      <TimeEntryForm
        open={isFormOpen}
        onClose={handleFormClose}
        initialData={editingEntry}
        date={selectedDate}
      />
    </div>
  );
}