'use client';

import { useState, useMemo, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useQueryState, parseAsInteger } from 'nuqs';
import clsx from 'clsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import { generateJobSlug, generateCompanySlug } from '@/lib/slug-utils';
import { formatSalary } from '@/utils/salary-format';
import { formatJobDate } from '@/utils/date-format';
import { useDebounce } from '@/hooks/use-debounce';
import { SaveJobButton } from '@/components/save-job-button';
import { addUtmParams } from '@/utils/url-utils';
import type { JobMarker } from '@/types';

type Job = JobMarker;

type SortOption = 'location' | 'title' | 'company' | 'recent';

interface AllJobsListProps {
    jobs: Job[];
    hideCompanyName?: boolean;
}

interface JobWithTimestamp extends Job {
    _dateTimestamp: number | null;
}

// Normalize string for search/filtering (trim + lowercase)
function normalizeForSearch(str: string): string {
    return str.trim().toLowerCase();
}

// Normalize string for comparison (trim only, case handled by localeCompare)
function normalizeForCompare(str: string): string {
    return str.trim();
}

// Compare two strings using normalized values
function compareStrings(a: string, b: string): number {
    return normalizeForCompare(a).localeCompare(normalizeForCompare(b), undefined, { sensitivity: 'base' });
}

export function AllJobsList({ jobs, hideCompanyName = false }: AllJobsListProps) {
    const [urlSearchText, setUrlSearchText] = useQueryState('search', {
        defaultValue: '',
        clearOnDefault: true,
    });
    const [ageFilter, setAgeFilter] = useQueryState('age', parseAsInteger.withDefault(null as any));
    const [localSearchText, setLocalSearchText] = useState(urlSearchText || '');
    const debouncedSearchText = useDebounce(localSearchText, 300);
    const [sortBy, setSortBy] = useState<SortOption>('title');
    const [isPending, startTransition] = useTransition();
    const hasJobs = jobs.length > 0;
    const parentRef = useRef<HTMLDivElement>(null);

    // Pre-compute date timestamps once to avoid repeated Date parsing
    const jobsWithTimestamps = useMemo(() => {
        return jobs.map((job): JobWithTimestamp => {
            let timestamp: number | null = null;
            if (job.posted_at) {
                try {
                    const date = new Date(job.posted_at);
                    const timeValue = date.getTime();
                    timestamp = isNaN(timeValue) ? null : timeValue;
                } catch {
                    timestamp = null;
                }
            }
            return { ...job, _dateTimestamp: timestamp };
        });
    }, [jobs]);

    // Sync local state with URL on mount or when URL changes externally
    useEffect(() => {
        setLocalSearchText(urlSearchText || '');
    }, [urlSearchText]);

    // Update URL when debounced search text changes
    useEffect(() => {
        if (debouncedSearchText !== urlSearchText) {
            setUrlSearchText(debouncedSearchText || null);
        }
    }, [debouncedSearchText, urlSearchText, setUrlSearchText]);

    // Filter and sort jobs using cached timestamps
    const processedJobs = useMemo(() => {
        let filtered: JobWithTimestamp[] = jobsWithTimestamps;

        // Apply age filter using cached timestamps (much faster than parsing dates)
        if (ageFilter !== null) {
            const cutoff = Date.now() - ageFilter * 24 * 60 * 60 * 1000;
            filtered = filtered.filter(job => {
                const timestamp = job._dateTimestamp;
                if (timestamp === null) return false;
                return timestamp >= cutoff;
            });
        }

        // Apply search filter (use debounced value)
        if (debouncedSearchText?.trim()) {
            const normalizedSearch = normalizeForSearch(debouncedSearchText);
            filtered = filtered.filter(job =>
                normalizeForSearch(job.title).includes(normalizedSearch) ||
                normalizeForSearch(job.company).includes(normalizedSearch) ||
                normalizeForSearch(job.location).includes(normalizedSearch)
            );
        }

        // Sort jobs
        const sorted = [...filtered];
        switch (sortBy) {
            case 'location':
                sorted.sort((a, b) => compareStrings(a.location, b.location));
                break;
            case 'company':
                sorted.sort((a, b) => compareStrings(a.company, b.company));
                break;
            case 'recent':
                sorted.sort((a, b) => {
                    const timestampA = a._dateTimestamp;
                    const timestampB = b._dateTimestamp;
                    if (timestampA === null && timestampB === null) return 0;
                    if (timestampA === null) return 1;
                    if (timestampB === null) return -1;
                    return timestampB - timestampA; // Newest first
                });
                break;
            case 'title':
            default:
                sorted.sort((a, b) => compareStrings(a.title, b.title));
                break;
        }

        return sorted;
    }, [jobsWithTimestamps, debouncedSearchText, sortBy, ageFilter]);

    // Cache formatted dates to avoid repeated formatting calls
    const formattedDateCache = useMemo(() => {
        const cache = new Map<string, string | null>();
        processedJobs.forEach(job => {
            const cacheKey = job.ats_id || job.id;
            if (!cache.has(cacheKey)) {
                cache.set(cacheKey, formatJobDate(job));
            }
        });
        return cache;
    }, [processedJobs]);

    // Virtualization for large lists
    const estimatedItemHeight = hideCompanyName ? 110 : 140;
    const virtualizer = useVirtualizer({
        count: processedJobs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedItemHeight,
        overscan: 5, // Render 5 extra items outside viewport
        measureElement: (element) => element?.getBoundingClientRect().height ?? estimatedItemHeight,
    });

    const handleAgeFilterChange = (value: number | null) => {
        startTransition(() => {
            setAgeFilter(value);
        });
    };

    const handleSortChange = (value: SortOption) => {
        startTransition(() => {
            setSortBy(value);
        });
    };

    return (
        <div className="space-y-3">
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
                        placeholder={hasJobs ? 'Search jobs by title, company, or location...' : 'No roles yet'}
                        value={localSearchText}
                        onChange={(e) => setLocalSearchText(e.target.value)}
                        className={clsx(
                            'w-full px-4 py-2.5',
                            'bg-transparent border-none text-white text-[13px] outline-none',
                            'placeholder:text-white/40'
                        )}
                        disabled={!hasJobs}
                    />
                </div>

                {/* Filter and Sort */}
                <div className="space-y-2">
                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/50">Posted:</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { value: null, label: 'Any time' },
                                { value: 1, label: '24h' },
                                { value: 7, label: '7 days' },
                                { value: 30, label: '30 days' },
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    onClick={() => handleAgeFilterChange(option.value)}
                                    className={clsx(
                                        'px-[10px] py-1 rounded-full text-[11px] font-medium',
                                        'transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer',
                                        ageFilter === option.value
                                            ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                                            : 'bg-white/8 border border-white/12 text-white/70 hover:bg-white/12 hover:border-white/20',
                                        isPending && 'opacity-70'
                                    )}
                                    disabled={!hasJobs || isPending}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/50">Sort:</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { value: 'title', label: 'Title' },
                                { value: 'company', label: 'Company' },
                                { value: 'location', label: 'Location' },
                                { value: 'recent', label: 'Recent' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSortChange(option.value as SortOption)}
                                    className={clsx(
                                        'px-[10px] py-1 rounded-full text-[11px] font-medium',
                                        'transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer',
                                        sortBy === option.value
                                            ? 'bg-white/12 border border-white/20 text-white'
                                            : 'bg-white/8 border border-white/12 text-white/70 hover:bg-white/12 hover:border-white/20',
                                        isPending && 'opacity-70'
                                    )}
                                    disabled={!hasJobs || isPending}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results count */}
            {debouncedSearchText && (
                <div className="text-[13px] text-white/60">
                    {processedJobs.length === 0 ? (
                        <span>No jobs found matching &quot;{debouncedSearchText}&quot;</span>
                    ) : (
                        <span>
                            {processedJobs.length.toLocaleString()} job{processedJobs.length === 1 ? '' : 's'} found
                        </span>
                    )}
                </div>
            )}

            {/* Job List */}
            <div
                ref={parentRef}
                className="h-[600px] overflow-y-auto custom-scrollbar"
            >
                {isPending ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-[14px] text-white/70 font-medium m-0">Loading jobs...</p>
                    </div>
                ) : processedJobs.length === 0 ? (
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
                        <p className="text-[12px] text-white/50 m-0">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualItem) => {
                            const job = processedJobs[virtualItem.index];
                            const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
                            const uniqueKey = job.ats_id || `${job.company}-${job.title}-${virtualItem.index}`;
                            const formattedDate = formattedDateCache.get(job.ats_id || job.id);

                            return (
                                <div
                                    key={uniqueKey}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                    className="pr-4 pt-2.5 pb-2.5 border-b border-white/5"
                                >
                                    {/* Title and Age Badge */}
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <Link
                                            href={`/jobs/${slug}`}
                                            className="text-[14px] md:text-[16px] font-medium text-white leading-normal m-0 no-underline hover:text-blue-400 transition-colors block flex-1"
                                        >
                                            {job.title}
                                        </Link>
                                        {formattedDate && (
                                            <span
                                                className={clsx(
                                                    'text-[10px] md:text-[11px] font-medium rounded-full px-[6px] py-0.5 border shrink-0',
                                                    formattedDate === 'New'
                                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                        : 'bg-white/8 text-white/70 border-white/12'
                                                )}
                                            >
                                                {formattedDate}
                                            </span>
                                        )}
                                    </div>

                                    {/* Company */}
                                    {!hideCompanyName && (
                                        <div className="text-[13px] md:text-[15px] text-white/70 mb-1.5">
                                            <Link
                                                href={`/jobs/${generateCompanySlug(job.company)}`}
                                                className="no-underline hover:text-white transition-colors"
                                            >
                                                {job.company}
                                            </Link>
                                        </div>
                                    )}

                                    {/* Location and Salary */}
                                    <div className="flex items-center gap-2 text-[10px] md:text-[15px] text-white/60 mb-2 flex-wrap">
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
                                        <SaveJobButton atsId={job.ats_id} variant="compact" />
                                        {/* <Link
                                            href={addUtmParams(job.url)}
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
                                        </Link> */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
}

