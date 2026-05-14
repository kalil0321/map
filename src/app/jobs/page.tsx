import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { JobsContent } from './jobs-content';

export const metadata: Metadata = {
  title: 'Jobs at Tech Companies Worldwide | Stapply',
};

export default function JobsDirectoryPage() {
  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />
      <JobsContent />
    </div>
  );
}
