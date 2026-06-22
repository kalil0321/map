'use client';

import { useEffect, useState } from 'react';
import { loadJobsWithCoordinates } from '@/utils/data-processor';
import type { JobMarker } from '@/types';
import { AllJobsList } from './all-jobs-list';
import { AppliedJobsList } from './applied-jobs-list';
import { SavedJobsList } from './saved-jobs-list';

// Fetch the full job dataset in the browser (cached by the CSV's HTTP cache),
// instead of embedding it into the server-rendered page. Keeps these pages tiny
// while pagination/search/sort continue to run client-side — same pattern as the map.
function useClientJobs(): JobMarker[] | null {
  const [jobs, setJobs] = useState<JobMarker[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadJobsWithCoordinates('/ai.csv')
      .then((j) => { if (!cancelled) setJobs(j); })
      .catch(() => { if (!cancelled) setJobs([]); });
    return () => { cancelled = true; };
  }, []);
  return jobs;
}

function LoadingJobs() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 size-7 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--violet)]" />
      <p className="m-0 text-[14px] font-medium text-[var(--ink-soft)]">Loading jobs…</p>
    </div>
  );
}

export function AllJobsListClient({ hideCompanyName }: { hideCompanyName?: boolean }) {
  const jobs = useClientJobs();
  if (!jobs) return <LoadingJobs />;
  return <AllJobsList jobs={jobs} hideCompanyName={hideCompanyName} />;
}

export function AppliedJobsListClient() {
  const jobs = useClientJobs();
  if (!jobs) return <LoadingJobs />;
  return <AppliedJobsList jobs={jobs} />;
}

export function SavedJobsListClient() {
  const jobs = useClientJobs();
  if (!jobs) return <LoadingJobs />;
  return <SavedJobsList jobs={jobs} />;
}
