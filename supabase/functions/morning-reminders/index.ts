// morning-reminders — pg_cron hits this once each morning (11:00 UTC ≈ 7am ET).
// Texts every customer with a confirmed ride today, plus a day-summary to the
// operators. Idempotence: cron fires once daily; if re-run manually the
// customer just gets a duplicate reminder (annoying, not harmful).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms, formatUsd } from './sms.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const TZ = 'America/New_York';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('nope', { status: 405 });

  // Today's window in business-local time.
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const start = localMidnightUtc(today);
  const end = new Date(start.getTime() + 86_400_000);

  const { data: rides } = await db
    .from('bookings')
    .select('*, customers(name, phone), tour_types(name)')
    .eq('status', 'confirmed')
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .order('starts_at');

  const list = rides ?? [];
  let sent = 0;

  for (const b of list) {
    if (!b.customers?.phone) continue;
    const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(b.starts_at));
    const price = b.tour_type_id ? await priceFor(b.tour_type_id, b.party_size) : '';
    const r = await sendSms(
      b.customers.phone,
      `Reminder: your Archer Airboat Tour is TODAY at ${time}! We launch from Matlacha (near D&D Bait & Tackle, 3922 Pine Island Rd NW).` +
      (price ? ` ${price} due at the dock.` : '') +
      ` Running late or need us? (239) 633-6645`
    );
    if (r.ok) sent++;
  }

  // Operator summary
  const { data: cfgRow } = await db.from('settings').select('value').eq('key', 'notifications').maybeSingle();
  const phones: string[] = Array.isArray(cfgRow?.value?.operator_phones) ? cfgRow.value.operator_phones : [];
  if (phones.length && list.length) {
    const lines = list.map((b) => {
      const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(b.starts_at));
      return `${time} ${b.customers?.name ?? '?'} x${b.party_size}`;
    }).join('; ');
    await Promise.all(phones.map((p) => sendSms(p, `Archer today: ${lines}`)));
  }

  return Response.json({ ok: true, rides: list.length, reminders_sent: sent });
});

function localMidnightUtc(day: string): Date {
  // Find UTC instant of local midnight for the business timezone.
  const guess = new Date(`${day}T00:00:00Z`);
  for (const candidate of [4, 5]) { // ET is UTC-4 (EDT) or UTC-5 (EST)
    const d = new Date(guess.getTime() + candidate * 3_600_000);
    const check = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(d);
    const parts = Object.fromEntries(check.map((p) => [p.type, p.value]));
    if (`${parts.year}-${parts.month}-${parts.day}` === day && (parts.hour === '00' || parts.hour === '24')) return d;
  }
  return new Date(guess.getTime() + 4 * 3_600_000);
}

async function priceFor(tourTypeId: string, party: number): Promise<string> {
  const { data } = await db.rpc('price_for', { p_tour_type: tourTypeId, p_party: party });
  return data != null ? formatUsd(data as number) : '';
}
