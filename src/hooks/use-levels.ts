'use client';

import { useQuery } from '@tanstack/react-query';

interface Level {
  id: string;
  name: string;
  value: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  todoCount: number;
}

// Get all levels
export function useLevels() {
  return useQuery<{
    success: boolean;
    data: Level[];
  }>({
    queryKey: ['levels'],
    queryFn: async () => {
      const res = await fetch('/api/levels');
      return res.json();
    },
  });
}
