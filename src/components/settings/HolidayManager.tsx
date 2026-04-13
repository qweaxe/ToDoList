'use client';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Download, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface HolidayStats {
  yearStats: Record<number, number>;
  currentYear: number;
  nextYear: number;
  hasCurrentYear: boolean;
  hasNextYear: boolean;
}

export function HolidayManager() {
  const t = useTranslations('admin.holidays');
  const queryClient = useQueryClient();

  // 获取节假日缓存状态
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'holidays'],
    queryFn: async () => {
      const res = await fetch('/api/admin/holidays');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as HolidayStats;
    },
  });

  // 刷新指定年份
  const refreshMutation = useMutation({
    mutationFn: async (year: number) => {
      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh', year }),
      });
      if (!res.ok) throw new Error('Failed to refresh');
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: t('refreshSuccess'),
        description: t('refreshSuccessDesc', { count: result.data.count, source: result.data.source }),
      });
      refetch();
    },
    onError: () => {
      toast({ title: t('refreshError'), variant: 'destructive' });
    },
  });

  // 预加载下一年
  const preloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preload' }),
      });
      if (!res.ok) throw new Error('Failed to preload');
      return res.json();
    },
    onSuccess: (result) => {
      if (result.data.loaded) {
        toast({
          title: t('preloadSuccess'),
          description: t('preloadSuccessDesc', { year: result.data.year }),
        });
      } else if (result.data.checked) {
        toast({
          title: t('preloadSkipped'),
          description: t('preloadSkippedDesc'),
        });
      } else {
        toast({
          title: t('preloadNotTime'),
          description: t('preloadNotTimeDesc'),
        });
      }
      refetch();
    },
    onError: () => {
      toast({ title: t('preloadError'), variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const yearEntries = data ? Object.entries(data.yearStats).sort((a, b) => Number(b[0]) - Number(a[0])) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 缓存状态 */}
        <div className="space-y-2">
          <h4 className="font-medium">{t('cacheStatus')}</h4>
          {yearEntries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {yearEntries.map(([year, count]) => (
                <div
                  key={year}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span className="font-medium">{year}</span>
                  <span className="text-muted-foreground">{count} {t('entries')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('noCache')}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2 pt-2">
          {data && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate(data.currentYear)}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('refreshCurrent', { year: data.currentYear })}
            </Button>
          )}

          {data && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate(data.nextYear)}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('refreshNext', { year: data.nextYear })}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => preloadMutation.mutate()}
            disabled={preloadMutation.isPending}
          >
            {preloadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t('preloadNext')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
