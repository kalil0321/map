'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { SaveJobButton } from '@/components/save-job-button';
import { UnavailableJobCard } from '@/components/unavailable-job-card';
import { generateJobSlug, generateCompanySlug } from '@/lib/slug-utils';
import { formatJobDate, getJobDate } from '@/utils/date-format';
import { formatExperience, formatSalary } from '@/utils/salary-format';
import { useDebounce } from '@/hooks/use-debounce';
import { addUtmParams } from '@/utils/url-utils';
import type { JobMarker } from '@/types';

type SortOption = 'title' | 'company' | 'location' | 'recent';

interface SavedJobsListProps {
  jobs: JobMarker[];
}

export function SavedJobsList({ jobs }: SavedJobsListProps) {
  const { savedJobIds, unsaveJob, clearAll, isLoading } = useSavedJobs();
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Filter jobs to only those that are saved
  const savedJobs = useMemo(() => {
    return jobs.filter(job => savedJobIds.includes(job.ats_id));
  }, [jobs, savedJobIds]);

  // Find unavailable job IDs (saved but not in dataset)
  const unavailableJobIds = useMemo(() => {
    return savedJobIds.filter(id => !jobs.find(job => job.ats_id === id));
  }, [savedJobIds, jobs]);

  // Apply search and sort to available saved jobs
  const processedJobs = useMemo(() => {
    let filtered = savedJobs;

    // Apply search filter
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort jobs
    const sorted = [...filtered];
    switch (sortBy) {
      case 'location':
        sorted.sort((a, b) => a.location.localeCompare(b.location));
        break;
      case 'company':
        sorted.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          const dateA = getJobDate(a);
          const dateB = getJobDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'title':
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  }, [savedJobs, debouncedSearchText, sortBy]);

  const totalSavedCount = savedJobIds.length;
  const hasAnySavedJobs = totalSavedCount > 0;

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Search Skeleton */}
        <div className="bg-white/8 rounded-xl border border-white/12 h-[42px] animate-pulse" />

        {/* Sort Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 bg-white/5 rounded animate-pulse" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[28px] w-16 bg-white/8 border border-white/12 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Job Cards Skeleton */}
        <div className="min-h-[400px] divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="pr-4 pt-2.5 pb-2.5 space-y-2">
              {/* Title and Date */}
              <div className="flex items-start justify-between gap-3">
                <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-5 w-12 bg-white/8 border border-white/10 rounded-full animate-pulse shrink-0" />
              </div>

              {/* Company */}
              <div className="h-4 bg-white/8 rounded w-1/3 animate-pulse" />

              {/* Location and Salary */}
              <div className="flex items-center gap-2">
                <div className="h-4 bg-white/8 rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-white/8 rounded w-1/5 animate-pulse" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-20 bg-white/8 border border-white/12 rounded-full animate-pulse" />
                <div className="h-7 w-24 bg-white/8 border border-white/12 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Clear All */}
      {hasAnySavedJobs && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-white/60">
            {totalSavedCount} saved job{totalSavedCount === 1 ? '' : 's'}
          </div>
          <button
            onClick={clearAll}
            className="text-[11px] text-red-400/80 hover:text-red-400 transition-colors font-medium"
          >
            Clear All
          </button>
        </div>
      )}

      {hasAnySavedJobs && (
        <>
          {/* Search and Sort */}
          <div className="space-y-2">
            {/* Search */}
            <div
              className={clsx(
                'bg-white/8 rounded-xl border border-white/12 overflow-hidden',
                'transition-all duration-200',
                'focus-within:border-blue-500/50 focus-within:bg-white/10'
              )}
            >
              <input
                type="text"
                placeholder="Search saved jobs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5',
                  'bg-transparent border-none text-white text-[13px] outline-none',
                  'placeholder:text-white/40'
                )}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50">Sort:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'recent', label: 'Recent' },
                  { value: 'title', label: 'Title' },
                  { value: 'company', label: 'Company' },
                  { value: 'location', label: 'Location' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={clsx(
                      'px-[10px] py-1 rounded-full text-[11px] font-medium',
                      'transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer',
                      sortBy === option.value
                        ? 'bg-white/12 border border-white/20 text-white'
                        : 'bg-white/8 border border-white/12 text-white/70 hover:bg-white/12 hover:border-white/20'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count */}
          {debouncedSearchText && (
            <div className="text-[13px] text-white/60">
              {processedJobs.length === 0 ? (
                <span>No saved jobs found matching &quot;{debouncedSearchText}&quot;</span>
              ) : (
                <span>
                  {processedJobs.length} job{processedJobs.length === 1 ? '' : 's'} found
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Job List */}
      <div className="min-h-[400px]">
        {!hasAnySavedJobs ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/40"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[18px] text-white/90 font-medium mb-2">No saved jobs yet</h2>
            <p className="text-[14px] text-white/60 mb-6 max-w-sm">
              Start saving jobs you're interested in to view them here later
            </p>
            <div className="flex gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
              >
                Browse Jobs
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
              >
                View Map
              </Link>
            </div>
          </div>
        ) : processedJobs.length === 0 && !unavailableJobIds.length ? (
          // No results for search
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/40"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-[14px] text-white/70 font-medium m-0 mb-1">No jobs found</p>
            <p className="text-[12px] text-white/50 m-0">Try adjusting your search</p>
          </div>
        ) : (
          <>
            {/* Available Jobs */}
            {processedJobs.length > 0 && (
              <div className="divide-y divide-white/5">
                {processedJobs.map((job, index) => {
                  const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
                  const uniqueKey = job.ats_id || `${job.company}-${job.title}-${index}`;
                  return (
                    <div key={uniqueKey} className="pr-4 pt-2.5 pb-2.5">
                      {/* Title and Date */}
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Link
                            href={`/jobs/${slug}`}
                            prefetch={true}
                            className="text-[14px] md:text-[16px] font-medium text-white leading-normal m-0 no-underline hover:text-blue-400 transition-colors"
                          >
                            {job.title}
                          </Link>
                          {formatExperience(job.experience) && (
                            <span className="text-[12px] md:text-[13px] text-white/50 shrink-0">
                              {formatExperience(job.experience)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {formatJobDate(job) && (
                            <span
                              className={clsx(
                                'text-[10px] md:text-[11px] font-medium rounded-full px-[6px] py-0.5 border',
                                formatJobDate(job) === 'New'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  : 'bg-white/8 text-white/70 border-white/12'
                              )}
                            >
                              {formatJobDate(job)}
                            </span>
                          )}
                          <SaveJobButton atsId={job.ats_id} variant="icon" />
                        </div>
                      </div>

                      {/* Company */}
                      <div className="text-[13px] md:text-[15px] text-white/70 mb-1.5">
                        <Link
                          href={`/jobs/${generateCompanySlug(job.company)}`}
                          className="no-underline hover:text-white transition-colors uppercase"
                        >
                          {job.company}
                        </Link>
                      </div>

                      {/* Location and Salary */}
                      <div className="flex items-center gap-2 text-[13px] md:text-[15px] text-white/60 mb-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <svg
                            width="12"
                            height="12"
                            className="md:w-[14px] md:h-[14px]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {job.location}
                        </div>
                        {formatSalary(job) && (
                          <span className="text-green-400/80 font-medium">
                            {formatSalary(job)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={addUtmParams(job.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-[10px] py-0.5 bg-white/8 text-white no-underline rounded-full text-[11px] md:text-[12px] font-medium border border-white/12 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-white/12 hover:border-white/20"
                        >
                          View Job
                          <svg
                            width="10"
                            height="10"
                            className="md:w-[11px] md:h-[11px]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unavailable Jobs Section */}
            {unavailableJobIds.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-[14px] font-medium text-white/70 mb-3">
                  No Longer Available ({unavailableJobIds.length})
                </h3>
                <div className="divide-y divide-white/5">
                  {unavailableJobIds.map((atsId) => (
                    <UnavailableJobCard key={atsId} atsId={atsId} onRemove={unsaveJob} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
