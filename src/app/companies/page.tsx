import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { PageHeader } from '@/components/page-header';
import { CompaniesList } from '@/components/companies-list';

export const metadata: Metadata = {
    title: 'Tech Companies Directory | Stapply',
    description: 'Browse all tech companies and their job openings on Stapply.',
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
            <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
                <PageHeader />

                <main className="max-w-4xl mx-auto px-5 pb-6 md:pb-8 space-y-6 pt-1">
                    <section className="space-y-4">
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">COMPANIES DIRECTORY</h1>
                        <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {sortedCompanies.length.toLocaleString()} companies
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {jobs.length.toLocaleString()} open roles
                            </span>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">All Companies</h2>
                            <p className="text-white/60 text-[14px] m-0">Browse jobs by company</p>
                        </div>

                        <Suspense fallback={
                            <div className="space-y-3">
                                <div className="bg-white/8 rounded-xl border border-white/12 h-11 animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 h-20 animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        }>
                            <CompaniesList companies={sortedCompanies} />
                        </Suspense>
                    </section>
                </main>
            </div>
        );
    } catch (error) {
        return (
            <div className="min-h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
                <PageHeader />
                <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
                    <div className="text-center max-w-md space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white/40"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Error Loading Directory</h1>
                                <p className="text-white/60 text-[14px] m-0">We could not load the companies directory at this time.</p>
                            </div>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Back to Map
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}

