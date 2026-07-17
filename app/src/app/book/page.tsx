'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PublicFrame from '@/components/PublicFrame';
import Turnstile from '@/components/Turnstile';
import { createBooking, getOpenSlots, getPublicConfig, type PublicConfig, type PublicTour } from '@/lib/publicApi';
import { addDays, dayKey, timeLabel } from '@/lib/dates';
import { formatUsd } from '@/lib/pricing';

/**
 * Public online booking. Fully gated by the go-live flag:
 * the flag is enforced SERVER-SIDE (config, slots, and book all refuse when
 * off) — this page just renders whatever the server allows. While the flag is
 * off, visitors see the call-first message and a link to the request form.
 */
export default function BookPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPublicConfig().then(setConfig).catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <PublicFrame>
        <CallFirst />
      </PublicFrame>
    );
  }
  if (!config) {
    return (
      <PublicFrame>
        <p className="text-center text-marsh-600">Loading…</p>
      </PublicFrame>
    );
  }
  if (!config.online_booking_enabled) {
    return (
      <PublicFrame>
        <CallFirst />
      </PublicFrame>
    );
  }
  return (
    <PublicFrame>
      <Booker config={config} />
    </PublicFrame>
  );
}

function CallFirst() {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <div className="text-5xl">📞</div>
      <h1 className="mt-3 text-2xl font-bold">Call to book your ride</h1>
      <p className="mt-2 text-marsh-600">
        Booking a tour is one quick call with Captain Bobby or Elise:
      </p>
      <a href="tel:+12396336645" className="mt-3 block text-2xl font-bold text-marsh-700">
        (239) 633-6645
      </a>
      <p className="mt-4 text-marsh-600">
        Prefer we call you? <Link href="/request/" className="font-semibold text-marsh-700 underline">Send a ride request</Link>.
      </p>
    </div>
  );
}

function Booker({ config }: { config: PublicConfig }) {
  const [tour, setTour] = useState<PublicTour>(config.tours[0]);
  const [party, setParty] = useState(2);
  const [day, setDay] = useState<string>('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [pricePaid, setPricePaid] = useState<number | null>(null);

  const minDay = useMemo(
    () => dayKey(new Date(Date.now() + config.min_notice_hours * 3600_000)),
    [config.min_notice_hours]
  );
  const maxDay = useMemo(() => addDays(dayKey(new Date()), config.horizon_days), [config.horizon_days]);

  useEffect(() => {
    setSlot(null);
    setSlots(null);
    if (!day) return;
    getOpenSlots(day, tour.id).then(setSlots).catch(() => setSlots([]));
  }, [day, tour.id]);

  const price = useMemo(() => {
    const flatMax = tour.flat_rate_max_party ?? 0;
    if (tour.flat_rate_cents != null && party <= flatMax) return tour.flat_rate_cents;
    if (tour.per_person_cents != null) return tour.per_person_cents * party;
    return tour.flat_rate_cents;
  }, [tour, party]);

  const book = async () => {
    setError(null);
    if (!slot) { setError('Pick a time first.'); return; }
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('We need your name and a good phone number.');
      return;
    }
    if (!token) { setError('Please complete the check above.'); return; }
    setBusy(true);
    try {
      const res = await createBooking({
        tour_type_id: tour.id,
        starts_at: slot,
        party_size: party,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        turnstile_token: token,
      });
      if (res.ok && res.booking_id) {
        setConfirmedId(res.booking_id);
        setPricePaid(res.price_cents ?? null);
      } else {
        setError(res.error ?? 'That slot may have just been taken. Pick another time or call us!');
        // Re-pull slots in case someone grabbed it.
        if (day) getOpenSlots(day, tour.id).then(setSlots).catch(() => {});
      }
    } catch {
      setError('Something went wrong. Call us and we’ll get you on the water: (239) 633-6645');
    }
    setBusy(false);
  };

  const label = 'block text-sm font-medium text-marsh-800 mb-1';
  const input = 'w-full rounded-xl border border-marsh-100 bg-white px-3 py-2.5';

  if (confirmedId) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-3 text-2xl font-bold">You’re booked!</h1>
        <p className="mt-2 text-marsh-600">
          {slot && <>See you {new Date(slot).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })} at {timeLabel(slot)}. </>}
          We’ll text you a confirmation.
          {pricePaid != null && <> Total due at the dock: <b>{formatUsd(pricePaid)}</b> for {party} {party === 1 ? 'guest' : 'guests'}.</>}
        </p>
        <p className="mt-3 text-sm text-marsh-600">
          Questions? Call <a href="tel:+12396336645" className="font-semibold text-marsh-700">(239) 633-6645</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Book your ride</h1>

      <div>
        <label className={label}>Tour</label>
        <div className="space-y-2">
          {config.tours.map((t) => (
            <button key={t.id} onClick={() => setTour(t)}
              className={`w-full rounded-xl border p-3 text-left ${t.id === tour.id ? 'border-marsh-700 bg-marsh-100' : 'border-marsh-100 bg-white'}`}>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-marsh-600">
                {t.duration_min} minutes · up to {t.max_guests} guests
                {t.flat_rate_cents != null && <> · {formatUsd(t.flat_rate_cents)} for {t.flat_rate_max_party ?? 2}</>}
                {t.per_person_cents != null && <>, {formatUsd(t.per_person_cents)}/person for groups</>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>How many guests?</label>
        <div className="flex gap-2">
          {Array.from({ length: tour.max_guests }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setParty(n)}
              className={`h-11 w-11 rounded-xl font-semibold ${party === n ? 'bg-marsh-700 text-white' : 'bg-white'}`}>
              {n}
            </button>
          ))}
        </div>
        {price != null && <p className="mt-1 text-sm text-marsh-600">Total: <b>{formatUsd(price)}</b> (pay at the dock)</p>}
      </div>

      <div>
        <label className={label}>Date</label>
        <input className={input} type="date" min={minDay} max={maxDay} value={day} onChange={(e) => setDay(e.target.value)} />
      </div>

      {day && (
        <div>
          <label className={label}>Time</label>
          {slots === null ? (
            <p className="text-marsh-600">Checking the schedule…</p>
          ) : slots.length === 0 ? (
            <p className="rounded-xl bg-sand-100 p-3 text-marsh-800">
              No open times that day. Try another date, or call us: <a href="tel:+12396336645" className="font-semibold">(239) 633-6645</a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)}
                  className={`rounded-xl px-4 py-2.5 font-semibold ${slot === s ? 'bg-marsh-700 text-white' : 'bg-white'}`}>
                  {timeLabel(s)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {slot && (
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <label className={label}>Your name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className={label}>Mobile number (we’ll text your confirmation)</label>
            <input className={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            <p className="mt-1 text-xs text-marsh-600/70">
              By booking you agree to receive booking-related texts (confirmation and a morning-of reminder)
              from Archer Airboat Tours. Message and data rates may apply. Reply STOP to opt out.
            </p>
          </div>
          <div>
            <label className={label}>Email (optional)</label>
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className={label}>Anything we should know? (optional)</label>
            <textarea className={input} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Turnstile onToken={setToken} />
          {error && <p className="text-sunset-500">{error}</p>}
          <button onClick={book} disabled={busy}
            className="w-full rounded-xl bg-marsh-700 py-3 text-lg font-semibold text-white disabled:opacity-50">
            {busy ? 'Booking…' : `Book it — ${price != null ? formatUsd(price) : ''} at the dock`}
          </button>
        </div>
      )}
    </div>
  );
}
