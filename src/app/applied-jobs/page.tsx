import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { AppliedJobsContent } from './applied-jobs-content';

export const metadata: Metadata = {
  title: 'Applied Jobs | Stapply',
  description: 'Track the jobs you have applied to from top tech companies.',
  keywords: [
    'applied jobs',
    'job applications',
    'job tracking',
    'tech jobs',
    'tech job search',
  ],
  openGraph: {
    title: 'Applied Jobs | Stapply',
    description: 'Track the jobs you have applied to from top tech companies.',
    type: 'website',
    url: 'https://map.stapply.ai/applied-jobs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Applied Jobs | Stapply',
    description: 'Track the jobs you have applied to from top tech companies.',
  },
};

export default function AppliedJobsPage() {
  return (
    <div className="h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif] overflow-y-auto">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pt-1 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">APPLIED JOBS</h1>
        </div>

        <AppliedJobsContent />
      </main>
    </div>
  );
}
