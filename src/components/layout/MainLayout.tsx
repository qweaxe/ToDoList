'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SecurityBanner } from './SecurityBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SecurityBanner />
      <Header />
      <div className="flex-1 flex">
        <Sidebar className="hidden md:flex" />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <Footer />
      <Sidebar className="md:hidden" />
    </div>
  );
}
