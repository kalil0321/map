import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { Footer } from '@/components/footer';
import { SavedJobsListClient } from '@/components/client-job-lists';

export const metadata: Metadata = {
  title: 'Saved Jobs | Stapply',
};

export default function SavedJobsPage() {
  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-[var(--bg)] text-[var(--ink)]">
      <PageHeader />

      <main className="mx-auto w-full max-w-5xl px-6 pb-16 pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Saved jobs</h1>
        </div>

        <SavedJobsListClient />
      </main>

      <Footer />
    </div>
  );
}
