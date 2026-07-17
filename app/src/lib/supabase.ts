'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Session lives in localStorage, but ALL booking data lives in
          // Supabase. Losing the phone loses nothing but the session cookie:
          // log back in via SMS code on any device. (Phone-overboard rule.)
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  return client;
}
