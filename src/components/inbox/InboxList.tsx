'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { Trash2, ArrowRight, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  useInboxItems,
  useUpdateInboxItem,
  useDeleteInboxItem,
  type InboxItem,
} from '@/hooks/use-inbox';
import { ConvertToTodoDialog } from './ConvertToTodoDialog';

interface InboxListProps {
  onConvert?: (item: InboxItem) => void;
}

// 客户端渲染的相对时间组件，避免 hydration mismatch
function RelativeTime({ date }: { date: string }) {
  const [relativeTime, setRelativeTime] = useState('');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;

  useEffect(() => {
    setRelativeTime(
      formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: dateLocale,
      })
    );
  }, [date, dateLocale]);

  return <span>{relativeTime}</span>;
}

export function InboxList({ onConvert }: InboxListProps) {
  const t = useTranslations('inbox');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;

  const { data, isLoading } = useInboxItems();
  const updateMutation = useUpdateInboxItem();
  const deleteMutation = useDeleteInboxItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [convertingItem, setConvertingItem] = useState<InboxItem | null>(null);

  const items = data?.data ?? [];

  // 开始编辑
  const startEdit = (item: InboxItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingId && editContent.trim()) {
      updateMutation.mutate(
        { id: editingId, content: editContent.trim() },
        { onSuccess: () => setEditingId(null) }
      );
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 删除
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // 转化为任务
  const handleConvert = (item: InboxItem) => {
    setConvertingItem(item);
    onConvert?.(item);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('emptyState')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* 内容区域 */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed break-words">
                        {item.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <RelativeTime date={item.createdAt} />
                      </p>
                    </>
                  )}
                </div>

                {/* 操作按钮 */}
                {editingId !== item.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleConvert(item)}
                      title={t('convertToTodo')}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(item)}
                      title={t('editContent')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      title={t('deleteItem')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 转化对话框 */}
      <ConvertToTodoDialog
        item={convertingItem}
        open={!!convertingItem}
        onClose={() => setConvertingItem(null)}
      />
    </>
  );
}
