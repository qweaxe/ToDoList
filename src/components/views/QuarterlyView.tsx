'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Flag, Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuarterlyTodos } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { formatDate, addMonthsToDate, getTodayString } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export function QuarterlyView() {
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
            加载季度数据失败，请刷新页面重试
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
            暂无季度数据
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
            {data?.data.year}年 {data?.data.quarterName}
          </h1>
          <span className="text-sm text-muted-foreground">
            {data?.data.startDate} - {data?.data.endDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToThisQuarter}>
            本季度
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">总任务</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">已完成</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1 text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-orange-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">里程碑</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">
              {stats.completedMilestones}/{stats.milestoneCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="text-xs sm:text-sm text-muted-foreground">完成率</div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 月度进度 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              月度进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {months.map((month) => (
                <div
                  key={month.monthNumber}
                  className="cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                  onClick={() => handleMonthClick(month.monthNumber)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{month.month}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>完成 {month.completed}</span>
                      <span>待办 {month.pending}</span>
                      <span className="font-medium text-foreground">
                        {month.completionRate}%
                      </span>
                    </div>
                  </div>
                  <Progress value={month.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 里程碑 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Flag className="h-5 w-5" />
              里程碑
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Flag className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">本季度暂无里程碑</p>
                <p className="text-xs mt-1">
                  在任务编辑中标记"里程碑"即可显示
                </p>
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
                        <Badge variant="secondary" className="text-xs">已完成</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">进行中</Badge>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          截止: {milestone.dueDate}
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
