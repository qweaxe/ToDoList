import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "To Do List - 智能待办事项管理",
  description: "极简、直观且具有高度交互性的待办事项管理应用，支持按天管理任务，并提供月度日历视图进行宏观规划和数据统计。",
  keywords: ["待办事项", "任务管理", "日历", "Todo", "To Do List", "Next.js"],
  authors: [{ name: "To Do List Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
