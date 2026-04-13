'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Settings2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { LevelManager } from '@/components/settings/LevelManager';
import { ChangePassword } from '@/components/settings/ChangePassword';
import { SecurityQuestionSetting } from '@/components/settings/SecurityQuestionSetting';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { HolidayManager } from '@/components/settings/HolidayManager';
import { CacheManager } from '@/components/settings/CacheManager';
import { SystemInfo } from '@/components/settings/SystemInfo';
import { useViewStore } from '@/hooks/use-view-store';

export function SettingsView() {
  const t = useTranslations('settings');
  const { settingsTab, setSettingsTab } = useViewStore();

  // 检查是否为管理员
  const { data: adminCheck, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const res = await fetch('/api/admin/check');
      if (!res.ok) throw new Error('Failed to check admin');
      const json = await res.json();
      return json as { success: boolean; isAdmin: boolean };
    },
  });

  const isAdmin = adminCheck?.isAdmin ?? false;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as 'categories' | 'levels' | 'account' | 'api' | 'admin')}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">{t('categories')}</TabsTrigger>
          <TabsTrigger value="levels">{t('levels')}</TabsTrigger>
          <TabsTrigger value="account">{t('account')}</TabsTrigger>
          <TabsTrigger value="api">{t('apiKeys')}</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="gap-1">
              <Settings2 className="h-4 w-4" />
              {t('admin')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="levels">
          <LevelManager />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <SecurityQuestionSetting />
          <ChangePassword />
        </TabsContent>

        <TabsContent value="api">
          <ApiKeyManager />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <SystemInfo />
            <HolidayManager />
            <CacheManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
