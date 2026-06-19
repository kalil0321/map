import { Metadata } from 'next';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { PageHeader } from '@/components/page-header';
import { Footer } from '@/components/footer';
import { NotFoundPage } from '@/components/not-found-page';
import { AllJobsList } from '@/components/all-jobs-list';

export const metadata: Metadata = {
  title: 'Jobs | Stapply',
};

export default async function JobsDirectoryPage() {
  try {
    const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

    return (
      <div className="flex h-screen flex-col overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
        <PageHeader />

        <main className="mx-auto w-full max-w-5xl space-y-8 px-6 pb-16 pt-8">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Jobs</h1>
          </header>

          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-[var(--radius-pill)] border-2 border-dotted border-[var(--line-strong)] bg-[var(--paper-3)]" />
              <div className="h-[600px] animate-pulse rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--fg)_2.5%,transparent)]" />
            </div>
          }>
            <AllJobsList jobs={jobs} />
          </Suspense>
        </main>

        <Footer />
      </div>
    );
  } catch (error) {
    return (
      <NotFoundPage
        title="Couldn't load jobs"
        message="We could not load the jobs directory at this time. Please try again."
        actions={[
          { label: 'Back to map', href: '/' },
          { label: 'Companies', href: '/companies' },
        ]}
      />
    );
  }
}
