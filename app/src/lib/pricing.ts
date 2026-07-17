import type { TourType } from './types';

/**
 * Two-tier pricing (per Bec 2026-07-17):
 * parties of 1..flat_rate_max_party pay flat_rate_cents flat;
 * larger parties pay per_person_cents * party_size.
 * Mirrors the SQL in create_online_booking; keep the two in sync.
 */
export function priceCents(tour: TourType, partySize: number): number | null {
  if (partySize < 1 || partySize > tour.max_guests) return null;
  const flatMax = tour.flat_rate_max_party ?? 0;
  if (tour.flat_rate_cents != null && partySize <= flatMax) {
    return tour.flat_rate_cents;
  }
  if (tour.per_person_cents != null) {
    return tour.per_person_cents * partySize;
  }
  // No per-person tier: flat rate covers everything it can, otherwise unpriceable.
  return tour.flat_rate_cents ?? null;
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function priceLabel(tour: TourType, partySize: number): string {
  const cents = priceCents(tour, partySize);
  return cents == null ? 'Call for price' : formatUsd(cents);
}
