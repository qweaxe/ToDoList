'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // 立即标记为过期，确保 invalidateQueries 后重新获取
            gcTime: 10 * 60 * 1000, // 10分钟（原cacheTime）
            refetchOnWindowFocus: true, // 窗口聚焦时重新获取
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
