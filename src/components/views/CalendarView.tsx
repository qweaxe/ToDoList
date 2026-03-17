'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { MonthStats } from '@/components/calendar/MonthStats';
import { TaskForm } from '@/components/task/TaskForm';
import { TaskDetailDialog } from '@/components/task/TaskDetailDialog';
import { useMonthlyTodos } from '@/hooks/use-todos';
import { useHolidays } from '@/hooks/use-holidays';
import { useViewStore } from '@/hooks/use-view-store';

export function CalendarView() {
  const {
    calendarYear,
    calendarMonth,
    setCalendarYear,
    setCalendarMonth,
    setSelectedDate,
    setCurrentView,
  } = useViewStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDateForForm, setSelectedDateForForm] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 获取月度任务
  const { data: monthlyData, isLoading: isTasksLoading } = useMonthlyTodos(
    calendarYear,
    calendarMonth
  );

  // 获取节假日
  const { data: holidayData, isLoading: isHolidaysLoading } = useHolidays(calendarYear);

  // 转换节假日数据
  const holidays = holidayData?.data.reduce(
    (acc, h) => {
      acc[h.date] = { name: h.name, isHoliday: h.isHoliday };
      return acc;
    },
    {} as Record<string, { name: string; isHoliday: boolean }>
  );

  const isLoading = isTasksLoading || isHolidaysLoading;

  // 切换月份
  const goToPreviousMonth = () => {
    if (calendarMonth === 1) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // 回到今天
  const goToToday = () => {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth() + 1);
  };

  // 点击日期 - 跳转到当日视图
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  // 点击任务 - 打开详情弹窗
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDetailOpen(true);
  };

  // 新建任务
  const handleCreateTask = (date?: string) => {
    setSelectedDateForForm(date || null);
    setIsFormOpen(true);
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* 标题和控制区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {calendarYear}年{calendarMonth}月
          </h1>
          <Button variant="outline" size="sm" onClick={goToToday}>
            回到今天
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleCreateTask()}>
            <Plus className="h-4 w-4 mr-2" />
            新建任务
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 日历主区域 */}
        <div className="lg:col-span-3">
          <CalendarGrid
            year={calendarYear}
            month={calendarMonth}
            tasks={monthlyData?.data.tasks || {}}
            holidays={holidays}
            isLoading={isLoading}
            onDateClick={handleDateClick}
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* 侧边统计 */}
        <div className="lg:col-span-1 space-y-4">
          {monthlyData?.data.stats ? (
            <MonthStats stats={monthlyData.data.stats} />
          ) : (
            <Skeleton className="h-40" />
          )}

          {/* 图例 */}
          <div className="bg-card rounded-lg border p-4">
            <h4 className="font-semibold mb-3">任务等级</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">高优先级</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">中优先级</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm">低优先级</span>
              </div>
            </div>
          </div>

          {/* 操作提示 */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>💡 点击日期可跳转到当日视图</p>
            <p className="mt-1">💡 点击任务可查看详情和编辑</p>
          </div>
        </div>
      </div>

      {/* 任务表单 */}
      <TaskForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDateForForm(null);
        }}
        defaultDate={selectedDateForForm || undefined}
      />

      {/* 任务详情弹窗 */}
      <TaskDetailDialog
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        onDeleted={() => {
          setIsDetailOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
