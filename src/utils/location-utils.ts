import type { JobMarker } from '@/types';

/**
 * Normalize location name for lookup
 */
export function normalizeLocation(location: string): string {
  return location.toLowerCase().trim();
}

/**
 * Extract base location by normalizing variations and abbreviations
 */
export function extractLocationBase(location: string): string {
  let base = normalizeLocation(location);

  // Handle remote variations
  if (base.includes('remote')) {
    // Extract country if specified (e.g., "Remote (US)" -> "Remote - US")
    const remoteMatch = base.match(/remote\s*(?:\(([^)]+)\)|-\s*([^,]+))?/i);
    if (remoteMatch) {
      const country = remoteMatch[1] || remoteMatch[2] || '';
      return country.trim() ? `remote-${country.trim()}` : 'remote';
    }
    return 'remote';
  }

  // Handle common abbreviations
  const abbreviationMap: Record<string, string> = {
    'sf': 'san francisco',
    'nyc': 'new york',
    'ny': 'new york',
    'la': 'los angeles',
    'chi': 'chicago',
    'sea': 'seattle',
    'austin': 'austin',
    'boston': 'boston',
    'dc': 'washington dc',
    'washington d.c.': 'washington dc',
    'washington dc': 'washington dc',
  };

  // Check if location starts with abbreviation
  for (const [abbr, full] of Object.entries(abbreviationMap)) {
    const abbrPattern = new RegExp(`^${abbr}\\b`);
    if (abbrPattern.test(base)) {
      base = base.replace(abbrPattern, full);
      break;
    }
  }

  // Normalize format: remove extra commas, normalize whitespace
  base = base
    .replace(/,+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

  return base;
}

/**
 * Group jobs by normalized location
 */
export function groupLocations(jobs: JobMarker[]): Map<string, JobMarker[]> {
  const grouped = new Map<string, JobMarker[]>();

  jobs.forEach((job) => {
    const baseLocation = extractLocationBase(job.location);
    const normalizedLocation = normalizeLocation(baseLocation);

    if (!grouped.has(normalizedLocation)) {
      grouped.set(normalizedLocation, []);
    }
    grouped.get(normalizedLocation)!.push(job);
  });

  return grouped;
}

/**
 * Get statistics for each location
 */
export function getLocationStats(jobs: JobMarker[]): Array<{
  location: string;
  baseLocation: string;
  count: number;
  roles: Set<string>;
  companies: Set<string>;
  coordinates: Array<{ lat: number; lng: number }>;
}> {
  const grouped = groupLocations(jobs);
  const stats: Array<{
    location: string;
    baseLocation: string;
    count: number;
    roles: Set<string>;
    companies: Set<string>;
    coordinates: Array<{ lat: number; lng: number }>;
  }> = [];

  grouped.forEach((locationJobs, normalizedLocation) => {
    const baseLocation = locationJobs.length > 0 ? locationJobs[0].location : normalizedLocation;
    const roles = new Set(locationJobs.map(job => job.title));
    const companies = new Set(locationJobs.map(job => job.company));
    const coordinates = locationJobs
      .filter(job => !isNaN(job.lat) && !isNaN(job.lng))
      .map(job => ({ lat: job.lat, lng: job.lng }));

    stats.push({
      location: normalizedLocation,
      baseLocation,
      count: locationJobs.length,
      roles,
      companies,
      coordinates,
    });
  });

  return stats.sort((a, b) => b.count - a.count);
}


