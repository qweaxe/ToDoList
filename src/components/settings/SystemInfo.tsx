'use client';

import { useTranslations } from 'next-intl';
import { Info, GitBranch, Clock, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SystemInfo() {
  const t = useTranslations('admin.system');

  // 构建时间（从环境变量获取）
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const version = process.env.NEXT_PUBLIC_VERSION || '1.0.0';
  const environment = process.env.NODE_ENV || 'production';

  const infoItems = [
    {
      icon: GitBranch,
      label: t('version'),
      value: version,
    },
    {
      icon: Server,
      label: t('environment'),
      value: environment,
    },
    {
      icon: Clock,
      label: t('buildTime'),
      value: new Date(buildTime).toLocaleString(),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.label}:</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
