'use client';

import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';

interface MonthStatsProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
}

export function MonthStats({ stats }: MonthStatsProps) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">本月统计</h3>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">完成率</span>
          <span className="font-medium">{stats.completionRate}%</span>
        </div>
        <Progress
          value={stats.completionRate}
          className="h-2"
        />
      </div>

      {/* 统计数字 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Circle className="h-3.5 w-3.5" />
            <span className="text-xs">总任务</span>
          </div>
          <div className="text-xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-green-500/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs">已完成</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {stats.completed}
          </div>
        </div>

        <div className="bg-yellow-500/10 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">待完成</span>
          </div>
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
        </div>
      </div>
    </div>
  );
}
