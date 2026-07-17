// send-otp-sms — Supabase Auth "Send SMS" hook.
// Auth calls this instead of a built-in SMS provider whenever it needs to
// deliver an OTP; we send it via Telnyx (same number as all other Archer SMS).
//
// Security: deployed with verify_jwt = false because Supabase Auth signs hook
// requests with a standardwebhooks signature instead of a JWT. We verify that
// signature with SEND_SMS_HOOK_SECRET (dashboard: Auth > Hooks, copy the
// generated secret into Edge Function secrets). Fails closed if unset.
//
// Dev note: while Telnyx creds are absent, sendSms logs [sms:SIMULATED] and
// the OTP appears in the function logs. Real-phone testing before Telnyx
// approval should use Supabase test phone numbers (fixed OTPs, no SMS sent).

import { Webhook } from 'npm:standardwebhooks@1.0.0';
import { sendSms } from './sms.ts';

const HOOK_SECRET = Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('nope', { status: 405 });
  if (!HOOK_SECRET) {
    console.error('[otp] SEND_SMS_HOOK_SECRET not set; refusing');
    return Response.json({ error: 'hook secret not configured' }, { status: 500 });
  }

  const rawBody = await req.text();

  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    const wh = new Webhook(HOOK_SECRET.replace('v1,whsec_', ''));
    payload = wh.verify(rawBody, Object.fromEntries(req.headers)) as typeof payload;
  } catch {
    console.error('[otp] signature verification failed');
    return Response.json({ error: 'invalid signature' }, { status: 401 });
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) return Response.json({ error: 'bad payload' }, { status: 400 });

  const result = await sendSms(
    phone,
    `Your Archer Airboat Tours sign-in code is ${otp}. It expires in 5 minutes.`
  );

  if (!result.ok) {
    return Response.json({ error: 'sms send failed' }, { status: 500 });
  }
  return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
