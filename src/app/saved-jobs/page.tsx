import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { Footer } from '@/components/footer';
import { SavedJobsList } from '@/components/saved-jobs-list';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';

export const metadata: Metadata = {
  title: 'Saved Jobs | Stapply',
};

export default async function SavedJobsPage() {
  // Load all jobs for filtering
  const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      <PageHeader />

      <main className="mx-auto w-full max-w-5xl px-6 pb-16 pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Saved jobs</h1>
        </div>

        <SavedJobsList jobs={jobs} />
      </main>

      <Footer />
    </div>
  );
}
