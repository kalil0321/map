import { Metadata } from 'next';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { PageHeader } from '@/components/page-header';
import { Footer } from '@/components/footer';
import { NotFoundPage } from '@/components/not-found-page';
import { CompaniesList } from '@/components/companies-list';

export const metadata: Metadata = {
    title: 'Companies | Stapply',
};

export default async function CompaniesDirectoryPage() {
    try {
        const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

        // Group jobs by company
        const companyMap = new Map<string, number>();
        jobs.forEach(job => {
            const count = companyMap.get(job.company) || 0;
            companyMap.set(job.company, count + 1);
        });

        // Sort companies alphabetically and convert to array format
        const sortedCompanies = Array.from(companyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, jobCount]) => ({ name, jobCount }));

        return (
            <div className="flex h-screen flex-col overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
                <PageHeader />

                <main className="mx-auto w-full max-w-5xl space-y-8 px-6 pb-16 pt-8">
                    <header>
                        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Companies</h1>
                    </header>

                    <Suspense fallback={
                        <div className="space-y-4">
                            <div className="h-11 animate-pulse rounded-[var(--radius-pill)] border-2 border-dotted border-[var(--line-strong)] bg-[var(--paper-3)]" />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="h-[84px] animate-pulse rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--fg)_2.5%,transparent)]" />
                                ))}
                            </div>
                        </div>
                    }>
                        <CompaniesList companies={sortedCompanies} />
                    </Suspense>
                </main>

                <Footer />
            </div>
        );
    } catch (error) {
        return (
            <NotFoundPage
                title="Couldn't load companies"
                message="We could not load the companies directory at this time. Please try again."
                actions={[
                    { label: 'Back to map', href: '/' },
                    { label: 'Jobs', href: '/jobs' },
                ]}
            />
        );
    }
}

