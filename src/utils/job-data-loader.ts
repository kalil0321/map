import { cache } from 'react';
import { loadJobsWithCoordinatesServer } from './data-processor-server';
import { buildJobIndexCached, findJobBySlugFast, type JobIndex } from './job-index';
import type { JobMarker } from '@/types';

export type JobData = {
    job: JobMarker;
    jobIndex: JobIndex;
};

/**
 * Shared function to load job data for a specific company/value slug
 * This avoids loading the CSV twice (once for metadata, once for page)
 * Uses React's cache() for request-level deduplication
 * The CSV loading already has its own in-memory cache (5min TTL)
 */
export const loadJobData = cache(async (
    companySlug: string,
    valueSlug: string
): Promise<JobData | null> => {
    // loadJobsWithCoordinatesServer already has in-memory caching
    // React's cache() ensures this is only called once per request
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const jobIndex = buildJobIndexCached(allJobs);
    const job = findJobBySlugFast(jobIndex, companySlug, valueSlug);

    if (!job) {
        return null;
    }

    // Only return the specific job and index, not the entire array
    // This keeps the data small and avoids Next.js cache size limits
    return {
        job,
        jobIndex,
    };
});

