'use client';

import { useState, useMemo, useEffect, useCallback, useRef, memo, useTransition } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { JobMarker } from '@/types';
import { generateJobSlug, generateCompanySlug } from '@/lib/slug-utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { useAppliedJobs } from '@/hooks/use-applied-jobs';
import { formatJobDate, getJobDate } from '@/utils/date-format';
import { formatExperience, formatSalary } from '@/utils/salary-format';
import { getSalaryValue, getExperienceYears } from '@/utils/job-filters';
import { SaveJobButton } from '@/components/save-job-button';
import { AppliedJobButton } from '@/components/applied-job-button';
import { SearchField } from './search-field';

interface JobListSidebarProps {
  jobs: JobMarker[];
  isOpen: boolean;
  onClose: () => void;
  onJobClick?: (job: JobMarker) => void;
  filteredJobs?: JobMarker[] | null;
}

type SortOption = 'company' | 'location' | 'title' | 'recent' | 'experience' | 'salary';
type ViewMode = 'all' | 'saved' | 'applied';

interface NormalizedJob extends JobMarker {
  _normalized: {
    titleLower: string;
    companyLower: string;
    locationLower: string;
  };
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'company', label: 'Company' },
  { value: 'recent', label: 'Recent' },
  { value: 'salary', label: 'Salary' },
  { value: 'experience', label: 'Experience' },
  { value: 'title', label: 'Title' },
  { value: 'location', label: 'Location' },
];

const pill = (active: boolean) =>
  clsx(
    'inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-medium transition-colors',
    active
      ? 'bg-[var(--violet-tint)] text-[var(--violet-deep)]'
      : 'bg-[var(--paper-3)] text-[var(--ink-soft)] hover:text-[var(--ink)]',
  );

