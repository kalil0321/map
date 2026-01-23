import { cache } from 'react';
import type { JobMarker } from '@/types';
import { generateJobSlug } from '@/lib/slug-utils';

export type JobIndex = Map<string, JobMarker>;

export function buildJobIndex(jobs: JobMarker[]): JobIndex {
    const index = new Map<string, JobMarker>();

    for (const job of jobs) {
        const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
        index.set(slug, job);
    }

    return index;
}

export function findJobBySlugFast(
    index: JobIndex,
    companySlug: string,
    valueSlug: string
): JobMarker | undefined {
    const slug = `${companySlug}/${valueSlug}`;
    return index.get(slug);
}

export const buildJobIndexCached = cache((jobs: JobMarker[]): JobIndex => {
    return buildJobIndex(jobs);
});
