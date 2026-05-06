'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { zhCN, enUS } from 'date-fns/locale';
import { format } from 'date-fns';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, ChevronLeft, ChevronRight, Home, Menu, Settings, LogOut, User } from 'lucide-react';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useViewStore, ViewType } from '@/hooks/use-view-store';
import { formatDateDisplay, getTodayString } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;
  const { data: session } = useSession();
  const {
    currentView,
    setCurrentView,
    selectedDate,
    calendarYear,
    calendarMonth,
    goToToday,
    goToPreviousMonth,
    goToNextMonth,
    toggleSidebar,
  } = useViewStore();

  // 等待 hydration 完成，避免 SSR 不匹配
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const viewLabels: Record<ViewType, string> = {
    day: t('nav.today'),
    calendar: t('nav.calendar'),
    week: t('nav.week'),
    quarter: t('nav.quarter'),
    year: t('nav.year'),
    settings: t('nav.settings'),
    'task-list': t('nav.taskList'),
    overdue: t('task.overdue'),
  };

  const isToday = selectedDate === getTodayString();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {/* 左侧：菜单按钮（移动端） */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* 移动端显示Logo，桌面端隐藏（Sidebar已有） */}
          <div className="flex items-center gap-2 md:hidden">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">To Do List</span>
          </div>
        </div>

        {/* 中间：视图切换和日期导航 */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {/* 视图切换标签 */}
          <nav className="hidden md:flex items-center gap-1">
            {(['day', 'calendar', 'week', 'quarter', 'year'] as ViewType[]).map((view) => (
              <Button
                key={view}
                variant={(isHydrated && currentView === view) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView(view)}
                className={cn(
                  'text-sm',
                  (isHydrated && currentView === view) && 'shadow-sm'
                )}
              >
                {viewLabels[view]}
              </Button>
            ))}
          </nav>

          {/* 日期导航（仅日历视图显示，移动端隐藏） */}
          {(isHydrated && currentView === 'calendar') && (
            <div className="hidden md:flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center font-medium">
                {format(new Date(calendarYear, calendarMonth - 1), 'MMMM yyyy', { locale: dateFnsLocale })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 当前日期显示（当日视图） */}
          {(isHydrated && currentView === 'day') && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-medium">
                {formatDateDisplay(selectedDate, undefined, dateFnsLocale)}
              </span>
              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs"
                >
                  <Home className="h-3 w-3 mr-1" />
                  {t('nav.backToToday')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 右侧：语言切换、用户信息和设置按钮 */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {/* 用户信息 */}
          {session?.user && (
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{session.user.name || session.user.username}</span>
            </div>
          )}

          <Button
            variant={(isHydrated && currentView === 'settings') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setCurrentView('settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* 登出按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title={t('auth.signOut')}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 移动端视图切换 */}
      <div className="md:hidden flex items-center justify-around border-t px-2 py-1">
        {(['day', 'calendar', 'week', 'quarter', 'year'] as ViewType[]).map((view) => (
          <Button
            key={view}
            variant={(isHydrated && currentView === view) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView(view)}
            className="text-xs px-2"
          >
            {viewLabels[view]}
          </Button>
        ))}
      </div>
    </header>
  );
}
