// notify-booking — fired by database triggers (pg_net) on:
//   bookings INSERT                  -> operator SMS (+ customer confirm for online bookings)
//   bookings UPDATE requested->confirmed -> customer confirmation SMS
//   booking_requests INSERT          -> operator SMS
//
// Payload mimics Supabase webhook shape: { type, table, record, old_record }.
// verify_jwt = true; the trigger sends the publishable key as Bearer.
// Operator numbers + deep-link base URL live in settings (key 'notifications')
// so they're editable without redeploying.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendSms, formatWhen, formatUsd } from './sms.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

interface NotifyConfig {
  app_base_url: string;
  operator_phones: string[];
}

async function notifyConfig(): Promise<NotifyConfig> {
  const { data } = await db.from('settings').select('value').eq('key', 'notifications').maybeSingle();
  const v = (data?.value ?? {}) as Partial<NotifyConfig>;
  return {
    app_base_url: v.app_base_url ?? 'https://app.archerairboattours.com',
    operator_phones: Array.isArray(v.operator_phones) ? v.operator_phones : [],
  };
}

async function sendOperators(cfg: NotifyConfig, text: string) {
  if (cfg.operator_phones.length === 0) {
    console.log(`[notify] no operator phones configured; would send: ${text}`);
    return;
  }
  await Promise.all(cfg.operator_phones.map((p) => sendSms(p, text)));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('nope', { status: 405 });
  const payload = await req.json().catch(() => null);
  if (!payload?.table || !payload?.record) return new Response('bad payload', { status: 400 });

  const cfg = await notifyConfig();
  const { type, table, record, old_record } = payload;

  try {
    if (table === 'booking_requests' && type === 'INSERT') {
      const wants = [
        record.preferred_date, record.preferred_time,
        record.party_size ? `${record.party_size} guests` : null,
      ].filter(Boolean).join(', ');
      await sendOperators(cfg,
        `Archer: new ride REQUEST from ${record.name} (${record.phone})` +
        (wants ? ` — wants ${wants}` : '') +
        `. Reply to them, then log it: ${cfg.app_base_url}/requests/`
      );
      return Response.json({ ok: true });
    }

    if (table === 'bookings') {
      // Pull customer + tour for a readable message.
      const { data: booking } = await db
        .from('bookings')
        .select('*, customers(name, phone), tour_types(name, duration_min)')
        .eq('id', record.id)
        .maybeSingle();
      if (!booking) return Response.json({ ok: false });

      const who = booking.customers?.name ?? 'Someone';
      const tour = booking.tour_types?.name ?? 'a tour';
      const when = formatWhen(booking.starts_at);
      const price = await priceFor(booking.tour_type_id, booking.party_size);
      const link = `${cfg.app_base_url}/a/?id=${booking.id}`;

      if (type === 'INSERT') {
        const src = booking.source === 'online' ? 'BOOKED ONLINE' : booking.source === 'web_request' ? 'web request' : 'added';
        await sendOperators(cfg,
          `Archer: ${who} — ${tour}, ${when}, ${booking.party_size} guests` +
          (price ? ` (${price})` : '') + ` [${src}]. Details: ${link}`
        );
        if (booking.source === 'online' && booking.status === 'confirmed' && booking.customers?.phone) {
          await sendSms(booking.customers.phone, customerConfirmText(tour, when, booking.party_size, price));
        }
        return Response.json({ ok: true });
      }

      if (type === 'UPDATE' && old_record?.status === 'requested' && record.status === 'confirmed') {
        if (booking.customers?.phone) {
          await sendSms(booking.customers.phone, customerConfirmText(tour, when, booking.party_size, price));
        }
        return Response.json({ ok: true });
      }
    }

    return Response.json({ ok: true, ignored: true });
  } catch (e) {
    console.error('[notify] error', e);
    return Response.json({ ok: false }, { status: 500 });
  }
});

function customerConfirmText(tour: string, when: string, party: number, price: string): string {
  return (
    `You're booked with Archer Airboat Tours! ${tour}, ${when}, ${party} ${party === 1 ? 'guest' : 'guests'}.` +
    (price ? ` ${price} due at the dock.` : '') +
    ` We launch from Matlacha — questions? Call (239) 633-6645.`
  );
}

async function priceFor(tourTypeId: string | null, party: number): Promise<string> {
  if (!tourTypeId) return '';
  const { data } = await db.rpc('price_for', { p_tour_type: tourTypeId, p_party: party });
  return data != null ? formatUsd(data as number) : '';
}
