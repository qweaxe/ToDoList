import type { Metadata } from "next";
import "./globals.css";

// Cloudflare 构建时跳过 Google Fonts，使用系统字体
// 如需使用 Google Fonts，可在部署后恢复
// import { Geist, Geist_Mono } from "next/font/google";
// const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "To Do List - Smart Task Management",
  description: "A minimalist, intuitive and highly interactive todo management app with daily task management and monthly calendar view for macro planning and statistics.",
  keywords: ["Todo", "Task Management", "Calendar", "To Do List", "Next.js", "Productivity"],
  authors: [{ name: "To Do List Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
