'use client';

import { useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';

interface MonthStatsProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  onStatClick?: (type: 'total' | 'completed' | 'pending') => void;
}

export function MonthStats({ stats, onStatClick }: MonthStatsProps) {
  const t = useTranslations('monthStats');

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t('title')}</h3>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{t('completionRate')}</span>
          <span className="font-medium">{stats.completionRate}%</span>
        </div>
        <Progress
          value={stats.completionRate}
          className="h-2"
        />
      </div>

      {/* Stats numbers */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div
          className={`bg-muted/30 rounded-lg p-3 ${onStatClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
          onClick={() => onStatClick?.('total')}
        >
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Circle className="h-3.5 w-3.5" />
            <span className="text-xs">{t('totalTasks')}</span>
          </div>
          <div className="text-xl font-bold">{stats.total}</div>
        </div>

        <div
          className={`bg-green-500/10 rounded-lg p-3 ${onStatClick ? 'cursor-pointer hover:bg-green-500/20 transition-colors' : ''}`}
          onClick={() => onStatClick?.('completed')}
        >
          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs">{t('completed')}</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {stats.completed}
          </div>
        </div>

        <div
          className={`bg-yellow-500/10 rounded-lg p-3 ${onStatClick ? 'cursor-pointer hover:bg-yellow-500/20 transition-colors' : ''}`}
          onClick={() => onStatClick?.('pending')}
        >
          <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{t('pending')}</span>
          </div>
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
        </div>
      </div>
    </div>
  );
}
