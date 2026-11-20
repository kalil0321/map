import path from 'path';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import Papa from 'papaparse';
import { cache } from 'react';
import type { JobMarker } from '@/types';

// In-memory cache for parsed CSV data
let cachedJobs: JobMarker[] | null = null;
let cachedFilePath: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// On Workers, public/ is only reachable through the static assets binding.
// next build and next dev run in Node, without a Cloudflare context.
async function readPublicFile(publicPath: string): Promise<string> {
    let assets: Fetcher | undefined;
    try {
        assets = getCloudflareContext().env.ASSETS;
    } catch {
        assets = undefined;
    }

    if (assets) {
        const response = await assets.fetch(new URL(publicPath, 'https://assets.local'));
        if (!response.ok) {
            throw new Error(`Could not read ${publicPath}: HTTP ${response.status}`);
        }
        return response.text();
    }

    const { readFile } = await import('fs/promises');
    return readFile(path.join(process.cwd(), 'public', publicPath), 'utf-8');
}

export const loadJobsWithCoordinatesServer = cache(async (filePath: string): Promise<JobMarker[]> => {
    const publicPath = `/${filePath.replace(/^\//, '')}`;
    const now = Date.now();

    if (cachedJobs && cachedFilePath === publicPath && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedJobs;
    }

    const csvText = await readPublicFile(publicPath);

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

                // Update cache
                cachedJobs = dedupedMarkers;
                cachedFilePath = publicPath;
                cacheTimestamp = now;

                resolve(dedupedMarkers);
            },
            error: (error: Error) => {
                reject(error);
            },
        });
    });
});

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


