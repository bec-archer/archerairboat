'use client';

// Offline read cache for the operator app. The service worker caches the app
// shell; this module snapshots the last-fetched rides into the Cache API so
// "today + upcoming" render with no signal out on the water.
// Snapshot is a read-only convenience. Supabase is always the source of truth;
// on reconnect the app refetches and overwrites (never trusts stale cache).

import type { Booking } from './types';

const CACHE = 'archer-data-v1';
const KEY = '/__snapshot/bookings';

export async function saveSnapshot(bookings: Booking[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(
      KEY,
      new Response(JSON.stringify({ at: new Date().toISOString(), bookings }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch {
    // Cache API unavailable (private mode etc.) — nonfatal, we just lose offline view.
  }
}

export async function loadSnapshot(): Promise<{ at: string; bookings: Booking[] } | null> {
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(KEY);
    if (!hit) return null;
    return await hit.json();
  } catch {
    return null;
  }
}
