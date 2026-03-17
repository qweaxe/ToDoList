'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmojiPicker } from '@/components/common/EmojiPicker';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import { useViewStore } from '@/hooks/use-view-store';

interface CategoryFormData {
  name: string;
  description: string;
  emoji: string;
  color: string;
}

export function CategoryManager() {
  const t = useTranslations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    emoji: '',
    color: '',
  });

  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const { setCurrentView, setTaskListFilter } = useViewStore();

  const categories = data?.data || [];

  // 点击任务数量，跳转到任务列表视图
  const handleTodoCountClick = (category: { id: string; name: string }) => {
    setTaskListFilter({
      type: 'category',
      id: category.id,
      name: category.name,
      year: new Date().getFullYear(),
    });
    setCurrentView('task-list');
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', emoji: '', color: '' });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (category: { id: string; name: string; description: string | null; emoji: string | null; color: string | null }) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      emoji: category.emoji || '',
      color: category.color || '',
    });
    setEditingId(category.id);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      updateMutation.mutate(
        {
          id: editingId,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            emoji: formData.emoji || undefined,
            color: formData.color || undefined,
          },
        },
        {
          onSuccess: () => {
            setEditingId(null);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          name: formData.name,
          description: formData.description || undefined,
          emoji: formData.emoji || undefined,
          color: formData.color || undefined,
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            resetForm();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('settings.categories')}</CardTitle>
            <CardDescription>{t('settings.categoriesDesc')}</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.newCategory')}
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.noCategories')}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {category.emoji ? (
                          category.emoji.startsWith('data:') ? (
                            <img src={category.emoji} alt="icon" className="w-6 h-6" />
                          ) : (
                            category.emoji
                          )
                        ) : (
                          '📁'
                        )}
                      </span>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => handleTodoCountClick(category)}
                      >
                        {t('settings.taskCount', { count: category.todoCount })}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(category.id)}
                        disabled={category.todoCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.newCategory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.categoryName')}</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t('settings.categoryNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.categoryIcon')}</Label>
              <EmojiPicker
                value={formData.emoji}
                onChange={(emoji) => setFormData({ ...formData, emoji })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.categoryDesc')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t('settings.categoryDescPlaceholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.editCategory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.categoryName')}</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t('settings.categoryNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.categoryIcon')}</Label>
              <EmojiPicker
                value={formData.emoji}
                onChange={(emoji) => setFormData({ ...formData, emoji })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.categoryDesc')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t('settings.categoryDescPlaceholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteDesc', { item: t('settings.categories') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