const JobItem = memo(function JobItem({
  job,
  onJobClick,
}: {
  job: NormalizedJob;
  onJobClick?: (job: JobMarker) => void;
}) {
  const handleClick = useCallback(() => {
    onJobClick?.(job);
  }, [job, onJobClick]);

  const dateLabel = formatJobDate(job);
  const salary = formatSalary(job);
  const experience = formatExperience(job.experience);

  return (
    <div
      className="w-full cursor-pointer overflow-hidden px-5 py-3.5 transition-colors hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)]"
      onClick={handleClick}
    >
      {/* Title, company, date + actions */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={`/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`}
              prefetch
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="m-0 inline-block line-clamp-2 wrap-break-word text-[15px] font-medium leading-tight text-[var(--ink)] no-underline transition-colors hover:text-[var(--brand-deep)]"
            >
              {job.title}
            </Link>
            {experience && (
              <span className="shrink-0 text-[12px] text-[var(--ink-mute)]">{experience}</span>
            )}
          </div>
          <Link
            href={`/company/${generateCompanySlug(job.company)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 block w-fit text-[12px] font-medium uppercase tracking-wider text-[var(--ink-mute)] no-underline transition-colors hover:text-[var(--brand-deep)]"
          >
            {job.company}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {dateLabel && (
            <span
              className={clsx(
                'shrink-0 rounded-[var(--radius-pill)] px-[7px] py-0.5 text-[11px] font-medium',
                dateLabel === 'New'
                  ? 'bg-[var(--brand-tint)] text-[var(--brand-deep)]'
                  : 'bg-[var(--paper-3)] text-[var(--ink-soft)]',
              )}
            >
              {dateLabel}
            </span>
          )}
          <SaveJobButton atsId={job.ats_id} name={job.title} company={job.company} variant="icon" />
          <AppliedJobButton atsId={job.ats_id} name={job.title} company={job.company} variant="icon" />
        </div>
      </div>

      {/* Location + salary */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-[var(--ink-soft)]">
        <div className="flex min-w-0 items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{job.location}</span>
        </div>
        {salary && (
          <span className="shrink-0 font-medium text-[var(--emerald)]">{salary}</span>
        )}
      </div>
    </div>
  );
});

export function JobListSidebar({ jobs, isOpen, onClose, onJobClick, filteredJobs }: JobListSidebarProps) {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('company');
  const [view, setView] = useState<ViewMode>('all');
  const [isPending, startTransition] = useTransition();
  const parentRef = useRef<HTMLDivElement>(null);

  const { savedJobIds } = useSavedJobs();
  const { appliedJobIds } = useAppliedJobs();
  const savedSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);
  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds]);

  const debouncedSearchText = useDebounce(searchText, 300);

  const displayJobs = useMemo(() => {
    return filteredJobs !== null && filteredJobs !== undefined ? filteredJobs : jobs;
  }, [jobs, filteredJobs]);

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

  // Deduplicate by URL + location + id
  const deduplicatedJobs = useMemo(() => {
    const seenKeys = new Set<string>();
    const deduplicated: NormalizedJob[] = [];
    for (const job of normalizedJobs) {
      const jobId = job.ats_id || job.id || '';
      const uniqueKey = `${job.url}|||${job.location}|||${jobId}`;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        deduplicated.push(job);
      }
    }
    return deduplicated;
  }, [normalizedJobs]);

  const processedJobs = useMemo(() => {
    let filtered = deduplicatedJobs;

    // View: saved / applied
    if (view === 'saved') {
      filtered = filtered.filter((j) => savedSet.has(j.ats_id));
    } else if (view === 'applied') {
      filtered = filtered.filter((j) => appliedSet.has(j.ats_id));
    }

    // Search
    if (debouncedSearchText.trim()) {
      const searchTerms = debouncedSearchText.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((job) => {
        const norm = job._normalized;
        return searchTerms.every(
          (term) => norm.titleLower.includes(term) || norm.companyLower.includes(term) || norm.locationLower.includes(term),
        );
      });
    }

    // Sort
    const shouldSort = sortBy !== 'company' || debouncedSearchText.trim() || view !== 'all';
    if (shouldSort) {
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
            return dateB.getTime() - dateA.getTime();
          });
          break;
        case 'experience':
          sorted.sort((a, b) => getExperienceYears(a.experience) - getExperienceYears(b.experience));
          break;
        case 'salary':
          sorted.sort((a, b) => getSalaryValue(b.salary_summary) - getSalaryValue(a.salary_summary));
          break;
      }
      return sorted;
    }
    return filtered;
  }, [deduplicatedJobs, debouncedSearchText, sortBy, view, savedSet, appliedSet]);

  const companiesCount = useMemo(() => {
    const c = new Set<string>();
    for (const job of processedJobs) c.add(job.company);
    return c.size;
  }, [processedJobs]);

  const virtualizer = useVirtualizer({
    count: processedJobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 10,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 110,
  });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleJobClick = useCallback((job: JobMarker) => {
    onJobClick?.(job);
  }, [onJobClick]);

  const setSort = (value: SortOption) => startTransition(() => setSortBy(value));

  const VIEWS: { value: ViewMode; label: string; count?: number }[] = [
    { value: 'all', label: 'All' },
    { value: 'saved', label: 'Saved', count: savedJobIds.length },
    { value: 'applied', label: 'Applied', count: appliedJobIds.length },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      {/* Sidebar — offset below the sticky page header so content isn't hidden under it */}
      <div
        className={clsx(
          'fixed right-0 top-0 z-40 flex h-screen w-full flex-col pt-[var(--header-h)] md:w-[480px]',
          'bg-[var(--paper-2)] text-[var(--ink)]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-dotted border-[var(--line-strong)]">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <p className="m-0 text-[12px] text-[var(--ink-mute)]">
                {processedJobs.length.toLocaleString()} jobs · {companiesCount.toLocaleString()} companies
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid size-7 place-items-center rounded-md text-[var(--ink-mute)] transition-colors hover:bg-[var(--paper-3)] hover:text-[var(--ink)]"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 px-5 pb-4">
            {/* Search */}
            <SearchField value={searchText} onChange={setSearchText} placeholder="Search jobs…" />

            {/* View tabs */}
            <div className="flex items-center gap-1.5">
              {VIEWS.map((v) => (
                <button key={v.value} onClick={() => startTransition(() => setView(v.value))} className={pill(view === v.value)} disabled={isPending}>
                  {v.label}
                  {v.count != null && v.count > 0 && (
                    <span className={clsx('text-[11px]', view === v.value ? 'text-[var(--violet-deep)]' : 'text-[var(--ink-mute)]')}>
                      {v.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] text-[var(--ink-mute)]">Sort</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSort(option.value)}
                  className={clsx(pill(sortBy === option.value), isPending && 'opacity-70')}
                  disabled={isPending}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Job list (virtualized) */}
        <div ref={parentRef} className="relative flex-1 overflow-y-auto">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--paper-2)]/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="size-7 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--violet)]" />
                <p className="text-[12px] font-medium text-[var(--ink-soft)]">Updating…</p>
              </div>
            </div>
          )}

          {processedJobs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 grid size-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-3)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--ink-mute)]">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="m-0 mb-1 text-[14px] font-medium text-[var(--ink-soft)]">
                {view === 'saved' ? 'No saved jobs yet' : view === 'applied' ? 'No applied jobs yet' : 'No jobs found'}
              </p>
              <p className="m-0 text-[12px] text-[var(--ink-mute)]">
                {view === 'all' ? 'Try adjusting your search or filters' : 'Jobs you mark will show up here'}
              </p>
            </div>
          ) : (
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
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
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <JobItem job={job} onJobClick={handleJobClick} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {processedJobs.length > 0 && (
          <div className="shrink-0 border-t border-dotted border-[var(--line-strong)] px-5 py-3 text-center">
            <Link href="/jobs" className="text-[12px] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]">
              Showing {processedJobs.length.toLocaleString()} of {jobs.length.toLocaleString()} jobs
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
