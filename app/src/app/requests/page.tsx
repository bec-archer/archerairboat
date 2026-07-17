'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useRequests } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { BookingRequest, RequestStatus } from '@/lib/types';

/**
 * Inbox for "Request a Ride" submissions from the website (call-first phase).
 * Elise reviews these, calls the customer, then either converts to a real
 * booking (prefilled /new form) or closes the request.
 */
export default function RequestsPage() {
  const { requests, refetch } = useRequests();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const setStatus = async (r: BookingRequest, status: RequestStatus) => {
    setBusy(r.id);
    await supabase().from('booking_requests').update({ status }).eq('id', r.id);
    setBusy(null);
    refetch();
  };

  const convert = async (r: BookingRequest) => {
    await setStatus(r, 'converted');
    const q = new URLSearchParams();
    if (r.preferred_date) q.set('date', r.preferred_date);
    router.push(`/new/?${q.toString()}&name=${encodeURIComponent(r.name)}&phone=${encodeURIComponent(r.phone)}`);
  };

  return (
    <AppShell title="Requests">
      {requests.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center">
          <div className="text-5xl">📭</div>
          <p className="mt-3 text-lg text-marsh-800">No open requests</p>
          <p className="mt-1 text-sm text-marsh-600">New website requests show up here the moment they come in.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold">{r.name}</span>
                <span className={`text-xs uppercase ${r.status === 'new' ? 'text-sunset-500' : 'text-marsh-600'}`}>{r.status}</span>
              </div>
              <a href={`tel:${r.phone}`} className="mt-0.5 block text-marsh-700">📞 {r.phone}</a>
              <div className="mt-1 text-sm text-marsh-600">
                {r.preferred_date && <>Wants: {r.preferred_date}{r.preferred_time ? ` · ${r.preferred_time}` : ''} · </>}
                {r.party_size && <>{r.party_size} guests</>}
              </div>
              {r.notes && <p className="mt-2 rounded-lg bg-marsh-50 p-2 text-sm">{r.notes}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => convert(r)} disabled={busy === r.id}
                  className="flex-1 rounded-xl bg-marsh-700 py-2 font-semibold text-white disabled:opacity-50">
                  Book it
                </button>
                {r.status === 'new' && (
                  <button onClick={() => setStatus(r, 'contacted')} disabled={busy === r.id}
                    className="flex-1 rounded-xl bg-marsh-100 py-2 font-semibold text-marsh-800 disabled:opacity-50">
                    Called them
                  </button>
                )}
                <button onClick={() => setStatus(r, 'closed')} disabled={busy === r.id}
                  className="rounded-xl bg-white px-4 py-2 text-marsh-600 shadow-sm disabled:opacity-50">
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
