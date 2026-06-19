'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useAppliedJobs } from '@/hooks/use-applied-jobs';
import { AppliedJobButton } from '@/components/applied-job-button';
import { UnavailableJobCard } from '@/components/unavailable-job-card';
import { generateJobSlug } from '@/lib/slug-utils';
import { formatJobDate, getJobDate } from '@/utils/date-format';
import { formatExperience, formatSalary } from '@/utils/salary-format';
import { useDebounce } from '@/hooks/use-debounce';
import { addUtmParams } from '@/utils/url-utils';
import { matchesSearchTerm } from '@/utils/search-utils';
import type { JobMarker } from '@/types';

type SortOption = 'applied' | 'title' | 'company' | 'location' | 'recent';

interface AppliedJobsListProps {
  jobs: JobMarker[];
}

function formatAppliedDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAppliedInputDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toIsoFromDateInput(value: string): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export function AppliedJobsList({ jobs }: AppliedJobsListProps) {
  const { appliedJobIds, appliedJobs, unmarkApplied, updateAppliedDate, clearAll, isLoading } = useAppliedJobs();
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);
  const [sortBy, setSortBy] = useState<SortOption>('applied');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');

  const appliedJobsMap = useMemo(() => {
    return new Map(appliedJobs.map(job => [job.ats_id, job]));
  }, [appliedJobs]);

  const availableAppliedJobs = useMemo(() => {
    return jobs.filter(job => appliedJobIds.includes(job.ats_id));
  }, [jobs, appliedJobIds]);

  const unavailableJobs = useMemo(() => {
    return appliedJobs.filter(appliedJob => !jobs.find(job => job.ats_id === appliedJob.ats_id));
  }, [appliedJobs, jobs]);

  const processedJobs = useMemo(() => {
    let filtered = availableAppliedJobs;

    if (debouncedSearchText.trim()) {
      const searchTerms = debouncedSearchText.toLowerCase().split(/\s+/).filter(term => term.length > 0);

      filtered = filtered.filter(job => {
        return searchTerms.every(term =>
          matchesSearchTerm(job.title, term) ||
          matchesSearchTerm(job.company, term) ||
          matchesSearchTerm(job.location, term)
        );
      });
    }

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
      case 'applied':
        sorted.sort((a, b) => {
          const appliedA = appliedJobsMap.get(a.ats_id)?.applied_at;
          const appliedB = appliedJobsMap.get(b.ats_id)?.applied_at;
          const timeA = appliedA ? Date.parse(appliedA) : Number.NEGATIVE_INFINITY;
          const timeB = appliedB ? Date.parse(appliedB) : Number.NEGATIVE_INFINITY;
          return timeB - timeA;
        });
        break;
      case 'title':
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  }, [availableAppliedJobs, debouncedSearchText, sortBy, appliedJobsMap]);

  const totalAppliedCount = appliedJobIds.length;
  const hasAnyAppliedJobs = totalAppliedCount > 0;

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

  return (
    <div className="space-y-3">
      {hasAnyAppliedJobs && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-white/60">
            {totalAppliedCount} applied job{totalAppliedCount === 1 ? '' : 's'}
          </div>
          <button
            onClick={clearAll}
            className="text-[11px] text-red-400/80 hover:text-red-400 transition-colors font-medium"
          >
            Clear All
          </button>
        </div>
      )}

      {hasAnyAppliedJobs && (
        <>
          <div className="space-y-2">
            <div
              className={clsx(
                'bg-white/8 rounded-xl border border-white/12 overflow-hidden',
                'transition-all duration-200',
                'focus-within:border-white/30 focus-within:bg-white/10'
              )}
            >
              <input
                type="text"
                placeholder="Search applied jobs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5',
                  'bg-transparent border-none text-white text-[13px] outline-none',
                  'placeholder:text-white/40'
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50">Sort:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'applied', label: 'Applied' },
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

          {debouncedSearchText && (
            <div className="text-[13px] text-white/60">
              {processedJobs.length === 0 ? (
                <span>No applied jobs found matching &quot;{debouncedSearchText}&quot;</span>
              ) : (
                <span>
                  {processedJobs.length} job{processedJobs.length === 1 ? '' : 's'} found
                </span>
              )}
            </div>
          )}
        </>
      )}

      <div className="min-h-[400px]">
        {!hasAnyAppliedJobs ? (
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
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-[18px] text-white/90 font-medium mb-2">No applied jobs yet</h2>
            <p className="text-[14px] text-white/60 mb-6 max-w-sm">
              Mark jobs as applied to track your progress here
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
        ) : processedJobs.length === 0 && !unavailableJobs.length ? (
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
            {processedJobs.length > 0 && (
              <div className="divide-y divide-white/5">
                {processedJobs.map((job, index) => {
                  const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
                  const uniqueKey = job.ats_id || `${job.company}-${job.title}-${index}`;
                  const appliedAt = appliedJobsMap.get(job.ats_id)?.applied_at;
                  const appliedDate = formatAppliedDate(appliedAt);
                  const isEditing = editingJobId === job.ats_id;

                  return (
                    <div key={uniqueKey} className="pr-4 pt-2.5 pb-2.5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Link
                            href={`/jobs/${slug}`}
                            prefetch={false}
                            className="text-[14px] md:text-[16px] font-medium text-white leading-normal m-0 no-underline hover:text-white/80 transition-colors"
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
                          {appliedDate && !isEditing && (
                            <span className="text-[10px] md:text-[11px] font-medium rounded-full px-[6px] py-0.5 border bg-white/8 text-white/70 border-white/12">
                              Applied {appliedDate}
                            </span>
                          )}
                          <AppliedJobButton atsId={job.ats_id} name={job.title} company={job.company} variant="icon" />
                        </div>
                      </div>

                      <div className="text-[13px] md:text-[15px] text-white/70 mb-1.5">
                        <span className="uppercase">
                          {job.company}
                        </span>
                      </div>

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

                      <div className="flex items-center gap-2 flex-wrap">
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
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingJobId(job.ats_id);
                                setEditDateValue(formatAppliedInputDate(appliedAt));
                              }}
                              className="inline-flex items-center gap-1 px-[10px] py-0.5 bg-white/8 text-white rounded-full text-[11px] md:text-[12px] font-medium border border-white/12 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-white/12 hover:border-white/20"
                            >
                              Edit date
                            </button>
                            <button
                              onClick={() => unmarkApplied(job.ats_id)}
                              className="inline-flex items-center gap-1 px-[10px] py-0.5 bg-white/8 text-white rounded-full text-[11px] md:text-[12px] font-medium border border-white/12 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editDateValue}
                              onChange={(e) => setEditDateValue(e.target.value)}
                              className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[11px] md:text-[12px] border border-white/12"
                            />
                            <button
                              onClick={() => {
                                updateAppliedDate(job.ats_id, toIsoFromDateInput(editDateValue));
                                setEditingJobId(null);
                              }}
                              className="inline-flex items-center gap-1 px-[10px] py-0.5 bg-white/8 text-white rounded-full text-[11px] md:text-[12px] font-medium border border-white/12 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-white/12 hover:border-white/20"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingJobId(null);
                                setEditDateValue('');
                              }}
                              className="inline-flex items-center gap-1 px-[10px] py-0.5 bg-white/8 text-white rounded-full text-[11px] md:text-[12px] font-medium border border-white/12 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-white/12 hover:border-white/20"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {unavailableJobs.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-[14px] font-medium text-white/70 mb-3">
                  No Longer Available ({unavailableJobs.length})
                </h3>
                <div className="divide-y divide-white/5">
                  {unavailableJobs.map((appliedJob) => (
                    <UnavailableJobCard
                      key={appliedJob.ats_id}
                      atsId={appliedJob.ats_id}
                      name={appliedJob.name}
                      company={appliedJob.company}
                      onRemove={unmarkApplied}
                    />
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
