export type GeoRegionKey = 'cdmx' | 'edo_mex';

export type GeoRegion = {
  key: GeoRegionKey;
  label: string;
};

export const GEO_REGIONS: GeoRegion[] = [
  { key: 'cdmx', label: 'Ciudad de México' },
  { key: 'edo_mex', label: 'Estado de México' },
];

export const DEFAULT_SEARCH_RADIUS_KM = 20;

/** Alias de estados/provincias por región geo (sincronizado con config/odontica-geo.php). */
export const GEO_REGION_STATE_ALIASES: Record<GeoRegionKey, readonly string[]> = {
  cdmx: ['Ciudad de México', 'Ciudad de Mexico', 'CDMX', 'Distrito Federal'],
  edo_mex: ['Estado de México', 'Estado de Mexico', 'Edomex', 'México'],
};

function normalizeGeoToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function isMexicoCountry(country: string): boolean {
  return normalizeGeoToken(country) === 'mexico';
}

/** Resuelve regiones geo (CDMX, Edo. Mex.) a partir de estados seleccionados. */
export function resolveGeoRegionsForStates(states: string[]): GeoRegionKey[] {
  if (states.length === 0) {
    return [];
  }

  const normalizedStates = new Set(states.map(normalizeGeoToken));
  const regions: GeoRegionKey[] = [];

  for (const key of Object.keys(GEO_REGION_STATE_ALIASES) as GeoRegionKey[]) {
    const aliases = GEO_REGION_STATE_ALIASES[key];
    const matches = aliases.some((alias) => normalizedStates.has(normalizeGeoToken(alias)));
    if (matches) {
      regions.push(key);
    }
  }

  return regions;
}
