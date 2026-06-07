import { getStatesForCountry } from '@/constants/location-data';
import type { ConsumerSeller } from '@/types/consumer-api';

export function parseSellerStates(state: ConsumerSeller['state']): string[] {
  if (state == null || state === '') {
    return [];
  }
  if (Array.isArray(state)) {
    return state.filter(Boolean);
  }
  if (typeof state === 'string') {
    const trimmed = state.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((s): s is string => typeof s === 'string' && s.length > 0);
        }
      } catch {
        // texto plano
      }
    }
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function sellerMatchesState(seller: ConsumerSeller, stateName: string): boolean {
  const states = parseSellerStates(seller.state);
  if (states.length === 0) {
    return stateName === 'Sin estado';
  }
  return states.includes(stateName);
}

export type SellerSection = {
  title: string;
  sellers: ConsumerSeller[];
};

export function buildSellerSections(
  sellers: ConsumerSeller[],
  countryFilter: string | null,
): SellerSection[] {
  if (countryFilter) {
    const inCountry = sellers.filter((s) => s.country === countryFilter);
    const configuredStates = getStatesForCountry(countryFilter);
    const stateTitles = (
      configuredStates.length > 0
        ? [...configuredStates]
        : [
            ...new Set(
              inCountry.flatMap((s) => {
                const parsed = parseSellerStates(s.state);
                return parsed.length > 0 ? parsed : ['Sin estado'];
              }),
            ),
          ]
    ).sort((a, b) => a.localeCompare(b, 'es'));

    return stateTitles.map((title) => ({
      title,
      sellers: inCountry.filter((s) => sellerMatchesState(s, title)),
    }));
  }

  const countryTitles = [
    ...new Set(sellers.map((s) => s.country?.trim() || 'Sin país')),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  return countryTitles.map((title) => ({
    title,
    sellers: sellers.filter((s) => (s.country?.trim() || 'Sin país') === title),
  }));
}
