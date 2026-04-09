'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';

/**
 * 通知权限提示组件
 *
 * 在页面底部显示，引导用户开启通知权限
 */
export function NotificationPermissionPrompt() {
  const { permission, requestPermission, isSupported } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  // 从 localStorage 恢复 dismissed 状态
  useEffect(() => {
    const stored = localStorage.getItem('notification-prompt-dismissed');
    if (stored === 'true') {
      setDismissed(true);
    }
  }, []);

  // 不支持通知、已授权、已拒绝、或已关闭时不显示
  if (!isSupported || permission.granted || permission.denied || dismissed) {
    return null;
  }

  const handleAllow = async () => {
    const granted = await requestPermission();
    if (granted) {
      localStorage.setItem('notification-prompt-dismissed', 'true');
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
      >
        <div className="bg-card border rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">开启任务提醒</h3>
              <p className="text-xs text-muted-foreground mt-1">
                允许发送通知，在任务到期前收到提醒
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={handleAllow}>
                  开启通知
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  暂不开启
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
