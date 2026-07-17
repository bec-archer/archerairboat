'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useBookings } from '@/lib/data';
import { dayKey, timeLabel, zonedTimeToUtc, addDays } from '@/lib/dates';

/**
 * Bobby's glance view: today's rides, huge type, zero buttons to fat-finger.
 * Read-only by design; tapping a ride opens the detail if he needs more.
 */
export default function TodayPage() {
  const today = dayKey(new Date());
  const fromIso = useMemo(() => zonedTimeToUtc(today, '00:00').toISOString(), [today]);
  const toIso = useMemo(() => zonedTimeToUtc(addDays(today, 1), '00:00').toISOString(), [today]);
  const { bookings, offline } = useBookings(fromIso, toIso);

  const rides = bookings.filter((b) => b.status === 'confirmed' || b.status === 'requested');

  return (
    <AppShell title="Today">
      {offline && (
        <div className="mb-2 rounded-lg bg-sand-100 px-3 py-2 text-sm text-marsh-800">
          📴 No signal — showing last saved schedule
        </div>
      )}
      <p className="mb-3 text-marsh-600">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {rides.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center">
          <div className="text-5xl">🌤️</div>
          <p className="mt-3 text-xl text-marsh-800">No rides today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((b) => (
            <Link key={b.id} href={`/a/?id=${b.id}`} className="block rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-3xl font-bold text-marsh-900">{timeLabel(b.starts_at)}</div>
              <div className="mt-1 text-xl text-marsh-800">
                {b.customers?.name ?? 'No name'}
              </div>
              <div className="mt-1 text-lg text-marsh-600">
                {b.party_size} {b.party_size === 1 ? 'guest' : 'guests'} · {b.tour_types?.name ?? 'Tour'}
                {b.status === 'requested' && <span className="ml-2 rounded bg-sand-100 px-2 py-0.5 text-sm text-sunset-500">not confirmed</span>}
              </div>
              {b.customers?.phone && (
                <div className="mt-2 text-lg font-medium text-marsh-700">📞 {b.customers.phone}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
