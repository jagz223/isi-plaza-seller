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
