'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4 px-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <span>by To Do List</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs">
            © {new Date().getFullYear()} To Do List. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
