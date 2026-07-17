'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { saveSnapshot, loadSnapshot } from './offline';
import {
  DEFAULT_BOOKING_RULES,
  type Booking, type BookingRequest, type BookingRules,
  type TourType, type AvailabilityRule, type BlackoutDate,
} from './types';

const BOOKING_SELECT = '*, tour_types(*), customers(*)';

/**
 * Bookings in [fromIso, toIso), kept live via Realtime.
 * Gotcha (documented in dev docs): realtime + offline cache can disagree, so
 * on any realtime event or reconnect we refetch the whole visible range
 * instead of patching state from the event payload.
 */
export function useBookings(fromIso: string, toIso: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const range = useRef({ fromIso, toIso });
  range.current = { fromIso, toIso };

  const refetch = useCallback(async () => {
    const { data, error } = await supabase()
      .from('bookings')
      .select(BOOKING_SELECT)
      .gte('starts_at', range.current.fromIso)
      .lt('starts_at', range.current.toIso)
      .order('starts_at');
    if (!error && data) {
      setBookings(data as Booking[]);
      setOffline(false);
      // Snapshot upcoming rides for offline viewing.
      saveSnapshot(data as Booking[]);
    } else if (error) {
      const snap = await loadSnapshot();
      if (snap) {
        setBookings(snap.bookings.filter(
          (b) => b.starts_at >= range.current.fromIso && b.starts_at < range.current.toIso
        ));
        setOffline(true);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch, fromIso, toIso]);

  useEffect(() => {
    const sb = supabase();
    const channel = sb
      .channel('bookings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => refetch())
      .subscribe();
    const onOnline = () => refetch();
    window.addEventListener('online', onOnline);
    return () => {
      sb.removeChannel(channel);
      window.removeEventListener('online', onOnline);
    };
  }, [refetch]);

  return { bookings, loading, offline, refetch };
}

export function useBooking(id: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    const { data } = await supabase().from('bookings').select(BOOKING_SELECT).eq('id', id).maybeSingle();
    setBooking((data as Booking) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);
  return { booking, loading, refetch };
}

export function useTourTypes(activeOnly = false) {
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const refetch = useCallback(async () => {
    let q = supabase().from('tour_types').select('*').order('name');
    if (activeOnly) q = q.eq('active', true);
    const { data } = await q;
    if (data) setTourTypes(data as TourType[]);
  }, [activeOnly]);
  useEffect(() => { refetch(); }, [refetch]);
  return { tourTypes, refetch };
}

export function useRules() {
  const [rules, setRules] = useState<BookingRules>(DEFAULT_BOOKING_RULES);
  const [goLive, setGoLive] = useState(false);
  const refetch = useCallback(async () => {
    const { data } = await supabase().from('settings').select('key, value');
    if (data) {
      for (const row of data) {
        if (row.key === 'booking_rules') setRules({ ...DEFAULT_BOOKING_RULES, ...(row.value as BookingRules) });
        if (row.key === 'online_booking_enabled') setGoLive(row.value === true);
      }
    }
  }, []);
  useEffect(() => { refetch(); }, [refetch]);
  return { rules, goLive, refetch };
}

export function useAvailability() {
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([]);
  const refetch = useCallback(async () => {
    const sb = supabase();
    const [a, b] = await Promise.all([
      sb.from('availability_rules').select('*').order('weekday').order('start_time'),
      sb.from('blackout_dates').select('*').gte('day', new Date().toISOString().slice(0, 10)).order('day'),
    ]);
    if (a.data) setAvailability(a.data as AvailabilityRule[]);
    if (b.data) setBlackouts(b.data as BlackoutDate[]);
  }, []);
  useEffect(() => { refetch(); }, [refetch]);
  return { availability, blackouts, refetch };
}

export function useRequests() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const refetch = useCallback(async () => {
    const { data } = await supabase()
      .from('booking_requests').select('*')
      .in('status', ['new', 'contacted'])
      .order('created_at', { ascending: false });
    if (data) setRequests(data as BookingRequest[]);
  }, []);
  useEffect(() => {
    refetch();
    const sb = supabase();
    const channel = sb
      .channel('requests-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests' }, () => refetch())
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [refetch]);
  return { requests, refetch };
}
