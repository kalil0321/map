import { Metadata } from 'next';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateJobSlug, generateCompanySlug, slugify } from '@/lib/slug-utils';
import { generateStaticHeatmapUrl } from '@/utils/map-helpers';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';
import { Footer } from '@/components/footer';
import { NotFoundPage } from '@/components/not-found-page';

type Params = { company: string };

export const metadata: Metadata = {
    title: 'Company Jobs | Stapply',
};

export default async function JobsPage({ params }: { params: Promise<Params> }) {
    const { company } = await params;

    try {
        const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
        const matchingJobs = allJobs.filter(job => slugify(job.company) === company);

        if (matchingJobs.length === 0) {
            return <CompanyNotFound />;
        }

        const companyName = matchingJobs[0].company;
        const companySlug = generateCompanySlug(companyName);
        const locations = Array.from(new Set(matchingJobs.map(job => job.location)));

        // Generate heatmap with all job locations
        const staticMapUrl = generateStaticHeatmapUrl(
            matchingJobs.map(job => ({ lat: job.lat, lng: job.lng })),
            900,
            360
        );

        return (
            <div className="flex h-screen flex-col overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
                <PageHeader />

                {/* Content */}
                <main className="mx-auto w-full max-w-5xl space-y-8 px-6 pb-16 pt-8">
                    <header>
                        <h1 className="text-3xl font-semibold uppercase tracking-tight md:text-4xl">{companyName}</h1>
                    </header>

                    <Suspense
                        fallback={
                            <div className="space-y-4">
                                <div className="h-12 animate-pulse rounded-[var(--radius-pill)] border-2 border-dotted border-[var(--line-strong)] bg-[var(--paper-3)]" />
                                <div className="h-[640px] animate-pulse rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--fg)_2.5%,transparent)]" />
                            </div>
                        }
                    >
                        <AllJobsList jobs={matchingJobs} hideCompanyName={true} />
                    </Suspense>
                </main>

                <Footer />
            </div>
        );
    } catch (error) {
        return <CompanyNotFound />;
    }
}

function CompanyNotFound() {
    return (
        <NotFoundPage
            title="Company not found"
            message="We could not find any roles for this company."
            actions={[
                { label: 'Browse jobs', href: '/jobs' },
                { label: 'Back to map', href: '/' },
            ]}
        />
    );
}
