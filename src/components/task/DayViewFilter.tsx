'use client';

import { useTranslations } from 'next-intl';
import { X, Filter, Square, ArrowRightLeft, ListChecks, RefreshCw, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskType } from '@/types/index';
import type { FilterState } from '@/hooks/use-task-type';

interface DayViewFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: Array<{ id: string; name: string; emoji?: string | null }>;
  levels: Array<{ id: string; name: string; value: number }>;
}

const TASK_TYPE_CONFIG: Array<{ type: TaskType; icon: typeof Square; colorClass: string }> = [
  { type: 'basic', icon: Square, colorClass: 'text-blue-600' },
  { type: 'cross_day', icon: ArrowRightLeft, colorClass: 'text-orange-600' },
  { type: 'multi_step', icon: ListChecks, colorClass: 'text-purple-600' },
  { type: 'cycle', icon: RefreshCw, colorClass: 'text-green-600' },
  { type: 'milestone', icon: Flag, colorClass: 'text-red-600' },
];

export function DayViewFilter({ filters, onFiltersChange, categories, levels }: DayViewFilterProps) {
  const t = useTranslations('dayFilter');

  const hasActiveFilters = filters.taskTypes.length > 0 || filters.categoryId || filters.levelId;

  const toggleTaskType = (type: TaskType) => {
    const current = filters.taskTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, taskTypes: next });
  };

  const clearAll = () => {
    onFiltersChange({ taskTypes: [], categoryId: null, levelId: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      {/* 任务类型按钮组 */}
      <div className="flex items-center gap-1">
        {TASK_TYPE_CONFIG.map(({ type, icon: Icon, colorClass }) => {
          const isActive = filters.taskTypes.includes(type);
          return (
            <Button
              key={type}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleTaskType(type)}
              className={cn(
                'h-7 text-xs gap-1',
                !isActive && colorClass
              )}
            >
              <Icon className="h-3 w-3" />
              {t(`type_${type}`)}
            </Button>
          );
        })}
      </div>

      {/* 分类筛选 */}
      <Select
        value={filters.categoryId || '__all__'}
        onValueChange={(v) => {
          onFiltersChange({ ...filters, categoryId: v === '__all__' ? null : v });
        }}
      >
        <SelectTrigger className="w-[130px] h-7 text-xs">
          <SelectValue placeholder={t('allCategories')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('allCategories')}</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.emoji ? `${cat.emoji} ` : ''}{cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 等级筛选 */}
      <Select
        value={filters.levelId || '__all__'}
        onValueChange={(v) => {
          onFiltersChange({ ...filters, levelId: v === '__all__' ? null : v });
        }}
      >
        <SelectTrigger className="w-[100px] h-7 text-xs">
          <SelectValue placeholder={t('allLevels')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('allLevels')}</SelectItem>
          {levels.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 清除筛选 */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          {t('clearFilter')}
        </Button>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';