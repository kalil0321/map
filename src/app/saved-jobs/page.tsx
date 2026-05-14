import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SavedJobsContent } from './saved-jobs-content';

export const metadata: Metadata = {
  title: 'Saved Jobs | Stapply',
};

export default function SavedJobsPage() {
  return (
    <div className="h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif] overflow-y-auto">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pt-1 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">SAVED JOBS</h1>
        </div>

        <SavedJobsContent />
      </main>
    </div>
  );
}
