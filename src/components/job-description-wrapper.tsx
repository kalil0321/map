'use client';

import dynamic from 'next/dynamic';

const JobDescription = dynamic(() => import('./job-description').then(mod => mod.JobDescription), {
    ssr: false,
    loading: () => (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] rounded w-3/4"></div>
            <div className="h-4 bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] rounded w-full"></div>
            <div className="h-4 bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] rounded w-5/6"></div>
            <div className="h-4 bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] rounded w-4/5"></div>
        </div>
    ),
});

export function JobDescriptionClientWrapper({ description }: { description: string }) {
    return <JobDescription description={description} />;
}
