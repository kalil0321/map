

import { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { JobAlertsManager } from '@/components/job-alerts-manager';
import { ScrollablePageWrapper } from '@/components/scrollable-page-wrapper';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';

export const metadata: Metadata = {
  title: 'Job Alerts | Stapply',
};

export default async function AlertsPage() {
  // Load all jobs for filtering options
  const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

  // Extract unique companies for filter options
  const companies = Array.from(new Set(jobs.map(job => job.company))).sort();

  return (
    <ScrollablePageWrapper>
      <div className="min-h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
        <PageHeader />

        <main className="max-w-4xl mx-auto px-5 pt-1 pb-12">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em] mb-2">JOB ALERTS</h1>
            <p className="text-[14px] text-white/60">
              Get notified when new jobs matching your criteria are posted
            </p>
          </div>

          {/* Job Alerts Manager */}
          <JobAlertsManager companies={companies} />
        </main>
      </div>
    </ScrollablePageWrapper>
  );
}
