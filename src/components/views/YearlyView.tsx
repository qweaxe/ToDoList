'use client';

import { useState } from 'react';
import { format, getMonth, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
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

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// 热力图颜色等级
const HEAT_COLORS = [
  'bg-gray-100 dark:bg-gray-800', // 0: 无数据
  'bg-green-200 dark:bg-green-900', // 1: 1-2
  'bg-green-400 dark:bg-green-700', // 2: 3-4
  'bg-green-500 dark:bg-green-600', // 3: 5-6
  'bg-green-600 dark:bg-green-500', // 4: 7+
];

export function YearlyView() {
  const { selectedDate, setSelectedDate, setCurrentView, setCalendarYear, setCalendarMonth } = useViewStore();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const year = new Date(selectedDate).getFullYear();
  const { data, isLoading } = useYearlyStats(year);
  const today = getTodayString();

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

  // 组织热力图数据为周视图
  const buildHeatmapGrid = (heatmap: typeof data.data.heatmap) => {
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
  };

  const heatmapGrid = buildHeatmapGrid(data?.data?.heatmap);

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
    mostProductiveMonth: { month: '1月', completed: 0 },
    topCategory: null,
  };

  const monthlyStats = data?.data.monthlyStats || [];
  const categoryStats = data?.data.categoryStats || [];

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-6xl px-4 sm:px-6">
      {/* 标题和控制区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">{year} 年度足迹</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToThisYear}>
            今年
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">完成任务</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{summary.totalCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">活跃天数</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{summary.activeDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">最长连续</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{summary.longestStreak}天</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">日均完成</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{summary.avgPerDay}</div>
          </CardContent>
        </Card>
      </div>

      {/* 热力图 */}
      <Card className="mb-6 overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            年度贡献图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="min-w-[700px]">
              {/* 月份标签 */}
              <div className="flex mb-2 pl-8">
                {MONTH_LABELS.map((month, i) => (
                  <div
                    key={month}
                    className="flex-1 text-xs text-muted-foreground"
                    style={{ minWidth: '52px' }}
                  >
                    {i % 3 === 0 ? month : ''}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                {/* 星期标签 */}
                <div className="flex flex-col gap-[2px] pt-1">
                  {DAY_LABELS.map((day, i) => (
                    <div
                      key={day}
                      className="h-[11px] text-[10px] text-muted-foreground flex items-center"
                    >
                      {i % 2 === 1 ? day : ''}
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
                                <div>{day.count} 个任务完成</div>
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
                <span>少</span>
                {HEAT_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className={cn('w-[10px] h-[10px] rounded-sm', color)}
                  />
                ))}
                <span>多</span>
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
            <CardTitle className="text-base sm:text-lg">月度完成统计</CardTitle>
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
                <span className="text-muted-foreground">最勤奋月份:</span>
                <Badge variant="secondary">{summary.mostProductiveMonth.month}</Badge>
                <span className="text-muted-foreground">
                  {summary.mostProductiveMonth.completed} 个任务
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分类统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">专注领域</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">暂无分类数据</p>
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
                      <Badge variant="outline">{category.count} 个</Badge>
                    </div>
                  ))}
                </div>

                {summary.topCategory && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">最专注领域:</span>
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
