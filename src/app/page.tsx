export const runtime = 'edge';

import { redirect } from 'next/navigation';

// 中间件会将 / 重定向到 /{locale}/，此回退处理边缘情况。
export default function RootPage() {
  redirect('/zh');
}
