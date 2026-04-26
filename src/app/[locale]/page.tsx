'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/layout/MainLayout';
import { DayView } from '@/components/views/DayView';
import { CalendarView } from '@/components/views/CalendarView';
import { WeekView } from '@/components/views/WeekView';
import { QuarterlyView } from '@/components/views/QuarterlyView';
import { YearlyView } from '@/components/views/YearlyView';
import { SettingsView } from '@/components/views/SettingsView';
import { OverdueView } from '@/components/views/OverdueView';
import { TaskListView } from '@/components/views/TaskListView';
import { InboxView } from '@/components/inbox/InboxView';
import { TimeView } from '@/components/views/TimeView';
import { AuthPage } from '@/components/auth/AuthPage';
import { useViewStore } from '@/hooks/use-view-store';

export default function Home() {
  const t = useTranslations('common');
  const { data: session, status } = useSession();
  const { currentView } = useViewStore();
  // 等待 hydration 完成，避免 SSR 不匹配
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 初始化种子数据（仅在已登录时）
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/seed').catch(() => {});
    }
  }, [status]);

  // 加载状态
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  // 未登录状态 - 显示登录页面
  if (status === 'unauthenticated' || !session) {
    return <AuthPage />;
  }

  // 根据当前视图渲染不同内容
  const renderContent = () => {
    // hydration 完成前默认显示 DayView，避免 SSR 不匹配
    const view = isHydrated ? currentView : 'day';
    switch (view) {
      case 'day':
        return <DayView />;
      case 'calendar':
        return <CalendarView />;
      case 'week':
        return <WeekView />;
      case 'quarter':
        return <QuarterlyView />;
      case 'year':
        return <YearlyView />;
      case 'settings':
        return <SettingsView />;
      case 'overdue':
        return <OverdueView />;
      case 'task-list':
        return <TaskListView />;
      case 'inbox':
        return <InboxView />;
      case 'time':
        return <TimeView />;
      default:
        return <DayView />;
    }
  };

  return <MainLayout>{renderContent()}</MainLayout>;
}
