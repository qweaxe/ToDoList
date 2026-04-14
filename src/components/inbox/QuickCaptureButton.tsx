'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateInboxItem } from '@/hooks/use-inbox';
import { useViewStore } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';

/**
 * 全局悬浮捕获按钮
 * 极致低摩擦：点击 → 输入 → 回车完成
 */
export function QuickCaptureButton() {
  const t = useTranslations('inbox');
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { currentView } = useViewStore();
  const createMutation = useCreateInboxItem();

  // 等待 hydration 完成后再检查 currentView，避免 SSR 不匹配
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 打开时自动聚焦
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  // 全局快捷键 Cmd/Ctrl + Shift + I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 提交处理
  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;

    createMutation.mutate(trimmed, {
      onSuccess: () => {
        setContent('');
        // 显示成功反馈（轻微变色）
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 500);
        // 保持面板打开，方便连续记录
        textareaRef.current?.focus();
      },
    });
  }, [content, createMutation]);

  // 在 Inbox 页面内隐藏（hydration 完成后才判断，且必须在所有 hooks 之后）
  if (isHydrated && currentView === 'inbox') {
    return null;
  }

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={cn(
            'fixed bottom-6 right-6 md:bottom-8 md:right-8',
            'h-14 w-14 rounded-full shadow-lg',
            'z-40', // 低于侧边栏 z-index
            showSuccess && 'bg-green-500 hover:bg-green-600'
          )}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Inbox className="h-6 w-6" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-80 p-3"
      >
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('capturePlaceholder')}
            className="min-h-[60px] max-h-[120px] resize-none"
            rows={1}
          />
          <p className="text-xs text-muted-foreground">
            {t('captureHint')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
