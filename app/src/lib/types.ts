export type BookingStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed';
export type BookingSource = 'manual' | 'web_request' | 'online';
export type RequestStatus = 'new' | 'contacted' | 'converted' | 'closed';

export interface TourType {
  id: string;
  name: string;
  duration_min: number;
  max_guests: number;
  flat_rate_cents: number | null;
  flat_rate_max_party: number | null;
  per_person_cents: number | null;
  active: boolean;
  internal_notes: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
}

export interface Booking {
  id: string;
  tour_type_id: string | null;
  customer_id: string | null;
  starts_at: string; // timestamptz ISO
  party_size: number;
  status: BookingStatus;
  source: BookingSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  tour_types?: TourType | null;
  customers?: Customer | null;
}

export interface BookingRequest {
  id: string;
  name: string;
  phone: string;
  preferred_date: string | null;
  preferred_time: string | null;
  party_size: number | null;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  weekday: number; // 0 = Sunday
  start_time: string; // 'HH:MM:SS'
  end_time: string;
}

export interface BlackoutDate {
  id: string;
  day: string; // 'YYYY-MM-DD'
  reason: string | null;
}

export interface BookingRules {
  min_notice_hours: number;
  horizon_days: number;
  slot_interval_min: number;
  timezone: string;
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  min_notice_hours: 48,
  horizon_days: 90,
  slot_interval_min: 120,
  timezone: 'America/New_York',
};
