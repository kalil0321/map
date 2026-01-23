import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SavedJobsContent } from './saved-jobs-content';

export const metadata: Metadata = {
  title: 'Saved Jobs | Stapply',
  description: 'View and manage your saved job opportunities from top tech companies.',
  keywords: [
    'saved jobs',
    'tech jobs',
    'tech job alerts',
    'tech job notify',
    'all companies',
    'tech companies',
    'tech job search',
    'job bookmarks',
    'tech job favorites',
  ],
  openGraph: {
    title: 'Saved Jobs | Stapply',
    description: 'View and manage your saved job opportunities from top tech companies.',
    type: 'website',
    url: 'https://map.stapply.ai/saved-jobs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saved Jobs | Stapply',
    description: 'View and manage your saved job opportunities from top tech companies.',
  },
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
