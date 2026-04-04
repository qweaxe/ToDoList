'use client';

import { useEffect, useCallback, useState } from 'react';
import { usePendingReminders, useMarkReminderSent } from '@/hooks/use-reminders';

interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

/**
 * 浏览器通知 Hook
 *
 * 管理通知权限和发送提醒通知
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: true,
  });

  const { data: pendingData } = usePendingReminders();
  const markSent = useMarkReminderSent();

  // 检查通知权限状态
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const updatePermission = () => {
      const perm = Notification.permission;
      setPermission({
        granted: perm === 'granted',
        denied: perm === 'denied',
        default: perm === 'default',
      });
    };

    updatePermission();
  }, []);

  // 请求通知权限
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission({
        granted: result === 'granted',
        denied: result === 'denied',
        default: result === 'default',
      });
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // 发送通知
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!permission.granted) {
        console.warn('Notification permission not granted');
        return null;
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        // 点击通知时聚焦窗口
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error('Failed to send notification:', error);
        return null;
      }
    },
    [permission.granted]
  );

  // 处理待发送的提醒
  useEffect(() => {
    if (!pendingData?.success || !pendingData.data.length || !permission.granted) {
      return;
    }

    const processReminders = async () => {
      for (const reminder of pendingData.data) {
        // 发送通知
        sendNotification(`任务提醒: ${reminder.todoTitle}`, {
          body: getReminderBody(reminder),
          tag: reminder.id, // 防止重复通知
          requireInteraction: false,
        });

        // 标记为已发送
        await markSent.mutateAsync(reminder.id);
      }
    };

    processReminders();
  }, [pendingData, permission.granted, sendNotification, markSent]);

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}

/**
 * 生成提醒通知正文
 */
function getReminderBody(reminder: {
  type: string;
  offset: number | null;
  remindAt: string;
}): string {
  if (reminder.type === 'custom') {
    return '任务即将开始';
  }

  if (reminder.offset === null || reminder.offset === 0) {
    return '任务即将到期';
  }

  if (reminder.offset < 60) {
    return `任务将在 ${reminder.offset} 分钟后到期`;
  }

  const hours = Math.floor(reminder.offset / 60);
  const mins = reminder.offset % 60;

  if (hours < 24) {
    return mins > 0
      ? `任务将在 ${hours} 小时 ${mins} 分钟后到期`
      : `任务将在 ${hours} 小时后到期`;
  }

  const days = Math.floor(hours / 24);
  return `任务将在 ${days} 天后到期`;
}

/**
 * 通知权限提示组件 Props
 */
export interface NotificationPromptProps {
  onAllow?: () => void;
  onDeny?: () => void;
}

/**
 * 检查是否应该显示权限提示
 */
export function shouldShowPermissionPrompt(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  return Notification.permission === 'default';
}
