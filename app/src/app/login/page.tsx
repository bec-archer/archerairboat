'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { popReturnTo } from '@/lib/auth';

/** Normalize US numbers to E.164 (+1XXXXXXXXXX). */
function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const sendCode = async () => {
    setError(null);
    const e164 = toE164(phone);
    if (!e164) { setError('Enter a valid phone number.'); return; }
    setBusy(true);
    const { error } = await supabase().auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setStage('code');
  };

  const verify = async () => {
    setError(null);
    const e164 = toE164(phone);
    if (!e164) { setError('Enter a valid phone number.'); return; }
    setBusy(true);
    const { error } = await supabase().auth.verifyOtp({ phone: e164, token: code.trim(), type: 'sms' });
    setBusy(false);
    if (error) { setError('That code didn’t work. Double-check it or send a new one.'); return; }
    router.replace(popReturnTo() ?? '/calendar/');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-4xl">🛥️</div>
        <h1 className="mt-2 text-2xl font-bold text-marsh-900">Archer Airboat Tours</h1>
        <p className="mt-1 text-marsh-600">Sign in with your phone number</p>
      </div>

      {stage === 'phone' ? (
        <div className="space-y-4">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(239) 555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-marsh-100 bg-white px-4 py-3 text-lg"
          />
          <button
            onClick={sendCode}
            disabled={busy}
            className="w-full rounded-xl bg-marsh-700 py-3 text-lg font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Text me a code'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-marsh-600">Enter the 6-digit code we texted to {phone}</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-marsh-100 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em]"
          />
          <button
            onClick={verify}
            disabled={busy || code.trim().length < 6}
            className="w-full rounded-xl bg-marsh-700 py-3 text-lg font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          <button onClick={() => { setStage('phone'); setCode(''); }} className="w-full py-2 text-marsh-600">
            Use a different number
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sunset-500">{error}</p>}

      <p className="mt-10 text-center text-xs text-marsh-600/60">
        Lost your phone? Sign in on any device — every booking is safe in the cloud.
      </p>
    </div>
  );
}
