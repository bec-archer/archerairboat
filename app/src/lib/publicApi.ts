'use client';

// Client for the public booking Edge Function ("booking-api").
// The public site NEVER talks to tables directly: no anon SELECT/INSERT
// exists. Everything goes through this API, which verifies Turnstile
// server-side, enforces the go-live flag in SQL, and rate-limits.

const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-api`;
const HEADERS = {
  'Content-Type': 'application/json',
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
};

export interface PublicTour {
  id: string;
  name: string;
  duration_min: number;
  max_guests: number;
  flat_rate_cents: number | null;
  flat_rate_max_party: number | null;
  per_person_cents: number | null;
}

export interface PublicConfig {
  online_booking_enabled: boolean;
  tours: PublicTour[];
  min_notice_hours: number;
  horizon_days: number;
  phone_display: string;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const res = await fetch(`${BASE}/config`, { headers: HEADERS });
  if (!res.ok) throw new Error('config failed');
  return res.json();
}

export async function getOpenSlots(day: string, tourTypeId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/slots?day=${day}&tour_type_id=${tourTypeId}`, { headers: HEADERS });
  if (!res.ok) throw new Error('slots failed');
  const json = await res.json();
  return json.slots as string[];
}

export interface RequestPayload {
  name: string;
  phone: string;
  preferred_date?: string;
  preferred_time?: string;
  party_size?: number;
  notes?: string;
  turnstile_token: string;
}

export async function submitRequest(payload: RequestPayload): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/request`, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
  return res.json();
}

export interface BookPayload {
  tour_type_id: string;
  starts_at: string;
  party_size: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  turnstile_token: string;
}

export async function createBooking(payload: BookPayload): Promise<{ ok: boolean; booking_id?: string; price_cents?: number; error?: string }> {
  const res = await fetch(`${BASE}/book`, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
  return res.json();
}
