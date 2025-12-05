import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { PageHeader } from '@/components/page-header';
import { AllJobsList } from '@/components/all-jobs-list';

export const metadata: Metadata = {
  title: 'Jobs at Tech Companies Worldwide | Stapply',
  description: 'Browse all tech companies and job openings on Stapply.',
};

export default async function JobsDirectoryPage() {
  try {
    const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

    return (
      <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
        <PageHeader />

        <main className="max-w-4xl mx-auto px-5 pb-6 md:pb-8 space-y-6 pt-1">
          <section className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">JOBS DIRECTORY</h1>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {jobs.length.toLocaleString()} open roles
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">All Jobs</h2>
              <p className="text-white/60 text-[14px] m-0">Browse all available job openings</p>
            </div>

            <Suspense fallback={
              <div className="space-y-3">
                <div className="bg-white/8 rounded-xl border border-white/12 h-11 animate-pulse" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 h-24 animate-pulse" />
                  ))}
                </div>
              </div>
            }>
              <AllJobsList jobs={jobs} />
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
                <p className="text-white/60 text-[14px] m-0">We could not load the jobs directory at this time.</p>
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
