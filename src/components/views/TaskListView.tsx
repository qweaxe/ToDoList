'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useFilteredTodos, useToggleTodo } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';

export function TaskListView() {
  const { taskListFilter, setTaskListFilter, setCurrentView, setSelectedDate } = useViewStore();
  const [selectedYear, setSelectedYear] = useState(taskListFilter?.year || new Date().getFullYear());
  const toggleTodoMutation = useToggleTodo();

  const { data, isLoading } = useFilteredTodos(
    taskListFilter?.type || 'category',
    taskListFilter?.id || '',
    selectedYear
  );

  const handleBack = () => {
    setCurrentView('settings');
    setTaskListFilter(null);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const handleToggleTodo = (id: string) => {
    toggleTodoMutation.mutate(id);
  };

  const goToPreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const goToNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const goToThisYear = () => {
    setSelectedYear(new Date().getFullYear());
  };

  if (!taskListFilter) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            请从设置页面选择分类或等级查看任务明细
          </CardContent>
        </Card>
      </div>
    );
  }

  const todos = data?.data?.todos || [];
  const stats = data?.data?.stats || { total: 0, completed: 0, pending: 0, inProgress: 0 };

  // 按月份分组
  const todosByMonth: Record<number, typeof todos> = {};
  todos.forEach((todo) => {
    const month = new Date(todo.dueDate).getMonth() + 1;
    if (!todosByMonth[month]) {
      todosByMonth[month] = [];
    }
    todosByMonth[month].push(todo);
  });

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-4xl px-4 sm:px-6">
      {/* 标题和控制区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{taskListFilter.name}</h1>
            <p className="text-sm text-muted-foreground">
              {taskListFilter.type === 'category' ? '分类任务明细' : '等级任务明细'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToThisYear}>
            今年
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center font-medium">{selectedYear}</span>
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
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">总任务</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">已完成</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-gray-400" />
              <span className="text-xs sm:text-sm text-muted-foreground">待处理</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">完成率</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold mt-1">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 完成率进度条 */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">年度完成进度</span>
            <span className="text-sm text-muted-foreground">{stats.completed}/{stats.total}</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* 任务列表 */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : todos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>{selectedYear} 年暂无此{taskListFilter.type === 'category' ? '分类' : '等级'}的任务</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
          <div className="space-y-4">
            {Object.entries(todosByMonth)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([month, monthTodos]) => (
                <Card key={month}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{selectedYear}年{month}月</span>
                      <Badge variant="secondary">{monthTodos.length} 个任务</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="space-y-2">
                      {monthTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleDateClick(todo.dueDate)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTodo(todo.id);
                            }}
                            className="flex-shrink-0"
                          >
                            {todo.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium text-sm truncate",
                              todo.status === 'completed' && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{todo.dueDate}</span>
                              {todo.category && (
                                <Badge variant="outline" className="text-xs py-0 px-1">
                                  {todo.category.emoji && <span className="mr-1">{todo.category.emoji}</span>}
                                  {todo.category.name}
                                </Badge>
                              )}
                              {todo.level && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs py-0 px-1",
                                    todo.level.value === 3 && "border-red-300 text-red-600",
                                    todo.level.value === 2 && "border-yellow-300 text-yellow-600",
                                    todo.level.value === 1 && "border-gray-300 text-gray-600"
                                  )}
                                >
                                  {todo.level.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
