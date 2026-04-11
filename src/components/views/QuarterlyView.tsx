'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Flag, Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuarterlyTodos } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { formatDate, addMonthsToDate, getTodayString, formatDateDisplay } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export function QuarterlyView() {
  const t = useTranslations();
  const { selectedDate, setSelectedDate, setCurrentView, setCalendarYear, setCalendarMonth } = useViewStore();

  const { data, isLoading, error } = useQuarterlyTodos(selectedDate);

  const today = getTodayString();

  // 切换到上一季度
  const goToPreviousQuarter = () => {
    const newDate = addMonthsToDate(selectedDate, -3);
    setSelectedDate(formatDate(newDate));
  };

  // 切换到下一季度
  const goToNextQuarter = () => {
    const newDate = addMonthsToDate(selectedDate, 3);
    setSelectedDate(formatDate(newDate));
  };

  // 回到当前季度
  const goToThisQuarter = () => {
    setSelectedDate(today);
  };

  // 点击日期 - 跳转到日历视图
  const handleMonthClick = (monthNumber: number) => {
    const year = data?.data.year || new Date().getFullYear();
    setCalendarYear(year);
    setCalendarMonth(monthNumber);
    setCurrentView('calendar');
  };

  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-6xl px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('common.error')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl px-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // 确保 data 存在
  if (!data?.data) {
    return (
      <div className="container mx-auto py-6 max-w-6xl px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('common.noData')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = data.data.stats || {
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
    highPriority: 0,
    milestoneCount: 0,
    completedMilestones: 0,
  };

  const months = data.data.months || [];
  const milestones = data.data.milestones || [];

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-6xl px-4 sm:px-6">
      {/* 标题和控制区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            {data?.data.year} {t('view.quarterView')} - Q{data?.data.quarter}
          </h1>
          <span className="text-sm text-muted-foreground">
            {data?.data.startDate} - {data?.data.endDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToThisQuarter}>
            {t('view.thisWeek')}
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousQuarter}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextQuarter}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('task.total')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{t('task.completed')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">{t('task.milestone')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">
              {stats.completedMilestones}/{stats.milestoneCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="text-xs text-muted-foreground">{t('stats.completionRate')}</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-1.5 sm:mt-2 h-1.5 sm:h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 月度进度 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('view.monthView')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {months.map((month) => {
                const monthNames = [
                  t('month.january'), t('month.february'), t('month.march'),
                  t('month.april'), t('month.may'), t('month.june'),
                  t('month.july'), t('month.august'), t('month.september'),
                  t('month.october'), t('month.november'), t('month.december')
                ];
                return (
                  <div
                    key={month.monthNumber}
                    className="cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                    onClick={() => handleMonthClick(month.monthNumber)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{monthNames[month.monthNumber - 1]}</span>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{t('task.completed')} {month.completed}</span>
                        <span>{t('task.pending')} {month.pending}</span>
                        <span className="font-medium text-foreground">
                          {month.completionRate}%
                        </span>
                      </div>
                    </div>
                    <Progress value={month.completionRate} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 里程碑 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Flag className="h-5 w-5" />
              {t('task.milestone')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Flag className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      milestone.status === 'completed'
                        ? 'bg-muted/30'
                        : 'bg-card hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {milestone.status === 'completed' ? (
                        <Badge variant="secondary" className="text-xs">{t('task.completed')}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">{t('task.pending')}</Badge>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {milestone.dueDate ? formatDateDisplay(milestone.dueDate, 'yyyy-MM-dd') : ''}
                        </p>
                        {milestone.category && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {milestone.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
