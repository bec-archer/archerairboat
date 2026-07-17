// Shared SMS sender (Telnyx). Reads secrets from Edge Function env:
//   TELNYX_API_KEY   — Telnyx v2 API key
//   TELNYX_FROM      — E.164 sending number (the Archer 10DLC number)
// Until Bec sets those secrets, sends are LOGGED and skipped (dev mode) —
// nothing breaks, and the logs show exactly what would have been sent.

const API_KEY = Deno.env.get('TELNYX_API_KEY') ?? '';
const FROM = Deno.env.get('TELNYX_FROM') ?? '';

export interface SmsResult {
  ok: boolean;
  simulated?: boolean;
  error?: string;
}

export async function sendSms(to: string, text: string): Promise<SmsResult> {
  const toClean = normalizeUs(to);
  if (!toClean) return { ok: false, error: `bad number: ${to}` };

  if (!API_KEY || !FROM) {
    console.log(`[sms:SIMULATED] to=${toClean} text=${JSON.stringify(text)}`);
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: toClean, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[sms:FAILED] to=${toClean} status=${res.status} body=${body}`);
      return { ok: false, error: `telnyx ${res.status}` };
    }
    console.log(`[sms:SENT] to=${toClean}`);
    return { ok: true };
  } catch (e) {
    console.error(`[sms:ERROR] to=${toClean}`, e);
    return { ok: false, error: String(e) };
  }
}

export function normalizeUs(input: string): string | null {
  const d = (input ?? '').replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  if ((input ?? '').startsWith('+') && d.length >= 10) return `+${d}`;
  return null;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit',
  }).format(d);
  return `${date} at ${time}`;
}

export function formatUsd(cents: number | null | undefined): string {
  if (cents == null) return '';
  const d = cents / 100;
  return d % 1 === 0 ? `$${d}` : `$${d.toFixed(2)}`;
}
