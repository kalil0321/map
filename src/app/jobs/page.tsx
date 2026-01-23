import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { JobsContent } from './jobs-content';

export const metadata: Metadata = {
  title: 'Jobs at Tech Companies Worldwide | Stapply',
  description: 'Browse all tech companies and job openings on Stapply.',
  keywords: [
    'tech jobs',
    'all companies',
    'tech job search',
    'tech job alerts',
    'tech job notify',
    'AI jobs',
    'software engineering jobs',
    'tech company jobs',
    'job search',
    'tech careers',
    'remote tech jobs',
    'tech job finder',
    'all tech companies',
    'tech job directory',
  ],
  openGraph: {
    title: 'Jobs at Tech Companies Worldwide | Stapply',
    description: 'Browse all tech companies and job openings on Stapply.',
    type: 'website',
    url: 'https://map.stapply.ai/jobs',
    images: [
      {
        url: 'https://map.stapply.ai/api/og/jobs',
        width: 1200,
        height: 630,
        alt: 'Tech jobs directory map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobs at Tech Companies Worldwide | Stapply',
    description: 'Browse all tech companies and job openings on Stapply.',
    images: ['https://map.stapply.ai/api/og/jobs'],
  },
};

export default function JobsDirectoryPage() {
  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />
      <JobsContent />
    </div>
  );
}
