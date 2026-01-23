'use client';

import { useEffect, useState } from 'react';
import { SavedJobsList } from '@/components/saved-jobs-list';
import { loadJobsWithCoordinates } from '@/utils/data-processor';
import type { JobMarker } from '@/types';

export function SavedJobsContent() {
  const [jobs, setJobs] = useState<JobMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const loadedJobs = await loadJobsWithCoordinates('/ai.csv');
        setJobs(loadedJobs);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading job data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job data');
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        </div>
        <h2 className="text-[18px] text-white/90 font-medium mb-2">Error Loading Jobs</h2>
        <p className="text-[14px] text-white/60 mb-6 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="bg-white/8 rounded-xl border border-white/12 h-[42px] animate-pulse" />

        <div className="flex items-center gap-2">
          <div className="h-4 w-8 bg-white/5 rounded animate-pulse" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[28px] w-16 bg-white/8 border border-white/12 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        <div className="min-h-[400px] divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="pr-4 pt-2.5 pb-2.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-5 w-12 bg-white/8 border border-white/10 rounded-full animate-pulse shrink-0" />
              </div>

              <div className="h-4 bg-white/8 rounded w-1/3 animate-pulse" />

              <div className="flex items-center gap-2">
                <div className="h-4 bg-white/8 rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-white/8 rounded w-1/5 animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                <div className="h-7 w-24 bg-white/8 border border-white/12 rounded-full animate-pulse" />
                <div className="h-7 w-20 bg-white/8 border border-white/12 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <SavedJobsList jobs={jobs} />;
}
