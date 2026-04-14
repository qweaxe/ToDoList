'use client';

import { useState, useMemo } from 'react';
import { format, getMonth, getDay } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, Flame, Trophy, Calendar, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useYearlyStats } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { getTodayString, formatDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

// 热力图颜色等级
const HEAT_COLORS = [
  'bg-gray-100 dark:bg-gray-800', // 0: 无数据
  'bg-green-200 dark:bg-green-900', // 1: 1-2
  'bg-green-400 dark:bg-green-700', // 2: 3-4
  'bg-green-500 dark:bg-green-600', // 3: 5-6
  'bg-green-600 dark:bg-green-500', // 4: 7+
];

export function YearlyView() {
  const t = useTranslations();
  const locale = useLocale();
  const { selectedDate, setSelectedDate, setCurrentView, setCalendarYear, setCalendarMonth } = useViewStore();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const year = new Date(selectedDate).getFullYear();
  const { data, isLoading } = useYearlyStats(year);
  const today = getTodayString();

  // 从翻译获取月份和星期标签
  const MONTH_LABELS = [
    t('month.january'), t('month.february'), t('month.march'),
    t('month.april'), t('month.may'), t('month.june'),
    t('month.july'), t('month.august'), t('month.september'),
    t('month.october'), t('month.november'), t('month.december')
  ];
  const DAY_LABELS = [
    t('weekday.sunShort'), t('weekday.monShort'), t('weekday.tueShort'),
    t('weekday.wedShort'), t('weekday.thuShort'), t('weekday.friShort'),
    t('weekday.satShort')
  ];

  // 切换年份
  const goToPreviousYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year - 1);
    setSelectedDate(formatDate(newDate));
  };

  const goToNextYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year + 1);
    setSelectedDate(formatDate(newDate));
  };

  const goToThisYear = () => {
    setSelectedDate(today);
  };

  // 点击日期 - 跳转到当日视图
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  // 构建热力图网格（使用 memoization，365+ 个单元格）
  const heatmapGrid = useMemo(() => {
    const heatmap = data?.data?.heatmap;
    if (!heatmap) return [];

    const grid: Array<Array<{ date: string; count: number; level: number } | null>> = [];
    let currentWeek: Array<{ date: string; count: number; level: number } | null> = [];

    heatmap.forEach((day) => {
      // 周日开始新的一周
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        grid.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }

      if (currentWeek.length === 0) {
        currentWeek = new Array(7).fill(null);
      }

      currentWeek[day.dayOfWeek] = {
        date: day.date,
        count: day.count,
        level: day.level,
      };
    });

    // 添加最后一周
    if (currentWeek.some((d) => d !== null)) {
      grid.push(currentWeek);
    }

    return grid;
  }, [data?.data?.heatmap]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.data.summary || {
    totalCompleted: 0,
    activeDays: 0,
    avgPerDay: '0',
    longestStreak: 0,
    mostProductiveMonth: { month: 'Jan', completed: 0 },
    topCategory: null,
  };

  const monthlyStats = data?.data.monthlyStats || [];
  const categoryStats = data?.data.categoryStats || [];

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-6xl px-4 sm:px-6">
      {/* 标题和控制区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">{year} {t('year.yearFootprint')}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToThisYear}>
            {t('stats.thisYear')}
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{t('task.completed')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{summary.totalCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{t('year.activeDays')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{summary.activeDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">{t('year.longestStreak')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{summary.longestStreak}{t('year.days')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{t('year.avgPerDay')}</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{summary.avgPerDay}</div>
          </CardContent>
        </Card>
      </div>

      {/* 热力图 - 移动端支持横向滚动 */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('year.contributionGraph')}
          </CardTitle>
          {/* 移动端滚动提示 */}
          <p className="text-xs text-muted-foreground sm:hidden">
            ← {t('common.swipeToView')} →
          </p>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 sm:pb-0">
              <div className="min-w-[600px] sm:min-w-[700px]">
              {/* 月份标签 */}
              <div className="flex mb-2 pl-8">
                {MONTH_LABELS.map((monthLabel, i) => (
                  <div
                    key={i}
                    className="flex-1 text-xs text-muted-foreground"
                    style={{ minWidth: '52px' }}
                  >
                    {i % 3 === 0 ? monthLabel : ''}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                {/* 星期标签 */}
                <div className="flex flex-col gap-[2px] pt-1">
                  {DAY_LABELS.map((dayLabel, i) => (
                    <div
                      key={i}
                      className="h-[11px] text-[10px] text-muted-foreground flex items-center"
                    >
                      {i % 2 === 1 ? dayLabel : ''}
                    </div>
                  ))}
                </div>

                {/* 热力图格子 */}
                <div className="flex gap-[2px]">
                  {heatmapGrid.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[2px]">
                      {week.map((day, dayIndex) => (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-[10px] h-[11px] rounded-sm cursor-pointer transition-colors',
                                day
                                  ? HEAT_COLORS[day.level]
                                  : 'bg-transparent'
                              )}
                              onClick={() => day && handleDateClick(day.date)}
                              onMouseEnter={() => day && setHoveredDate(day.date)}
                              onMouseLeave={() => setHoveredDate(null)}
                            />
                          </TooltipTrigger>
                          {day && (
                            <TooltipContent side="top" className="text-xs">
                              <div className="text-center">
                                <div className="font-medium">{day.date}</div>
                                <div>{t('year.tasksCompleted', { count: day.count })}</div>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* 图例 */}
              <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                <span>{t('year.less')}</span>
                {HEAT_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className={cn('w-[10px] h-[10px] rounded-sm', color)}
                  />
                ))}
                <span>{t('year.more')}</span>
              </div>
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* 月度和分类统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 月度统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">{t('year.monthlyStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyStats.map((month) => (
                <div
                  key={month.month}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setCalendarYear(year);
                    setCalendarMonth(month.month);
                    setCurrentView('calendar');
                  }}
                >
                  <span className="text-sm">{month.monthName}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (month.completed / Math.max(...monthlyStats.map((m) => m.completed || 1))) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {month.completed}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 最勤奋月份 */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">{t('year.mostProductiveMonth')}:</span>
                <Badge variant="secondary">{summary.mostProductiveMonth.month}</Badge>
                <span className="text-muted-foreground">
                  {t('year.tasksCount', { count: summary.mostProductiveMonth.completed })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分类统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">{t('year.focusArea')}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('year.noCategoryData')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {categoryStats.map((category, index) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          #{index + 1}
                        </span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <Badge variant="outline">{t('year.tasksCount', { count: category.count })}</Badge>
                    </div>
                  ))}
                </div>

                {summary.topCategory && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">{t('year.topFocusArea')}:</span>
                      <Badge>{summary.topCategory.name}</Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
