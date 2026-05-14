'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SecurityBanner } from './SecurityBanner';
import { QuickCaptureButton } from '@/components/inbox/QuickCaptureButton';
import { FloatTodoButton } from '@/components/pip/FloatTodoButton';
import { NotificationPermissionPrompt } from '@/components/reminder/NotificationPermissionPrompt';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SecurityBanner />
      <div className="flex-1 flex">
        {/* Sidebar - always rendered, visibility controlled by CSS */}
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      {/* 全局捕获按钮 */}
      <QuickCaptureButton />
      {/* 悬浮待办按钮 */}
      <FloatTodoButton />
      {/* 通知权限提示 */}
      <NotificationPermissionPrompt />
    </div>
  );
}
