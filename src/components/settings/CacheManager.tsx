'use client';

import { useTranslations } from 'next-intl';
import { Trash2, Loader2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export function CacheManager() {
  const t = useTranslations('admin.cache');

  const handleClearCache = () => {
    try {
      // 清理 localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('todo-list-') ||
          key.startsWith('tanstack-query-')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      toast({
        title: t('clearSuccess'),
        description: t('clearSuccessDesc', { count: keysToRemove.length }),
      });

      // 刷新页面以重置 React Query 缓存
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      toast({ title: t('clearError'), variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t('localStorage')}</p>
            <p className="text-sm text-muted-foreground">{t('localStorageDesc')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('clear')}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
          {t('note')}
        </div>
      </CardContent>
    </Card>
  );
}
