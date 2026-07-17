'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useBooking } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fullDateLabel, timeLabel } from '@/lib/dates';
import { priceLabel } from '@/lib/pricing';
import type { BookingStatus } from '@/lib/types';

function BookingDetail() {
  const params = useSearchParams();
  const id = params.get('id');
  const { booking, loading, refetch } = useBooking(id);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const setStatus = async (status: BookingStatus) => {
    if (!booking) return;
    if (status === 'cancelled' && !window.confirm('Cancel this ride?')) return;
    setBusy(true);
    await supabase().from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', booking.id);
    setBusy(false);
    refetch();
  };

  if (loading) return <p className="p-4 text-marsh-600">Loading…</p>;
  if (!booking) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center">
        <p className="text-lg">Ride not found.</p>
        <button onClick={() => router.push('/calendar/')} className="mt-3 text-marsh-700 underline">
          Back to calendar
        </button>
      </div>
    );
  }

  const tour = booking.tour_types ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold">{timeLabel(booking.starts_at)}</div>
            <div className="text-marsh-600">{fullDateLabel(booking.starts_at)}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            booking.status === 'confirmed' ? 'bg-marsh-100 text-marsh-800'
            : booking.status === 'requested' ? 'bg-sand-100 text-sunset-500'
            : 'bg-gray-100 text-gray-500'
          }`}>{booking.status}</span>
        </div>
        <div className="mt-3 border-t border-marsh-50 pt-3">
          <div className="text-xl font-semibold">{booking.customers?.name ?? 'No name'}</div>
          {booking.customers?.phone && (
            <a href={`tel:${booking.customers.phone}`} className="mt-1 block text-lg text-marsh-700">
              📞 {booking.customers.phone}
            </a>
          )}
          <div className="mt-2 text-marsh-800">
            {tour?.name ?? 'Tour'} · {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
            {tour && <span className="ml-2 font-semibold">{priceLabel(tour, booking.party_size)}</span>}
          </div>
          {booking.notes && <p className="mt-2 rounded-lg bg-marsh-50 p-3 text-marsh-800">{booking.notes}</p>}
          <div className="mt-2 text-xs text-marsh-600/60">
            Source: {booking.source === 'manual' ? 'added by you' : booking.source === 'online' ? 'booked online' : 'web request'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {booking.status === 'requested' && (
          <button onClick={() => setStatus('confirmed')} disabled={busy}
            className="col-span-2 rounded-xl bg-marsh-700 py-3 text-lg font-semibold text-white disabled:opacity-50">
            ✓ Confirm ride
          </button>
        )}
        {booking.status === 'confirmed' && (
          <button onClick={() => setStatus('completed')} disabled={busy}
            className="rounded-xl bg-marsh-100 py-3 font-semibold text-marsh-800 disabled:opacity-50">
            Mark done
          </button>
        )}
        <Link href={`/new/?edit=${booking.id}`}
          className="rounded-xl bg-white py-3 text-center font-semibold text-marsh-700 shadow-sm">
          Edit
        </Link>
        {booking.status !== 'cancelled' && (
          <button onClick={() => setStatus('cancelled')} disabled={busy}
            className={`rounded-xl bg-white py-3 font-semibold text-sunset-500 shadow-sm disabled:opacity-50 ${booking.status === 'confirmed' ? '' : 'col-span-1'}`}>
            Cancel ride
          </button>
        )}
      </div>
    </div>
  );
}

export default function DeepLinkPage() {
  return (
    <AppShell title="Ride details">
      <Suspense fallback={<p className="p-4 text-marsh-600">Loading…</p>}>
        <BookingDetail />
      </Suspense>
    </AppShell>
  );
}
