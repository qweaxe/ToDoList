'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Link2, Unlink } from 'lucide-react';

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
  categoryDistribution,
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

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('time.totalDuration')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {formatDuration(totalDuration)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('time.taskTime')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                {formatDuration(taskTime)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Unlink className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('time.otherTime')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-500">
                {formatDuration(otherTime)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分类分布 */}
      {categoryDistribution.length > 0 && totalDuration > 0 && (
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-medium">{t('time.categoryDistribution')}</h3>
            </div>
            <div className="space-y-2">
              {categoryDistribution.map((cat) => (
                <div key={cat.categoryId || 'none'} className="flex items-center gap-2">
                  <div className="w-8 text-center">
                    {cat.categoryEmoji ? (
                      <span className="text-lg">{cat.categoryEmoji}</span>
                    ) : (
                      <span className="text-sm">📊</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{cat.categoryName}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(cat.duration)} ({calculatePercentage(cat.duration, totalDuration)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${calculatePercentage(cat.duration, totalDuration)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}