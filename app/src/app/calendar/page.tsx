'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useBookings } from '@/lib/data';
import { dayKey, monthGrid, timeLabel, zonedTimeToUtc, addDays } from '@/lib/dates';
import type { Booking } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  requested: 'bg-sand-100 text-marsh-800 border-sand-500',
  confirmed: 'bg-marsh-100 text-marsh-800 border-marsh-600',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-300 line-through',
  completed: 'bg-marsh-50 text-marsh-600 border-marsh-100',
};

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState<string>(dayKey(now));

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const firstDay = cells.find((c) => c) as string;
  const lastDay = [...cells].reverse().find((c) => c) as string;
  const fromIso = useMemo(() => zonedTimeToUtc(firstDay, '00:00').toISOString(), [firstDay]);
  const toIso = useMemo(() => zonedTimeToUtc(addDays(lastDay, 1), '00:00').toISOString(), [lastDay]);

  const { bookings, offline } = useBookings(fromIso, toIso);

  const byDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      const k = dayKey(new Date(b.starts_at));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(b);
    }
    return m;
  }, [bookings]);

  const monthLabel = new Date(Date.UTC(year, month, 1, 12)).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const todayKey = dayKey(new Date());
  const dayRides = (byDay.get(selected) ?? []).filter((b) => b.status !== 'cancelled');
  const dayCancelled = (byDay.get(selected) ?? []).filter((b) => b.status === 'cancelled');

  const shiftMonth = (n: number) => {
    const d = new Date(Date.UTC(year, month + n, 1, 12));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  };

  return (
    <AppShell title="Calendar">
      {offline && (
        <div className="mb-2 rounded-lg bg-sand-100 px-3 py-2 text-sm text-marsh-800">
          📴 No signal — showing last saved schedule
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="rounded-lg px-4 py-2 text-xl text-marsh-700">‹</button>
        <div className="text-lg font-semibold">{monthLabel}</div>
        <button onClick={() => shiftMonth(1)} className="rounded-lg px-4 py-2 text-xl text-marsh-700">›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-marsh-600/70">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const rides = (byDay.get(day) ?? []).filter((b) => b.status !== 'cancelled');
          const isSel = day === selected;
          const isToday = day === todayKey;
          const hasRides = rides.length > 0;
          return (
            <button
              key={i}
              onClick={() => setSelected(day)}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${
                isSel
                  ? 'bg-marsh-700 text-white'
                  : hasRides
                  ? 'bg-sunset-100 font-semibold text-marsh-900'
                  : isToday
                  ? 'bg-marsh-100'
                  : 'bg-white'
              }${isToday && !isSel ? ' ring-2 ring-inset ring-marsh-600/40' : ''}`}
            >
              <span>{Number(day.slice(8))}</span>
              <span className="flex h-2 gap-0.5">
                {rides.slice(0, 3).map((r) => (
                  <span key={r.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-sand-500' : r.status === 'requested' ? 'bg-sunset-600' : 'bg-marsh-600'}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-semibold">
          {new Date(`${selected}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
        </h2>
        <Link
          href={`/new/?date=${selected}`}
          className="rounded-xl bg-marsh-700 px-4 py-2 font-semibold text-white"
        >
          + Add ride
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        {dayRides.length === 0 && dayCancelled.length === 0 && (
          <p className="rounded-xl bg-white p-4 text-marsh-600">No rides scheduled.</p>
        )}
        {[...dayRides, ...dayCancelled].map((b) => (
          <Link
            key={b.id}
            href={`/a/?id=${b.id}`}
            className={`block rounded-xl border-l-4 bg-white p-3 shadow-sm ${STATUS_STYLES[b.status]}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">{timeLabel(b.starts_at)}</span>
              <span className="text-xs uppercase tracking-wide">{b.status}</span>
            </div>
            <div className="text-marsh-800">
              {b.customers?.name ?? 'No name'} · {b.party_size} {b.party_size === 1 ? 'guest' : 'guests'}
            </div>
            <div className="text-sm text-marsh-600">{b.tour_types?.name ?? 'Tour'}</div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
