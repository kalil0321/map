import Papa from 'papaparse';
import type { JobMarker } from '@/types';

export async function loadJobsWithCoordinates(filePath: string): Promise<JobMarker[]> {
  const response = await fetch(filePath);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<JobMarker & { lon?: number }>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        console.log(`CSV parsing complete. Rows: ${results.data.length}`);
        console.log('Sample row:', results.data[0]);
        console.log('CSV columns:', results.meta?.fields);

        // Convert CSV data to JobMarker format
        // Handle both 'lon' and 'lng' column names
        const markers: JobMarker[] = results.data
          .map((row: any) => {
            // Handle lat - check for number, string, or null/undefined
            let lat: number = NaN;
            if (typeof row.lat === 'number') {
              lat = row.lat;
            } else if (row.lat !== null && row.lat !== undefined && row.lat !== '') {
              const parsed = parseFloat(String(row.lat));
              if (!isNaN(parsed)) lat = parsed;
            }

            // Handle lng/lon - prefer lon (from CSV), fallback to lng
            let lng: number = NaN;
            const lonValue = row.lon !== undefined ? row.lon : row.lng;
            if (typeof lonValue === 'number') {
              lng = lonValue;
            } else if (lonValue !== null && lonValue !== undefined && lonValue !== '') {
              const parsed = parseFloat(String(lonValue));
              if (!isNaN(parsed)) lng = parsed;
            }

            const marker: JobMarker = {
              url: String(row.url || ''),
              title: String(row.title || ''),
              location: String(row.location || ''),
              company: String(row.company || ''),
              ats_id: String(row.ats_id || ''),
              // fall back to ats_id/url so every job has a stable id for deduping/keys
              id: String(row.id || row.ats_id || row.url || ''),
              lat,
              lng,
              salary_currency: row.salary_currency ? String(row.salary_currency) : null,
              salary_period: row.salary_period ? String(row.salary_period) : null,
              salary_summary: row.salary_summary ? String(row.salary_summary) : null,
              experience: row.experience ? String(row.experience) : null,
              posted_at: row.posted_at ? String(row.posted_at) : null,
              ats_type: row.ats_type ? String(row.ats_type) : null,
            };

            return marker;
          })
          .filter((marker) => {
            const isValid = !isNaN(marker.lat) && !isNaN(marker.lng) &&
              marker.lat != null && marker.lng != null &&
              isFinite(marker.lat) && isFinite(marker.lng);
            if (!isValid && results.data.length < 10) {
              console.warn(`Filtered out job with invalid coordinates: ${marker.location} (lat: ${marker.lat}, lng: ${marker.lng})`);
            }
            return isValid;
          });

        const dedupedMarkers = dedupeJobs(markers);

        console.log(`Parsed ${markers.length} markers with valid coordinates from ${results.data.length} rows`);
        console.log(`Deduped to ${dedupedMarkers.length} unique jobs (keyed by ats_id/id/url)`);
        if (dedupedMarkers.length > 0) {
          console.log('Sample marker:', dedupedMarkers[0]);
        } else {
          console.error('No valid markers found! Sample row:', results.data[0]);
        }
        resolve(dedupedMarkers);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

function dedupeJobs(markers: JobMarker[]): JobMarker[] {
  const byKey = new Map<string, JobMarker>();

  markers.forEach((marker) => {
    const key = marker.ats_id || marker.id || marker.url || `${marker.company}-${marker.title}-${marker.location}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, marker);
      return;
    }

    // Prefer the entry with the latest posted_at date if available
    const existingDate = existing.posted_at ? Date.parse(existing.posted_at) : Number.NEGATIVE_INFINITY;
    const candidateDate = marker.posted_at ? Date.parse(marker.posted_at) : Number.NEGATIVE_INFINITY;

    if (candidateDate > existingDate) {
      byKey.set(key, marker);
    }
  });

  return Array.from(byKey.values());
}


export function getLocationStats(jobs: JobMarker[]): {
  totalLocations: number;
  topLocations: Array<{ location: string; count: number }>;
  totalCompanies: number;
} {
  const locationCounts = new Map<string, number>();
  const companies = new Set<string>();

  jobs.forEach(job => {
    const loc = job.location.trim();
    locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    companies.add(job.company);
  });

  const topLocations = Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLocations: locationCounts.size,
    topLocations,
    totalCompanies: companies.size,
  };
}
