'use client';

import { ChevronUp, Minus, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useLevels,
} from '@/hooks/use-levels';
import { useViewStore } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';

export function LevelManager() {
  const t = useTranslations();
  const { data, isLoading } = useLevels();
  const { setCurrentView, setTaskListFilter } = useViewStore();

  const levels = data?.data || [];

  // 固定的三个等级配置
  const FIXED_LEVELS = [
    { name: t('settings.levelHigh'), value: 3, icon: <ChevronUp className="h-4 w-4" />, color: 'bg-red-500 text-white', description: t('settings.highPriorityDesc') },
    { name: t('settings.levelMedium'), value: 2, icon: <Minus className="h-4 w-4" />, color: 'bg-yellow-500 text-white', description: t('settings.mediumPriorityDesc') },
    { name: t('settings.levelLow'), value: 1, icon: <ChevronDown className="h-4 w-4" />, color: 'bg-gray-400 text-white', description: t('settings.lowPriorityDesc') },
  ];

  // 合并固定等级和数据库中的使用统计
  const displayLevels = FIXED_LEVELS.map(fixed => {
    // Try to match by value instead of name for i18n compatibility
    const dbLevel = levels.find(l => l.value === fixed.value);
    return {
      ...fixed,
      id: dbLevel?.id || '',
      todoCount: dbLevel?.todoCount || 0,
    };
  });

  // 点击任务数量，跳转到任务列表视图
  const handleTodoCountClick = (level: { id: string; name: string }) => {
    const priorityKey = level.value === 3 ? 'levelHighPriority' : level.value === 2 ? 'levelMediumPriority' : 'levelLowPriority';
    setTaskListFilter({
      type: 'level',
      id: level.id,
      name: t(`settings.${priorityKey}`),
      year: new Date().getFullYear(),
    });
    setCurrentView('task-list');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('common.loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.levels')}</CardTitle>
        <CardDescription>
          {t('settings.levelsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayLevels.map((level) => (
            <div
              key={level.name}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
                    level.color
                  )}
                >
                  {level.icon}
                </div>
                <div>
                  <div className="font-medium text-lg">{level.name}{t('task.priority')}</div>
                  <div className="text-sm text-muted-foreground">
                    {level.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleTodoCountClick(level)}
                >
                  {t('settings.taskCount', { count: level.todoCount })}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {t('settings.levelValue')}: {level.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">{t('settings.levelExplanation')}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <span className="text-red-500 font-medium">{t('view.highPriority')}</span>：{t('settings.highPriorityDesc')}</li>
            <li>• <span className="text-yellow-500 font-medium">{t('view.mediumPriority')}</span>：{t('settings.mediumPriorityDesc')}</li>
            <li>• <span className="text-gray-400 font-medium">{t('view.lowPriority')}</span>：{t('settings.lowPriorityDesc')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
