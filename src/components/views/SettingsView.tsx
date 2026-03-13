'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { LevelManager } from '@/components/settings/LevelManager';
import { useViewStore } from '@/hooks/use-view-store';

export function SettingsView() {
  const t = useTranslations();
  const { settingsTab, setSettingsTab } = useViewStore();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as 'categories' | 'levels')}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">{t('settings.categories')}</TabsTrigger>
          <TabsTrigger value="levels">{t('settings.levels')}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="levels">
          <LevelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}