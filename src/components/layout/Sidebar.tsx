'use client';

import {
  Calendar,
  Home,
  LayoutGrid,
  List,
  Settings,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useViewStore, ViewType } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';
import { getTodayString } from '@/lib/date-utils';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'day',
    label: '今日',
    icon: <List className="h-5 w-5" />,
    description: '查看今日任务',
  },
  {
    id: 'calendar',
    label: '日历',
    icon: <Calendar className="h-5 w-5" />,
    description: '月度日历视图',
  },
  {
    id: 'week',
    label: '周视图',
    icon: <LayoutGrid className="h-5 w-5" />,
    description: '周看板视图',
  },
  {
    id: 'quarter',
    label: '季度',
    icon: <Target className="h-5 w-5" />,
    description: '季度里程碑',
  },
  {
    id: 'year',
    label: '年度',
    icon: <TrendingUp className="h-5 w-5" />,
    description: '年度热力图',
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen, setSelectedDate } = useViewStore();

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
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-300 ease-in-out',
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
              回到今天
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
                    currentView === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {item.icon}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={cn(
                        'text-xs',
                        currentView === item.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.description}
                    </span>
                  </div>
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
                currentView === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">设置</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
