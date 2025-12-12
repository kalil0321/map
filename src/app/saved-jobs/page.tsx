import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { SocialLinks } from '@/components/social-links';
import { SavedJobsList } from '@/components/saved-jobs-list';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';

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

export default async function SavedJobsPage() {
  // Load all jobs for filtering
  const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

  return (
    <div className="min-h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pt-1">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">SAVED JOBS</h1>
        </div>

        {/* Saved Jobs List */}
        <SavedJobsList jobs={jobs} />
      </main>
    </div>
  );
}
