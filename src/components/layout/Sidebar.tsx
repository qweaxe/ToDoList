'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  Home,
  Inbox,
  LayoutGrid,
  List,
  Settings,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useViewStore, ViewType } from '@/hooks/use-view-store';
import { useInboxCount } from '@/hooks/use-inbox';
import { cn } from '@/lib/utils';
import { getTodayString } from '@/lib/date-utils';

interface NavItem {
  id: ViewType;
  labelKey: string;
  icon: React.ReactNode;
  descKey: string;
}

const navItems: NavItem[] = [
  {
    id: 'day',
    labelKey: 'nav.today',
    icon: <List className="h-5 w-5" />,
    descKey: 'view.dayView',
  },
  {
    id: 'calendar',
    labelKey: 'nav.calendar',
    icon: <Calendar className="h-5 w-5" />,
    descKey: 'view.monthView',
  },
  {
    id: 'week',
    labelKey: 'nav.week',
    icon: <LayoutGrid className="h-5 w-5" />,
    descKey: 'view.weekView',
  },
  {
    id: 'quarter',
    labelKey: 'nav.quarter',
    icon: <Target className="h-5 w-5" />,
    descKey: 'view.quarterView',
  },
  {
    id: 'year',
    labelKey: 'nav.year',
    icon: <TrendingUp className="h-5 w-5" />,
    descKey: 'view.yearView',
  },
  {
    id: 'inbox',
    labelKey: 'inbox.nav',
    icon: <Inbox className="h-5 w-5" />,
    descKey: 'inbox.description',
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations();
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen, setSelectedDate } = useViewStore();
  // 始终请求计数以显示徽章，避免导航时 enabled 变化导致的 React error #310
  const { data: inboxCountData } = useInboxCount();
  // 等待 hydration 完成，避免 SSR 不匹配
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const inboxCount = inboxCountData?.data?.count ?? 0;

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    if (view === 'day') {
      setSelectedDate(getTodayString());
    }
    setSidebarOpen(false);
  };

  const handleGoToToday = () => {
    setCurrentView('day');
    setSelectedDate(getTodayString());
    setSidebarOpen(false);
  };

  return (
    <>
      {/* 遮罩层 - 移动端侧边栏打开时覆盖Header */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 - z-index高于Header确保完整显示 */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-[60] md:z-auto h-full w-64 bg-background border-r transform transition-transform duration-300 ease-in-out md:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo 区域 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">To Do List</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 快捷按钮 */}
          <div className="p-4 border-b">
            <Button
              className="w-full justify-start gap-2"
              onClick={handleGoToToday}
            >
              <Home className="h-4 w-4" />
              {t('nav.backToToday')}
            </Button>
          </div>

          {/* 导航菜单 */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    (isHydrated && currentView === item.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {item.icon}
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{t(item.labelKey)}</span>
                    <span
                      className={cn(
                        'text-xs',
                        (isHydrated && currentView === item.id)
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {t(item.descKey)}
                    </span>
                  </div>
                  {item.id === 'inbox' && inboxCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {inboxCount}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </ScrollArea>

          {/* 底部设置 */}
          <div className="p-4 border-t">
            <button
              onClick={() => handleNavClick('settings')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                (isHydrated && currentView === 'settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">{t('nav.settings')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
