'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTourTypes } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { dayKey, zonedTimeToUtc, timeLabel } from '@/lib/dates';
import { priceLabel } from '@/lib/pricing';

/** Create or edit a ride by hand (edit via ?edit=<id>, prefill date via ?date=YYYY-MM-DD). */
function BookingForm() {
  const params = useSearchParams();
  const editId = params.get('edit');
  const router = useRouter();
  const { tourTypes } = useTourTypes(true);

  const [date, setDate] = useState(params.get('date') ?? dayKey(new Date()));
  const [time, setTime] = useState('08:00');
  const [tourTypeId, setTourTypeId] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState(params.get('name') ?? '');
  const [phone, setPhone] = useState(params.get('phone') ?? '');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!editId);

  useEffect(() => {
    if (!tourTypeId && tourTypes.length > 0) setTourTypeId(tourTypes[0].id);
  }, [tourTypes, tourTypeId]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await supabase()
        .from('bookings').select('*, customers(*)').eq('id', editId).maybeSingle();
      if (data) {
        const d = new Date(data.starts_at);
        setDate(dayKey(d));
        setTime(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(d));
        setTourTypeId(data.tour_type_id ?? '');
        setPartySize(data.party_size);
        setName(data.customers?.name ?? '');
        setPhone(data.customers?.phone ?? '');
        setNotes(data.notes ?? '');
        setConfirmed(data.status === 'confirmed');
        setCustomerId(data.customer_id);
      }
      setLoaded(true);
    })();
  }, [editId]);

  const tour = tourTypes.find((t) => t.id === tourTypeId) ?? null;

  const save = async () => {
    setError(null);
    if (!name.trim()) { setError('Customer name is required.'); return; }
    setBusy(true);
    const sb = supabase();
    try {
      let cid = customerId;
      if (cid) {
        await sb.from('customers').update({ name: name.trim(), phone: phone.trim() }).eq('id', cid);
      } else {
        const { data, error } = await sb.from('customers')
          .insert({ name: name.trim(), phone: phone.trim() }).select('id').single();
        if (error) throw error;
        cid = data.id;
      }
      const startsAt = zonedTimeToUtc(date, time).toISOString();
      const row = {
        tour_type_id: tourTypeId || null,
        customer_id: cid,
        starts_at: startsAt,
        party_size: partySize,
        status: confirmed ? 'confirmed' : 'requested',
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        const { error } = await sb.from('bookings').update(row).eq('id', editId);
        if (error) throw error;
        router.push(`/a/?id=${editId}`);
      } else {
        const { data, error } = await sb.from('bookings')
          .insert({ ...row, source: 'manual' }).select('id').single();
        if (error) throw error;
        router.push(`/a/?id=${data.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving the ride.');
      setBusy(false);
    }
  };

  if (!loaded) return <p className="p-4 text-marsh-600">Loading…</p>;

  const label = 'block text-sm font-medium text-marsh-800 mb-1';
  const input = 'w-full rounded-xl border border-marsh-100 bg-white px-3 py-2.5';

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Customer name</label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
      </div>
      <div>
        <label className={label}>Customer phone</label>
        <input className={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(239) 555-0123" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Date</label>
          <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={label}>Time</label>
          <input className={input} type="time" value={time} onChange={(e) => setTime(e.target.value)} step={900} />
        </div>
      </div>
      <div>
        <label className={label}>Tour</label>
        <select className={input} value={tourTypeId} onChange={(e) => setTourTypeId(e.target.value)}>
          {tourTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.duration_min} min)</option>)}
        </select>
      </div>
      <div>
        <label className={label}>Guests {tour && <span className="font-normal text-marsh-600">· {priceLabel(tour, partySize)}</span>}</label>
        <div className="flex gap-2">
          {Array.from({ length: tour?.max_guests ?? 6 }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPartySize(n)}
              className={`h-11 w-11 rounded-xl font-semibold ${partySize === n ? 'bg-marsh-700 text-white' : 'bg-white text-marsh-800'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={label}>Notes</label>
        <textarea className={input} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Anniversary, kids ages 6 and 9, meet at the dock…" />
      </div>
      <label className="flex items-center gap-3 rounded-xl bg-white p-3">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
        <span className="font-medium">Confirmed</span>
      </label>

      {error && <p className="text-sunset-500">{error}</p>}

      <button onClick={save} disabled={busy}
        className="w-full rounded-xl bg-marsh-700 py-3 text-lg font-semibold text-white disabled:opacity-50">
        {busy ? 'Saving…' : editId ? 'Save changes' : 'Add ride'}
      </button>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <AppShell title="Ride">
      <Suspense fallback={<p className="p-4 text-marsh-600">Loading…</p>}>
        <BookingForm />
      </Suspense>
    </AppShell>
  );
}
