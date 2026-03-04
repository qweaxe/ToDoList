'use client';

import { useQuery } from '@tanstack/react-query';

interface Holiday {
  date: string;
  name: string;
  isHoliday: boolean;
}

// 获取年度节假日
export function useHolidays(year: number) {
  return useQuery<{
    success: boolean;
    data: Holiday[];
  }>({
    queryKey: ['holidays', year],
    queryFn: async () => {
      const res = await fetch(`/api/holidays?year=${year}`);
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 1天过期
  });
}
