'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth, stashReturnTo } from '@/lib/auth';

const TABS = [
  { href: '/calendar/', label: 'Calendar', icon: '📅' },
  { href: '/today/', label: 'Today', icon: '🛥️' },
  { href: '/requests/', label: 'Requests', icon: '📥' },
  { href: '/settings/', label: 'Settings', icon: '⚙️' },
];

export default function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      stashReturnTo(window.location.pathname + window.location.search);
      router.replace('/login/');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-marsh-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-marsh-900 px-4 py-3 text-white shadow">
        <div className="text-lg font-semibold">{title ?? 'Archer Airboat Tours'}</div>
      </header>
      <main className="flex-1 px-3 pb-24 pt-3">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-marsh-100 bg-white">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((t) => {
            const active = pathname?.startsWith(t.href.slice(0, -1));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  active ? 'font-semibold text-marsh-700' : 'text-marsh-600/70'
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
