import type { SelectOption } from '@/components/isi-plaza/SearchableSelect';
import { isMexicoCountry, resolveGeoRegionsForStates } from '@/constants/geo-mexico';
import { fetchConsumerFilterMunicipalities } from '@/services/api/consumer';

export async function loadMunicipalityOptions(
  country: string,
  states: string[],
): Promise<SelectOption[]> {
  if (!isMexicoCountry(country) || states.length === 0) {
    return [];
  }

  const regions = resolveGeoRegionsForStates(states);
  if (regions.length === 0) {
    return [];
  }

  const lists = await Promise.all(regions.map((region) => fetchConsumerFilterMunicipalities(region)));
  const merged = [...new Set(lists.flat())].sort((a, b) => a.localeCompare(b, 'es'));

  return merged.map((name) => ({ value: name, label: name }));
}
