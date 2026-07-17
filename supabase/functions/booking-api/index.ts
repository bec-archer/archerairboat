// booking-api — the ONLY door between the public internet and Archer's data.
// Routes:
//   GET  /booking-api/config   -> go-live flag + public tour info + rules
//   GET  /booking-api/slots    -> open slot times for a day + tour
//   POST /booking-api/request  -> "Request a Ride" (Turnstile + rate limit)
//   POST /booking-api/book     -> online booking (Turnstile + flag enforced in SQL)
//
// Anon has zero table access; this function runs as service_role and calls
// SECURITY DEFINER SQL functions that enforce every business rule.
// Deploy with verify_jwt = true (client sends the anon key as Bearer).

import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
);

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY') ?? '';
const PHONE_DISPLAY = '(239) 633-6645';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  if (!token) return false;
  // Fail closed if the secret is missing in prod; the always-passes test
  // secret 1x0000000000000000000000000000000AA is used until Bec creates the widget.
  if (!TURNSTILE_SECRET) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: ip ?? undefined }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

function clientIp(req: Request): string | null {
  return req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? null;
}

function digits(s: string): string {
  return (s ?? '').replace(/\D/g, '');
}

async function getConfig() {
  const [{ data: settings }, { data: tours }] = await Promise.all([
    db.from('settings').select('key, value'),
    db.from('tour_types')
      .select('id, name, duration_min, max_guests, flat_rate_cents, flat_rate_max_party, per_person_cents')
      .eq('active', true)
      .order('name'),
  ]);
  const flag = settings?.find((s) => s.key === 'online_booking_enabled')?.value === true;
  const rules = (settings?.find((s) => s.key === 'booking_rules')?.value ?? {}) as Record<string, unknown>;
  return {
    online_booking_enabled: flag,
    // Tour details stay hidden until the switch is on: while call-first,
    // the public gets the flag + phone number and nothing else.
    tours: flag ? tours ?? [] : [],
    min_notice_hours: Number(rules.min_notice_hours ?? 48),
    horizon_days: Number(rules.horizon_days ?? 90),
    phone_display: PHONE_DISPLAY,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean).pop(); // config | slots | request | book
  const ip = clientIp(req);

  try {
    if (req.method === 'GET' && path === 'config') {
      return json(await getConfig());
    }

    if (req.method === 'GET' && path === 'slots') {
      const cfg = await getConfig();
      if (!cfg.online_booking_enabled) return json({ slots: [] });
      const day = url.searchParams.get('day');
      const tourType = url.searchParams.get('tour_type_id');
      if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !tourType) {
        return json({ slots: [] }, 400);
      }
      const { data, error } = await db.rpc('get_open_slots', { p_day: day, p_tour_type: tourType });
      if (error) return json({ slots: [] }, 500);
      return json({ slots: (data ?? []).map((r: { slot_start: string }) => r.slot_start) });
    }

    if (req.method === 'POST' && path === 'request') {
      const body = await req.json().catch(() => null);
      if (!body) return json({ ok: false, error: 'Bad request.' }, 400);

      if (!(await verifyTurnstile(body.turnstile_token, ip))) {
        return json({ ok: false, error: 'Verification failed. Please try again.' }, 403);
      }

      const name = String(body.name ?? '').trim().slice(0, 200);
      const phone = String(body.phone ?? '').trim().slice(0, 30);
      if (name.length < 1 || digits(phone).length < 10) {
        return json({ ok: false, error: 'A name and valid phone number are required.' }, 400);
      }

      // Rate limits: 3/day per phone, 10/hour per IP.
      const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
      const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
      const [byPhone, byIp] = await Promise.all([
        db.from('booking_requests').select('id', { count: 'exact', head: true })
          .eq('phone', phone).gte('created_at', dayAgo),
        ip
          ? db.from('booking_requests').select('id', { count: 'exact', head: true })
              .eq('client_ip', ip).gte('created_at', hourAgo)
          : Promise.resolve({ count: 0 }),
      ]);
      if ((byPhone.count ?? 0) >= 3 || ((byIp as { count: number | null }).count ?? 0) >= 10) {
        return json({ ok: false, error: `Looks like you already reached out — give us a call at ${PHONE_DISPLAY}!` }, 429);
      }

      const partySize = body.party_size != null ? Number(body.party_size) : null;
      const { error } = await db.from('booking_requests').insert({
        name,
        phone,
        preferred_date: body.preferred_date || null,
        preferred_time: body.preferred_time ? String(body.preferred_time).slice(0, 100) : null,
        party_size: partySize && partySize >= 1 && partySize <= 50 ? partySize : null,
        notes: body.notes ? String(body.notes).slice(0, 2000) : null,
        client_ip: ip,
      });
      if (error) return json({ ok: false, error: 'Something went wrong. Please call us!' }, 500);
      return json({ ok: true });
    }

    if (req.method === 'POST' && path === 'book') {
      const body = await req.json().catch(() => null);
      if (!body) return json({ ok: false, error: 'Bad request.' }, 400);

      if (!(await verifyTurnstile(body.turnstile_token, ip))) {
        return json({ ok: false, error: 'Verification failed. Please try again.' }, 403);
      }

      const { data, error } = await db.rpc('create_online_booking', {
        p_tour_type: String(body.tour_type_id ?? ''),
        p_starts_at: String(body.starts_at ?? ''),
        p_party: Number(body.party_size ?? 0),
        p_name: String(body.name ?? ''),
        p_phone: String(body.phone ?? ''),
        p_email: body.email ? String(body.email) : null,
        p_notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      });
      if (error) {
        return json({ ok: false, error: 'That didn’t go through. Please call us!' }, 500);
      }
      return json(data);
    }

    return json({ error: 'Not found' }, 404);
  } catch {
    return json({ ok: false, error: 'Server error.' }, 500);
  }
});
