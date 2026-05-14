'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PictureInPicture2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useDailyTodos } from '@/hooks/use-todos';
import { useViewStore } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';
import { PiPManager, getPipManager } from './PiPManager';
import { todoToPipTask } from './broadcast-sync';
import { FloatingPanel } from './FloatingPanel';

// 悬浮待办按钮 - 触发 PiP 窗口或回退浮动面板
export function FloatTodoButton() {
  const t = useTranslations('pip');
  const queryClient = useQueryClient();
  const { selectedDate, pipWindowOpen, floatingPanelOpen, setPipWindowOpen, setFloatingPanelOpen } = useViewStore();

  const { data: dailyData } = useDailyTodos(selectedDate);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 检测 PiP API 支持（hydration 后）
  useEffect(() => {
    setIsHydrated(true);
    setIsPipSupported(PiPManager.isSupported());
  }, []);

  // 打开 PiP 窗口
  const handleOpenPip = useCallback(async () => {
    if (!isPipSupported) {
      // 非 Chrome 浏览器：切换浮动面板
      setFloatingPanelOpen(!floatingPanelOpen);
      return;
    }

    // Chrome 116+：打开/关闭 PiP 窗口
    if (pipWindowOpen) {
      getPipManager().closePipWindow();
      setPipWindowOpen(false);
      return;
    }

    // 准备初始数据
    const tasks = dailyData?.data?.today?.pending
      ? [
          ...dailyData.data.today.pending.map(todoToPipTask),
          ...dailyData.data.today.completed.map(todoToPipTask),
        ]
      : [];

    const manager = getPipManager();
    const success = await manager.openPipWindow(
      queryClient,
      tasks,
      selectedDate,
      () => setPipWindowOpen(false) // PiP 关闭回调
    );

    if (success) {
      setPipWindowOpen(true);
    }
  }, [isPipSupported, pipWindowOpen, floatingPanelOpen, dailyData, selectedDate, queryClient, setPipWindowOpen, setFloatingPanelOpen]);

  // 当主窗口数据变化时，向 PiP 窗口推送更新
  useEffect(() => {
    if (!pipWindowOpen || !isPipSupported) return;
    const manager = getPipManager();
    if (!manager.isOpen()) return;

    const tasks = dailyData?.data?.today?.pending
      ? [
          ...dailyData.data.today.pending.map(todoToPipTask),
          ...dailyData.data.today.completed.map(todoToPipTask),
        ]
      : [];

    manager.sendDataRefresh(tasks);
  }, [dailyData, pipWindowOpen, isPipSupported]);

  // 主窗口刷新时确保 PiP 状态同步
  useEffect(() => {
    const manager = getPipManager();
    if (pipWindowOpen && !manager.isOpen()) {
      setPipWindowOpen(false);
    }
  }, [pipWindowOpen, setPipWindowOpen]);

  // hydration 未完成时不渲染
  if (!isHydrated) return null;

  return (
    <>
      {/* 悬浮按钮 */}
      <Button
        variant={pipWindowOpen || floatingPanelOpen ? 'destructive' : 'default'}
        size="icon"
        className={cn(
          'fixed bottom-6 left-6 md:bottom-8 md:left-8',
          'h-14 w-14 rounded-full shadow-lg',
          'z-40',
          'transition-colors',
        )}
        onClick={handleOpenPip}
        title={isPipSupported
          ? pipWindowOpen ? t('closePip') : t('openPip')
          : floatingPanelOpen ? t('closePanel') : t('openPanel')
        }
      >
        {pipWindowOpen || floatingPanelOpen
          ? <X className="h-6 w-6" />
          : <PictureInPicture2 className="h-6 w-6" />
        }
      </Button>

      {/* 非 Chrome 浏览器的回退浮动面板 */}
      {!isPipSupported && floatingPanelOpen && <FloatingPanel />}
    </>
  );
}