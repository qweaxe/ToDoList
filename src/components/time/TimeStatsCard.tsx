'use client';

import { useTranslations } from 'next-intl';
import { Clock, Link2 } from 'lucide-react';

interface TimeStatsCardProps {
  totalDuration: number;
  taskTime: number;
  otherTime: number;
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    categoryEmoji: string;
    categoryColor: string;
    duration: number;
  }>;
}

export function TimeStatsCard({
  totalDuration,
  taskTime,
  otherTime,
  // categoryDistribution 暂不显示，保留参数以兼容 API
}: TimeStatsCardProps) {
  const t = useTranslations();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (mins > 0) {
      return `${mins}m`;
    } else {
      return '0m';
    }
  };

  // 简洁统计条 - 单行显示
  return (
    <div className="flex items-center justify-center gap-6 py-4 text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        <span className="text-sm">{t('time.totalDuration')}</span>
        <span className="text-lg font-semibold text-foreground">{formatDuration(totalDuration)}</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <Link2 className="h-4 w-4 text-blue-500" />
        <span className="text-sm">{t('time.taskTime')}</span>
        <span className="text-lg font-semibold text-blue-500">{formatDuration(taskTime)}</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{t('time.otherTime')}</span>
        <span className="text-lg font-semibold">{formatDuration(otherTime)}</span>
      </div>
    </div>
  );
}