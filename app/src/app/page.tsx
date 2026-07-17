'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(session ? '/calendar/' : '/login/');
  }, [loading, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-marsh-600">Loading…</div>
  );
}
