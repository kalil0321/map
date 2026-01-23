import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import distance from '@turf/distance';
import { CONTINENT_BOUNDARIES, COUNTRY_BOUNDARIES } from './geo-boundaries';

export type RemoteFilter = 'only' | 'include' | 'exclude';

export interface GeoFilter {
  type: 'continent' | 'country' | 'radius' | 'none';
  continents?: string[];      // e.g., ['north-america', 'europe']
  countries?: string[];       // e.g., ['US', 'CA', 'GB']
  radius?: {
    center: { lat: number; lng: number };
    radiusKm: number;
  };
}

/**
 * Check if a point is within a given radius of a center point
 */
export function isPointInRadius(
  lat: number,
  lng: number,
  center: { lat: number; lng: number },
  radiusKm: number
): boolean {
  const from = point([lng, lat]);
  const to = point([center.lng, center.lat]);
  const dist = distance(from, to, { units: 'kilometers' });
  return dist <= radiusKm;
}

/**
 * Check if a point is in any of the selected continents
 */
export function isPointInContinents(lat: number, lng: number, continents: string[]): boolean {
  const pt = point([lng, lat]);
  return continents.some(continent => {
    const boundary = CONTINENT_BOUNDARIES[continent];
    if (!boundary) return false;
    try {
      return booleanPointInPolygon(pt, boundary);
    } catch {
      return false;
    }
  });
}

/**
 * Check if a point is in any of the selected countries
 */
export function isPointInCountries(lat: number, lng: number, countries: string[]): boolean {
  const pt = point([lng, lat]);
  return countries.some(countryCode => {
    const boundary = COUNTRY_BOUNDARIES[countryCode];
    if (!boundary) return false;
    try {
      return booleanPointInPolygon(pt, boundary);
    } catch {
      return false;
    }
  });
}

/**
 * Main filter function - check if a job's coordinates match the geographic filter
 */
export function isJobInGeoFilter(
  lat: number,
  lng: number,
  geoFilter: GeoFilter
): boolean {
  if (geoFilter.type === 'none') return true;

  if (geoFilter.type === 'radius' && geoFilter.radius) {
    return isPointInRadius(lat, lng, geoFilter.radius.center, geoFilter.radius.radiusKm);
  }

  if (geoFilter.type === 'continent' && geoFilter.continents?.length) {
    return isPointInContinents(lat, lng, geoFilter.continents);
  }

  if (geoFilter.type === 'country' && geoFilter.countries?.length) {
    return isPointInCountries(lat, lng, geoFilter.countries);
  }

  return true;
}

/**
 * Check if a job is remote based on its location string
 */
export function isRemoteJob(location: string): boolean {
  const loc = location.toLowerCase();
  return loc.includes('remote') || loc === 'worldwide' || loc === 'global';
}

/**
 * Get default geo filter (no filtering)
 */
export function getDefaultGeoFilter(): GeoFilter {
  return { type: 'none' };
}

/**
 * Get default remote filter (include all)
 */
export function getDefaultRemoteFilter(): RemoteFilter {
  return 'include';
}
