'use client';

import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { JobMarker } from '@/types';
import { generateJobSlug, generateCompanySlug } from '@/lib/slug-utils';
import { useDebounce } from '@/hooks/use-debounce';
import { formatJobDate, getJobDate } from '@/utils/date-format';
import { formatExperience, formatSalary } from '@/utils/salary-format';
import { SaveJobButton } from '@/components/save-job-button';
import { fuzzyMatch } from '@/utils/fuzzy-match';

interface JobListSidebarProps {
  jobs: JobMarker[];
  isOpen: boolean;
  onClose: () => void;
  onJobClick?: (job: JobMarker) => void;
  filteredJobs?: JobMarker[] | null;
}

type SortOption = 'company' | 'location' | 'title' | 'recent' | 'experience' | 'salary';

// Normalized job data structure for faster filtering
interface NormalizedJob extends JobMarker {
  _normalized: {
    titleLower: string;
    companyLower: string;
    locationLower: string;
  };
}

// Extract numeric value from experience string for sorting (e.g., "3-5 years" -> 3, "5 years" -> 5)
function getExperienceValue(experience: string | null | undefined): number {
  if (!experience) return Infinity; // Jobs without experience go to the end
  const numberMatch = experience.match(/\d+/);
  return numberMatch ? parseInt(numberMatch[0], 10) : Infinity;
}

// Extract numeric value from salary_summary for sorting
// Returns an object with value and isRange flag for proper sorting
function getSalaryValue(salarySummary: string | null | undefined): number {
  if (!salarySummary) return -1; // Jobs without salary go to the end (negative so they sort last)

  // Remove currency symbols for comparison
  const normalized = salarySummary.replace(/[$€£¥₹]/g, '');

  // Try to extract from dict format: {'unit': 'USD', 'amount': '140900.0'}
  const dictAmountMatch = normalized.match(/'amount':\s*['"]([^'"]+)['"]|"amount":\s*['"]([^'"]+)['"]/i);
  if (dictAmountMatch) {
    const amount = parseFloat(dictAmountMatch[1] || dictAmountMatch[2] || '');
    // Treat dict as single value - add 0.5 to sort after ranges
    if (!isNaN(amount)) return amount + 0.5;
  }

  // Try to extract from range format: "145,000-175,000" or "145K-175K"
  const rangeMatch = normalized.match(/([\d,]+)\s*K?\s*[-–—]\s*([\d,]+)\s*K?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    // Multiply by 1000 if K suffix is present
    if (/K/i.test(rangeMatch[0])) {
      min = min * 1000;
    }
    if (!isNaN(min)) {
      // Use min value for ranges so they sort by lower bound
      // Ranges come before single values at same min (no offset)
      return min;
    }
  }

  // Try to extract single value: "130900" or "130,900" or "145K"
  const singleMatch = normalized.match(/([\d,]+)\s*K?/i);
  if (singleMatch) {
    let amount = parseFloat(singleMatch[1].replace(/,/g, ''));
    // Multiply by 1000 if K suffix is present
    if (/K/i.test(singleMatch[0])) {
      amount = amount * 1000;
    }
    // Add 0.5 to single values so they sort after ranges with same min
    // e.g., "145K-175K" (145000) comes before "145K" (145000.5)
    if (!isNaN(amount)) return amount + 0.5;
  }

  return -1; // Could not parse, put at end
}

