'use client';

import { useState } from 'react';
import Turnstile from '@/components/Turnstile';
import PublicFrame from '@/components/PublicFrame';
import { submitRequest } from '@/lib/publicApi';

const PHONE_DISPLAY = '(239) 633-6645';

/**
 * Public "Request a Ride" form (call-first phase). No login, no schedule
 * visibility — just a message to Bobby & Elise's Requests inbox.
 */
export default function RequestPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [party, setParty] = useState('');
  const [notes, setNotes] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please give us your name and a phone number we can reach you at.');
      return;
    }
    if (!token) { setError('Please complete the check above.'); return; }
    setBusy(true);
    try {
      const res = await submitRequest({
        name: name.trim(),
        phone: phone.trim(),
        preferred_date: date || undefined,
        preferred_time: time || undefined,
        party_size: party ? Number(party) : undefined,
        notes: notes.trim() || undefined,
        turnstile_token: token,
      });
      if (res.ok) setDone(true);
      else setError(res.error ?? 'Something went wrong. Give us a call instead!');
    } catch {
      setError('Something went wrong. Give us a call instead!');
    }
    setBusy(false);
  };

  const label = 'block text-sm font-medium text-marsh-800 mb-1';
  const input = 'w-full rounded-xl border border-marsh-100 bg-white px-3 py-2.5';

  if (done) {
    return (
      <PublicFrame>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🐬</div>
          <h1 className="mt-3 text-2xl font-bold">Got it!</h1>
          <p className="mt-2 text-marsh-600">
            Captain Bobby or Elise will call you back to set up your ride.
            Can’t wait? Call us at <a className="font-semibold text-marsh-700" href="tel:+12396336645">{PHONE_DISPLAY}</a>.
          </p>
        </div>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <h1 className="text-2xl font-bold">Request a ride</h1>
      <p className="mt-1 text-marsh-600">
        Tell us when you’d like to go out and we’ll call you back to set it up.
        Or just call <a className="font-semibold text-marsh-700" href="tel:+12396336645">{PHONE_DISPLAY}</a>.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className={label}>Your name</label>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label className={label}>Phone number</label>
          <input className={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          <p className="mt-1 text-xs text-marsh-600/70">
            By sending a request you agree to receive booking-related texts from Archer Airboat Tours.
            Message and data rates may apply. Reply STOP to opt out.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Preferred date</label>
            <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={label}>Time of day</label>
            <select className={input} value={time} onChange={(e) => setTime(e.target.value)}>
              <option value="">No preference</option>
              <option>Morning</option>
              <option>Midday</option>
              <option>Afternoon</option>
              <option>Sunset</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label}>How many people?</label>
          <select className={input} value={party} onChange={(e) => setParty(e.target.value)}>
            <option value="">Not sure yet</option>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Anything else?</label>
          <textarea className={input} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Celebrating something? Kids coming along?" />
        </div>

        <Turnstile onToken={setToken} />
        {error && <p className="text-sunset-500">{error}</p>}

        <button onClick={submit} disabled={busy}
          className="w-full rounded-xl bg-marsh-700 py-3 text-lg font-semibold text-white disabled:opacity-50">
          {busy ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </PublicFrame>
  );
}
