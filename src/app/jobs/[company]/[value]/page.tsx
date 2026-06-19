import { redirect } from 'next/navigation';
import { addUtmParams } from '@/utils/url-utils';
import { loadJobData } from '@/utils/job-data-loader';
import { NotFoundPage } from '@/components/not-found-page';

export const revalidate = 3600;

// The in-app job detail page has been removed. Every job deep-links straight to
// the employer's ATS — we resolve the job to recover its apply URL, then 307 to it.
export default async function JobPage({ params }: { params: Promise<{ company: string; value: string }> }) {
    const { company: companySlug, value } = await params;

    let applyUrl: string | null = null;
    try {
        const jobData = await loadJobData(companySlug, value);
        applyUrl = jobData?.job?.url ? addUtmParams(jobData.job.url) : null;
    } catch {
        applyUrl = null;
    }

    if (applyUrl) {
        redirect(applyUrl);
    }

    return <JobNotFound />;
}

function JobNotFound() {
    return (
        <NotFoundPage
            title="Job not found"
            message="This job posting could not be found. It may have been deleted or is no longer available."
            actions={[
                { label: 'Browse jobs', href: '/jobs' },
                { label: 'Back to map', href: '/' },
            ]}
        />
    );
}
