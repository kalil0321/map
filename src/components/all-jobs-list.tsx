'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import clsx from 'clsx';
import { generateJobSlug, generateCompanySlug } from '@/lib/slug-utils';
import { formatSalary } from '@/utils/salary-format';
import { useDebounce } from '@/hooks/use-debounce';
import type { JobMarker } from '@/types';

type Job = JobMarker;

type SortOption = 'location' | 'title' | 'company';

interface AllJobsListProps {
    jobs: Job[];
}

export function AllJobsList({ jobs }: AllJobsListProps) {
    const [urlSearchText, setUrlSearchText] = useQueryState('search', {
        defaultValue: '',
        clearOnDefault: true,
    });
    const [localSearchText, setLocalSearchText] = useState(urlSearchText || '');
    const debouncedSearchText = useDebounce(localSearchText, 300);
    const [sortBy, setSortBy] = useState<SortOption>('title');
    const hasJobs = jobs.length > 0;

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

    // Filter and sort jobs
    const processedJobs = useMemo(() => {
        let filtered = jobs;

        // Apply search filter (use debounced value)
        if (debouncedSearchText?.trim()) {
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
            case 'title':
            default:
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        return sorted;
    }, [jobs, debouncedSearchText, sortBy]);

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

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/50">Sort:</span>
                    <div className="flex gap-1.5 flex-wrap">
                        {[
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
                                disabled={!hasJobs}
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
                        <span>No jobs found matching &quot;{debouncedSearchText}&quot;</span>
                    ) : (
                        <span>
                            {processedJobs.length.toLocaleString()} job{processedJobs.length === 1 ? '' : 's'} found
                        </span>
                    )}
                </div>
            )}

            {/* Job List */}
            <div className="h-[600px] overflow-y-auto custom-scrollbar">
                {processedJobs.length === 0 ? (
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
                    <div className="divide-y divide-white/5">
                        {processedJobs.map((job, index) => {
                            const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
                            const uniqueKey = job.ats_id || `${job.company}-${job.title}-${index}`;
                            return (
                                <div
                                    key={uniqueKey}
                                    className="pr-4 pt-2.5 pb-2.5"
                                >
                                    {/* Title */}
                                    <Link
                                        href={`/jobs/${slug}`}
                                        className="text-[14px] md:text-[16px] font-medium text-white mb-1 leading-normal m-0 no-underline hover:text-blue-400 transition-colors block"
                                    >
                                        {job.title}
                                    </Link>

                                    {/* Company */}
                                    <div className="text-[13px] md:text-[15px] text-white/70 mb-1.5">
                                        <Link
                                            href={`/jobs/${generateCompanySlug(job.company)}`}
                                            className="no-underline hover:text-white transition-colors"
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

                                    {/* View Job Button */}
                                    <Link
                                        href={job.url}
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

