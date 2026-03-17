'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { LevelManager } from '@/components/settings/LevelManager';
import { useViewStore } from '@/hooks/use-view-store';

export function SettingsView() {
  const { settingsTab, setSettingsTab } = useViewStore();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as 'categories' | 'levels')}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">任务分类</TabsTrigger>
          <TabsTrigger value="levels">任务等级</TabsTrigger>
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
