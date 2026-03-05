'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DayView } from '@/components/views/DayView';
import { CalendarView } from '@/components/views/CalendarView';
import { WeekView } from '@/components/views/WeekView';
import { QuarterlyView } from '@/components/views/QuarterlyView';
import { YearlyView } from '@/components/views/YearlyView';
import { SettingsView } from '@/components/views/SettingsView';
import { OverdueView } from '@/components/views/OverdueView';
import { TaskListView } from '@/components/views/TaskListView';
import { useViewStore } from '@/hooks/use-view-store';

export default function Home() {
  const { currentView } = useViewStore();
  const [seeded, setSeeded] = useState(false);

  // 初始化种子数据
  useEffect(() => {
    const seedData = async () => {
      try {
        const res = await fetch('/api/seed');
        const data = await res.json();
        if (data.success) {
          setSeeded(true);
        }
      } catch (error) {
        console.error('Failed to seed data:', error);
      }
    };

    seedData();
  }, []);

  // 根据当前视图渲染不同内容
  const renderContent = () => {
    switch (currentView) {
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
      default:
        return <DayView />;
    }
  };

  return <MainLayout>{renderContent()}</MainLayout>;
}