import { redirect } from 'next/navigation';

// The middleware redirects / → /{locale}/, but this fallback handles edge cases.
export default function RootPage() {
  redirect('/zh');
}
