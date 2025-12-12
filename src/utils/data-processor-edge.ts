import Papa from 'papaparse';
import type { JobMarker } from '@/types';

/**
 * Edge-compatible version of loadJobsWithCoordinatesServer
 * Uses fetch instead of fs for Edge runtime compatibility
 */
export async function loadJobsWithCoordinatesEdge(filePath: string): Promise<JobMarker[]> {
  // For edge runtime, we need to use fetch to load the file
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cleanPath = filePath.replace(/^\//, '');
  const fileUrl = `${baseUrl}/${cleanPath}`;

  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV file: ${fileUrl}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<JobMarker & { lon?: number }>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
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

            return {
              url: String(row.url || ''),
              title: String(row.title || ''),
              location: String(row.location || ''),
              company: String(row.company || ''),
              ats_id: String(row.ats_id || ''),
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
          })
          .filter((marker) => {
            const isValid = !isNaN(marker.lat) && !isNaN(marker.lng) &&
              marker.lat != null && marker.lng != null &&
              isFinite(marker.lat) && isFinite(marker.lng);
            return isValid;
          });

        const dedupedMarkers = dedupeJobs(markers);

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

    const existingDate = existing.posted_at ? Date.parse(existing.posted_at) : Number.NEGATIVE_INFINITY;
    const candidateDate = marker.posted_at ? Date.parse(marker.posted_at) : Number.NEGATIVE_INFINITY;

    if (candidateDate > existingDate) {
      byKey.set(key, marker);
    }
  });

  return Array.from(byKey.values());
}

