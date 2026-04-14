'use client';

import { useTranslations } from 'next-intl';
import { Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { InboxList } from './InboxList';
import { useInboxCount } from '@/hooks/use-inbox';

export function InboxView() {
  const t = useTranslations('inbox');
  const { data: countData } = useInboxCount();

  const count = countData?.data.count ?? 0;

  return (
    <div className="container mx-auto py-4 sm:py-6 max-w-4xl px-4 sm:px-6">
      {/* 标题栏 */}
      <div className="flex items-center gap-3 mb-6">
        <Inbox className="h-5 w-5" />
        <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
        {count > 0 && (
          <Badge variant="secondary">{t('itemCount', { count })}</Badge>
        )}
      </div>

      {/* 提示信息 */}
      <Card className="mb-6 border-dashed">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </CardContent>
      </Card>

      {/* 列表 */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <InboxList />
      </ScrollArea>
    </div>
  );
}
