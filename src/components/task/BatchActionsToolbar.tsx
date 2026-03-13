'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  X,
  Trash2,
  Check,
  FolderInput,
  Flag,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { useBatchDeleteTodos, useBatchUpdateTodos } from '@/hooks/use-todos';

interface BatchActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  selectedIds: string[];
  allIds: string[];
  isAllSelected: boolean;
  isPartialSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExit: () => void;
  onComplete?: () => void;
}

export function BatchActionsToolbar({
  selectedCount,
  totalCount,
  selectedIds,
  allIds,
  isAllSelected,
  isPartialSelected,
  onSelectAll,
  onDeselectAll,
  onExit,
  onComplete,
}: BatchActionsToolbarProps) {
  const t = useTranslations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>('');
  const [levelValue, setLevelValue] = useState<string>('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  const { data: categoriesData } = useCategories();
  const { data: levelsData } = useLevels();
  const batchDeleteMutation = useBatchDeleteTodos();
  const batchUpdateMutation = useBatchUpdateTodos();

  const categories = categoriesData?.data || [];
  const levels = levelsData?.data || [];

  const isProcessing = batchDeleteMutation.isPending || batchUpdateMutation.isPending;

  // 批量删除
  const handleBatchDelete = () => {
    batchDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onExit();
        onComplete?.();
      },
    });
  };

  // 批量标记完成
  const handleBatchComplete = () => {
    batchUpdateMutation.mutate(
      {
        ids: selectedIds,
        data: { status: 'completed', completedAt: format(new Date(), 'yyyy-MM-dd') },
      },
      {
        onSuccess: () => {
          onExit();
          onComplete?.();
        },
      }
    );
  };

  // 批量修改分类
  const handleBatchCategory = (categoryId: string) => {
    if (!categoryId) return;
    batchUpdateMutation.mutate(
      {
        ids: selectedIds,
        data: { categoryId: categoryId === 'none' ? null : categoryId },
      },
      {
        onSuccess: () => {
          setCategoryValue('');
          onExit();
          onComplete?.();
        },
      }
    );
  };

  // 批量修改等级
  const handleBatchLevel = (levelId: string) => {
    if (!levelId) return;
    batchUpdateMutation.mutate(
      {
        ids: selectedIds,
        data: { levelId: levelId === 'none' ? null : levelId },
      },
      {
        onSuccess: () => {
          setLevelValue('');
          onExit();
          onComplete?.();
        },
      }
    );
  };

  // 批量修改日期
  const handleBatchDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    batchUpdateMutation.mutate(
      {
        ids: selectedIds,
        data: { startDate: dateStr, dueDate: dateStr },
      },
      {
        onSuccess: () => {
          setTargetDate(undefined);
          onExit();
          onComplete?.();
        },
      }
    );
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* 左侧：选择状态 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('common.cancel')}
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {t('common.selected')} {selectedCount} {t('common.items')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className="text-xs"
              >
                {isAllSelected ? t('common.deselectAll') : t('common.selectAll')}
              </Button>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 标记完成 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchComplete}
                disabled={isProcessing || selectedCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('batch.completeSelected')}
              </Button>

              {/* 修改分类 */}
              <Select
                value={categoryValue}
                onValueChange={(v) => {
                  setCategoryValue(v);
                  handleBatchCategory(v);
                }}
                disabled={isProcessing || selectedCount === 0}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <FolderInput className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder={t('task.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('task.noCategory')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 修改等级 */}
              <Select
                value={levelValue}
                onValueChange={(v) => {
                  setLevelValue(v);
                  handleBatchLevel(v);
                }}
                disabled={isProcessing || selectedCount === 0}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder={t('task.priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('task.noLevel')}</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 修改日期 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing || selectedCount === 0}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    {t('batch.moveTo')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={targetDate}
                    onSelect={(date) => handleBatchDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* 删除 */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing || selectedCount === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('batch.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('batch.confirmDeleteDesc', { count: selectedCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? t('batch.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}