// Memoized job item component to prevent unnecessary re-renders
const JobItem = memo(function JobItem({
  job,
  onJobClick
}: {
  job: NormalizedJob;
  onJobClick?: (job: JobMarker) => void;
}) {
  const handleClick = useCallback(() => {
    onJobClick?.(job);
  }, [job, onJobClick]);

  return (
    <div
      className={clsx(
        'px-4 py-3.5 transition-all duration-150',
        'hover:bg-white/5 cursor-pointer',
        'w-full overflow-hidden'
      )}
      onClick={handleClick}
    >
      {/* Title, Company and Date Badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`}
              prefetch={true}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[14px] lg:text-[15px] xl:text-[16px] font-medium text-white leading-tight m-0 no-underline hover:text-blue-400 transition-colors inline-block line-clamp-2 wrap-break-word"
            >
              {job.title}
            </Link>
            {formatExperience(job.experience) && (
              <span className="text-[11px] lg:text-[12px] xl:text-[13px] text-white/50 shrink-0">
                {formatExperience(job.experience)}
              </span>
            )}
          </div>
          <Link
            href={`/company/${generateCompanySlug(job.company)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] lg:text-[12px] xl:text-[13px] font-medium text-white/50 uppercase tracking-wider no-underline hover:text-blue-400 transition-colors block w-fit mt-0.5"
          >
            {job.company}
          </Link>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {formatJobDate(job) && (
            <span
              className={clsx(
                'text-[10px] lg:text-[11px] xl:text-[12px] font-medium shrink-0 rounded-full px-[6px] py-0.5 border',
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

      {/* Location and Salary */}
      <div className="flex items-center gap-2 text-[13px] lg:text-[14px] xl:text-[15px] text-white/60 mb-0 min-w-0 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{job.location}</span>
        </div>
        {formatSalary(job) && (
          <span className="text-green-400/80 font-medium shrink-0">
            {formatSalary(job)}
          </span>
        )}
      </div>
    </div>
  );
});

