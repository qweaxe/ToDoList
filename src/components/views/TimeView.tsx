'use client';

import { useState } from 'react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* 第一行：标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h1 className="text-xl sm:text-2xl font-bold">{t('time.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isToday && (
              <Button variant="outline" size="sm" onClick={handleGoToToday}>
                {t('nav.backToToday')}
              </Button>
            )}
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('time.newEntry')}</span>
            </Button>
          </div>
        </div>

        {/* 第二行：日期导航控制 */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[120px] sm:min-w-[140px]">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('task.selectDate')}</span>
                <span className="sm:hidden">{format(parseISO(`${selectedDate}T12:00:00`), 'MMM d', { locale: dateFnsLocale })}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={parseISO(`${selectedDate}T12:00:00`)}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <TimeStatsCard
            totalDuration={data?.data?.stats?.totalDuration || 0}
            taskTime={data?.data?.stats?.taskTime || 0}
            otherTime={data?.data?.stats?.otherTime || 0}
            categoryDistribution={data?.data?.stats?.categoryDistribution || []}
          />

          {/* 时间条目列表 */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3">{t('time.entries')}</h2>
            {data?.data?.entries?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('time.noRecords')}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {data?.data?.entries?.map((entry) => (
                  <TimeEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
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