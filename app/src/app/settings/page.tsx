'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { useAvailability, useRules, useTourTypes } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { formatUsd } from '@/lib/pricing';
import type { TourType } from '@/lib/types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const card = 'rounded-2xl bg-white p-4 shadow-sm';
const label = 'block text-sm font-medium text-marsh-800 mb-1';
const input = 'w-full rounded-xl border border-marsh-100 bg-white px-3 py-2.5';

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="space-y-4">
        <GoLiveCard />
        <TourTypesCard />
        <AvailabilityCard />
        <RulesCard />
        <AccountCard />
      </div>
    </AppShell>
  );
}

/** The switch. Bobby and Elise flip this when they're ready — nothing else to do. */
function GoLiveCard() {
  const { goLive, refetch } = useRules();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const turningOn = !goLive;
    const msg = turningOn
      ? 'Turn ON online booking? Customers will be able to book open slots on the website immediately.'
      : 'Turn OFF online booking? The website goes back to "call to book" and the request form.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    await supabase().from('settings')
      .update({ value: turningOn, updated_at: new Date().toISOString() })
      .eq('key', 'online_booking_enabled');
    setBusy(false);
    refetch();
  };

  return (
    <div className={`${card} border-2 ${goLive ? 'border-marsh-600' : 'border-sand-500'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Online booking</h2>
          <p className="text-sm text-marsh-600">
            {goLive
              ? 'ON — customers can book open slots on the website.'
              : 'OFF — website says call to book. Flip it whenever you’re ready.'}
          </p>
        </div>
        <button onClick={toggle} disabled={busy}
          className={`relative h-8 w-14 rounded-full transition-colors ${goLive ? 'bg-marsh-600' : 'bg-gray-300'} disabled:opacity-50`}
          aria-label="Toggle online booking">
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${goLive ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
}

function TourTypesCard() {
  const { tourTypes, refetch } = useTourTypes();
  const [editing, setEditing] = useState<TourType | null>(null);

  return (
    <div className={card}>
      <h2 className="text-lg font-bold">Tours & prices</h2>
      <div className="mt-2 space-y-2">
        {tourTypes.map((t) => (
          <button key={t.id} onClick={() => setEditing(t)}
            className={`block w-full rounded-xl border border-marsh-100 p-3 text-left ${t.active ? '' : 'opacity-50'}`}>
            <div className="flex justify-between font-semibold">
              <span>{t.name}{!t.active && ' (off)'}</span>
              <span>
                {t.flat_rate_cents != null && `${formatUsd(t.flat_rate_cents)} / couple`}
                {t.per_person_cents != null && ` · ${formatUsd(t.per_person_cents)}pp`}
              </span>
            </div>
            <div className="text-sm text-marsh-600">{t.duration_min} min · up to {t.max_guests} guests</div>
            {t.internal_notes?.includes('PLACEHOLDER') && (
              <div className="mt-1 text-xs text-sunset-500">⚠ has a placeholder — check with Bobby</div>
            )}
          </button>
        ))}
      </div>
      {editing && <TourTypeEditor tour={editing} onDone={() => { setEditing(null); refetch(); }} />}
    </div>
  );
}

function TourTypeEditor({ tour, onDone }: { tour: TourType; onDone: () => void }) {
  const [name, setName] = useState(tour.name);
  const [duration, setDuration] = useState(tour.duration_min);
  const [maxGuests, setMaxGuests] = useState(tour.max_guests);
  const [flat, setFlat] = useState(tour.flat_rate_cents != null ? tour.flat_rate_cents / 100 : '');
  const [flatMax, setFlatMax] = useState(tour.flat_rate_max_party ?? 2);
  const [pp, setPp] = useState(tour.per_person_cents != null ? tour.per_person_cents / 100 : '');
  const [active, setActive] = useState(tour.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase().from('tour_types').update({
      name: name.trim(),
      duration_min: Number(duration),
      max_guests: Number(maxGuests),
      flat_rate_cents: flat === '' ? null : Math.round(Number(flat) * 100),
      flat_rate_max_party: flat === '' ? null : Number(flatMax),
      per_person_cents: pp === '' ? null : Math.round(Number(pp) * 100),
      active,
    }).eq('id', tour.id);
    setBusy(false);
    if (error) { setError(error.message); return; }
    onDone();
  };

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-marsh-50 p-3">
      <div>
        <label className={label}>Name</label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Length (minutes)</label>
          <input className={input} type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div>
          <label className={label}>Max guests</label>
          <input className={input} type="number" value={maxGuests} onChange={(e) => setMaxGuests(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={label}>Flat rate $</label>
          <input className={input} type="number" value={flat} onChange={(e) => setFlat(e.target.value === '' ? '' : Number(e.target.value))} placeholder="180" />
        </div>
        <div>
          <label className={label}>...for up to</label>
          <input className={input} type="number" value={flatMax} onChange={(e) => setFlatMax(Number(e.target.value))} />
        </div>
        <div>
          <label className={label}>Then $/person</label>
          <input className={input} type="number" value={pp} onChange={(e) => setPp(e.target.value === '' ? '' : Number(e.target.value))} placeholder="65" />
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5" />
        <span>Bookable</span>
      </label>
      {error && <p className="text-sunset-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="flex-1 rounded-xl bg-marsh-700 py-2.5 font-semibold text-white disabled:opacity-50">Save</button>
        <button onClick={onDone} className="rounded-xl bg-white px-4 py-2.5 text-marsh-600">Cancel</button>
      </div>
    </div>
  );
}

function AvailabilityCard() {
  const { availability, blackouts, refetch } = useAvailability();
  const [busy, setBusy] = useState(false);
  const [newBlackout, setNewBlackout] = useState('');

  const updateRule = async (id: string, field: 'start_time' | 'end_time', value: string) => {
    setBusy(true);
    await supabase().from('availability_rules').update({ [field]: value }).eq('id', id);
    setBusy(false);
    refetch();
  };

  const removeRule = async (id: string) => {
    if (!window.confirm('Remove this day? Customers won’t be able to book it online.')) return;
    setBusy(true);
    await supabase().from('availability_rules').delete().eq('id', id);
    setBusy(false);
    refetch();
  };

  const addRule = async (weekday: number) => {
    setBusy(true);
    await supabase().from('availability_rules').insert({ weekday, start_time: '08:00', end_time: '16:00' });
    setBusy(false);
    refetch();
  };

  const addBlackout = async () => {
    if (!newBlackout) return;
    setBusy(true);
    await supabase().from('blackout_dates').insert({ day: newBlackout });
    setNewBlackout('');
    setBusy(false);
    refetch();
  };

  const removeBlackout = async (id: string) => {
    setBusy(true);
    await supabase().from('blackout_dates').delete().eq('id', id);
    setBusy(false);
    refetch();
  };

  const byWeekday = new Map(availability.map((a) => [a.weekday, a]));

  return (
    <div className={card}>
      <h2 className="text-lg font-bold">Days & hours</h2>
      <p className="text-sm text-marsh-600">When rides can be booked. Changes apply to online booking instantly.</p>
      <div className="mt-2 space-y-1">
        {WEEKDAYS.map((day, w) => {
          const rule = byWeekday.get(w);
          return (
            <div key={w} className="flex items-center gap-2 py-1">
              <span className="w-24 text-sm font-medium">{day}</span>
              {rule ? (
                <>
                  <input type="time" className="rounded-lg border border-marsh-100 px-2 py-1.5" disabled={busy}
                    value={rule.start_time.slice(0, 5)}
                    onChange={(e) => updateRule(rule.id, 'start_time', e.target.value)} />
                  <span className="text-marsh-600">to</span>
                  <input type="time" className="rounded-lg border border-marsh-100 px-2 py-1.5" disabled={busy}
                    value={rule.end_time.slice(0, 5)}
                    onChange={(e) => updateRule(rule.id, 'end_time', e.target.value)} />
                  <button onClick={() => removeRule(rule.id)} disabled={busy} className="ml-auto px-2 text-sunset-500">✕</button>
                </>
              ) : (
                <button onClick={() => addRule(w)} disabled={busy} className="text-sm text-marsh-700 underline">
                  closed — tap to open
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="mt-4 font-semibold">Days off</h3>
      <div className="mt-1 space-y-1">
        {blackouts.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg bg-marsh-50 px-3 py-2">
            <span>{b.day}{b.reason ? ` — ${b.reason}` : ''}</span>
            <button onClick={() => removeBlackout(b.id)} disabled={busy} className="text-sunset-500">✕</button>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <input type="date" className={input} value={newBlackout} onChange={(e) => setNewBlackout(e.target.value)} />
          <button onClick={addBlackout} disabled={busy || !newBlackout}
            className="rounded-xl bg-marsh-100 px-4 font-semibold text-marsh-800 disabled:opacity-50">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function RulesCard() {
  const { rules, refetch } = useRules();
  const [notice, setNotice] = useState<number | null>(null);
  const [horizon, setHorizon] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotice((n) => n ?? rules.min_notice_hours);
    setHorizon((h) => h ?? rules.horizon_days);
  }, [rules]);

  const save = async () => {
    setBusy(true);
    await supabase().from('settings').update({
      value: { ...rules, min_notice_hours: Number(notice), horizon_days: Number(horizon) },
      updated_at: new Date().toISOString(),
    }).eq('key', 'booking_rules');
    setBusy(false);
    refetch();
  };

  return (
    <div className={card}>
      <h2 className="text-lg font-bold">Online booking rules</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Minimum notice (hours)</label>
          <input className={input} type="number" value={notice ?? ''} onChange={(e) => setNotice(Number(e.target.value))} />
        </div>
        <div>
          <label className={label}>How far out (days)</label>
          <input className={input} type="number" value={horizon ?? ''} onChange={(e) => setHorizon(Number(e.target.value))} />
        </div>
      </div>
      <button onClick={save} disabled={busy}
        className="mt-3 w-full rounded-xl bg-marsh-100 py-2.5 font-semibold text-marsh-800 disabled:opacity-50">
        {busy ? 'Saving…' : 'Save rules'}
      </button>
    </div>
  );
}

function AccountCard() {
  const { signOut, session } = useAuth();
  return (
    <div className={card}>
      <h2 className="text-lg font-bold">Account</h2>
      <p className="mt-1 text-sm text-marsh-600">Signed in as {session?.user?.phone ?? 'operator'}</p>
      <button onClick={signOut} className="mt-2 w-full rounded-xl bg-white py-2.5 font-semibold text-sunset-500 shadow-sm">
        Sign out
      </button>
    </div>
  );
}