export function JobListSidebar({ jobs, isOpen, onClose, onJobClick, filteredJobs }: JobListSidebarProps) {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('company');
  const parentRef = useRef<HTMLDivElement>(null);

  // Debounce search text to avoid filtering on every keystroke
  const debouncedSearchText = useDebounce(searchText, 200);

  const displayJobs = useMemo(() => {
    return filteredJobs !== null && filteredJobs !== undefined ? filteredJobs : jobs;
  }, [jobs, filteredJobs]);

  // Pre-normalize job data once (lowercase fields for faster filtering)
  const normalizedJobs = useMemo(() => {
    return displayJobs.map((job): NormalizedJob => ({
      ...job,
      _normalized: {
        titleLower: job.title.toLowerCase(),
        companyLower: job.company.toLowerCase(),
        locationLower: job.location.toLowerCase(),
      },
    }));
  }, [displayJobs]);

  // Deduplicate jobs by URL + location + ID (memoized)
  // This ensures jobs with the same URL but different locations are all shown
  // Also ensures jobs with same URL+location but different IDs are shown separately
  const deduplicatedJobs = useMemo(() => {
    const seenKeys = new Set<string>();
    const deduplicated: NormalizedJob[] = [];

    for (const job of normalizedJobs) {
      // Use ats_id or id as part of the key to distinguish jobs with same URL+location
      const jobId = job.ats_id || job.id || '';
      const uniqueKey = `${job.url}|||${job.location}|||${jobId}`;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        deduplicated.push(job);
      }
    }

    return deduplicated;
  }, [normalizedJobs]);

  // Filter and sort jobs (optimized)
  const processedJobs = useMemo(() => {
    let filtered = deduplicatedJobs;

    // Apply search filter using fuzzy matching
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      // Pre-allocate array for better performance
      filtered = filtered.filter(job => {
        const norm = job._normalized;
        return (
          fuzzyMatch(job.title, searchLower, 0.75) ||
          fuzzyMatch(job.company, searchLower, 0.75) ||
          fuzzyMatch(job.location, searchLower, 0.75)
        );
      });
    }

    // Sort jobs (optimize by avoiding array spread when not needed)
    const shouldSort = sortBy !== 'company' || debouncedSearchText.trim();
    if (shouldSort) {
      // Only create new array if we need to sort
      const sorted = [...filtered];
      switch (sortBy) {
        case 'company':
          sorted.sort((a, b) => a.company.localeCompare(b.company));
          break;
        case 'location':
          sorted.sort((a, b) => a.location.localeCompare(b.location));
          break;
        case 'title':
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'recent':
          sorted.sort((a, b) => {
            const dateA = getJobDate(a);
            const dateB = getJobDate(b);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB.getTime() - dateA.getTime(); // Newest first
          });
          break;
        case 'experience':
          sorted.sort((a, b) => {
            const expA = getExperienceValue(a.experience);
            const expB = getExperienceValue(b.experience);
            return expA - expB; // Lower experience first (entry level first)
          });
          break;
        case 'salary':
          sorted.sort((a, b) => {
            const salaryA = getSalaryValue(a.salary_summary);
            const salaryB = getSalaryValue(b.salary_summary);
            return salaryB - salaryA; // Higher salary first
          });
          break;
      }
      return sorted;
    }

    return filtered;
  }, [deduplicatedJobs, debouncedSearchText, sortBy]);

  // Group jobs by company for stats (optimized)
  const companiesCount = useMemo(() => {
    const companies = new Set<string>();
    for (const job of processedJobs) {
      companies.add(job.company);
    }
    return companies.size;
  }, [processedJobs]);

  const locationsCount = useMemo(() => {
    const locations = new Set<string>();
    for (const job of processedJobs) {
      locations.add(job.location);
    }
    return locations.size;
  }, [processedJobs]);

  // Virtual scrolling setup with dynamic sizing
  const virtualizer = useVirtualizer({
    count: processedJobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Initial estimate, will be measured dynamically
    overscan: 5, // Render 5 extra items outside viewport
    measureElement: (element) => element?.getBoundingClientRect().height ?? 120,
  });

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleJobClick = useCallback((job: JobMarker) => {
    onJobClick?.(job);
  }, [onJobClick]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-screen z-40',
          'bg-black backdrop-blur-2xl',
          'border-l border-white/10',
          'w-full md:w-[480px]',
          'flex flex-col',
          'font-[system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif]',
          'transition-transform duration-300 ease-in-out',
          'shadow-[0_8px_32px_rgba(0,0,0,0.8)]',
          {
            'translate-x-0': isOpen,
            'translate-x-full': !isOpen,
          }
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 bg-black/30">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-[15px] lg:text-[16px] xl:text-[17px] font-medium text-white m-0 tracking-[-0.01em]">
                <Link href="/jobs" className="hover:text-white/80 transition-colors">
                  All Jobs
                </Link>
              </h2>
              <p className="text-[11px] lg:text-[12px] xl:text-[13px] text-white/50 mt-1 m-0">
                {processedJobs.length.toLocaleString()} jobs • {companiesCount} companies • {locationsCount} locations
              </p>
            </div>
            <button
              onClick={onClose}
              className={clsx(
                'bg-transparent border-none rounded-md',
                'w-6 h-6 flex items-center justify-center',
                'cursor-pointer text-white/40 text-xl leading-none',
                'transition-all duration-150',
                'hover:bg-white/10 hover:text-white/80'
              )}
            >
              ×
            </button>
          </div>

          {/* Search and Sort */}
          <div className="px-5 pb-4 space-y-3">
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
                placeholder="Search jobs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5',
                  'bg-transparent border-none text-white text-[13px] lg:text-[14px] outline-none',
                  'placeholder:text-white/40'
                )}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] lg:text-[12px] xl:text-[13px] text-white/50">Sort:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'company', label: 'Company' },
                  { value: 'location', label: 'Location' },
                  { value: 'title', label: 'Title' },
                  { value: 'recent', label: 'Recent' },
                  { value: 'experience', label: 'Experience' },
                  { value: 'salary', label: 'Salary' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={clsx(
                      'px-[10px] py-1 rounded-full text-[11px] lg:text-[12px] font-medium',
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
        </div>

        {/* Job List - Virtualized */}
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto bg-black"
        >
          {processedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center py-12">
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
              <p className="text-[13px] lg:text-[14px] xl:text-[15px] text-white/70 font-medium m-0 mb-1">No jobs found</p>
              <p className="text-[11px] lg:text-[12px] xl:text-[13px] text-white/50 m-0">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const job = processedJobs[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <JobItem job={job} onJobClick={handleJobClick} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with stats */}
        {processedJobs.length > 0 && (
          <div className="shrink-0 border-t border-white/10 bg-black/30 px-5 py-3">
            <div className="text-[11px] lg:text-[12px] xl:text-[13px] text-white/50 text-center">
              <Link
                href="/jobs"
                className="hover:text-white/70 transition-colors"
              >
                Showing {processedJobs.length.toLocaleString()} of {jobs.length.toLocaleString()} jobs
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}