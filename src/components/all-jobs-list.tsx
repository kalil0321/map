'use client';

import { useState, useMemo, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useQueryState, parseAsInteger } from 'nuqs';
import clsx from 'clsx';
import { generateJobSlug, generateCompanySlug } from '@/lib/slug-utils';
import { formatExperience, formatSalary } from '@/utils/salary-format';
import { formatJobDate } from '@/utils/date-format';
import { useDebounce } from '@/hooks/use-debounce';
import { SaveJobButton } from '@/components/save-job-button';
import { AppliedJobButton } from '@/components/applied-job-button';
import { addUtmParams } from '@/utils/url-utils';
import { fuzzyMatch } from '@/utils/fuzzy-match';
import { SearchField } from './search-field';
import { FilterDialog, type FilterState } from './filter-dialog';
import { isRemoteJob, matchesExperienceLevel, type ExperienceLevel } from '@/utils/job-filters';
import type { JobMarker } from '@/types';

type Job = JobMarker;

const pill = (active: boolean) =>
    clsx(
        'inline-flex cursor-pointer items-center rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        active
            ? 'bg-[var(--violet-tint)] text-[var(--violet-deep)]'
            : 'bg-[var(--paper-3)] text-[var(--ink-soft)] hover:text-[var(--ink)]',
    );

const PAGE_SIZE = 50;

const pageBtn = (active: boolean) =>
    clsx(
        'inline-flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-md px-2 text-[13px] font-medium transition-colors',
        active
            ? 'bg-[var(--violet-tint)] text-[var(--violet-deep)]'
            : 'text-[var(--ink-soft)] hover:bg-[var(--paper-3)] hover:text-[var(--ink)]',
    );

// Windowed page numbers: 1 … current-1 current current+1 … total
function buildPageList(current: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = new Set<number>([1, total, current, current - 1, current + 1]);
    const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (p - prev > 1) out.push('…');
        out.push(p);
        prev = p;
    }
    return out;
}

type SortOption = 'location' | 'title' | 'company' | 'recent' | 'experience' | 'salary';

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

// Parse search text to extract special syntax
interface ParsedSearch {
    age: number | null;
    company: string | null;
    location: string | null;
    generalSearch: string;
}

function parseSearchText(searchText: string): ParsedSearch {
    if (!searchText?.trim()) {
        return { age: null, company: null, location: null, generalSearch: '' };
    }

    let remainingText = searchText;
    let age: number | null = null;
    let company: string | null = null;
    let location: string | null = null;

    // Extract @age:{number}
    const ageMatch = remainingText.match(/@age:(\d+)/i);
    if (ageMatch) {
        age = parseInt(ageMatch[1], 10);
        remainingText = remainingText.replace(/@age:\d+/gi, '').trim();
    }

    // Extract @company:{company} - match until next @ tag or end of string
    // Handles spaces in company names by matching until next @ or end
    const companyMatch = remainingText.match(/@company:([^@]+?)(?=\s*@|\s*$)/i);
    if (companyMatch) {
        company = companyMatch[1].trim();
        // Remove the matched pattern, being careful with spaces
        remainingText = remainingText.replace(/@company:[^@]+?(?=\s*@|\s*$)/gi, '').trim();
    }

    // Extract @location:{location} - match until next @ tag or end of string
    // Handles spaces in location names by matching until next @ or end
    const locationMatch = remainingText.match(/@location:([^@]+?)(?=\s*@|\s*$)/i);
    if (locationMatch) {
        location = locationMatch[1].trim();
        // Remove the matched pattern, being careful with spaces
        remainingText = remainingText.replace(/@location:[^@]+?(?=\s*@|\s*$)/gi, '').trim();
    }

    return {
        age,
        company: company || null,
        location: location || null,
        generalSearch: remainingText,
    };
}

export function AllJobsList({ jobs, hideCompanyName = false }: AllJobsListProps) {
    const [urlSearchText, setUrlSearchText] = useQueryState('search', {
        defaultValue: '',
        clearOnDefault: true,
    });
    const [ageFilter, setAgeFilter] = useQueryState('age', parseAsInteger.withDefault(null as any));
    const [localSearchText, setLocalSearchText] = useState(urlSearchText || '');
    const debouncedSearchText = useDebounce(localSearchText, 300);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [isPending, startTransition] = useTransition();
    const [filterOpen, setFilterOpen] = useState(false);
    const [extra, setExtra] = useState<{
        companies: string[];
        excludeCompanies: string[];
        locations: string[];
        remoteOnly: boolean;
        minSalary: number | null;
        experience: ExperienceLevel | null;
    }>({ companies: [], excludeCompanies: [], locations: [], remoteOnly: false, minSalary: null, experience: null });
    const hasJobs = jobs.length > 0;
    const isInternalUpdateRef = useRef(false);

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

    // Sync local state with URL only when URL changes externally (not from our debounce)
    useEffect(() => {
        if (!isInternalUpdateRef.current && urlSearchText !== localSearchText) {
            setLocalSearchText(urlSearchText || '');
        }
        isInternalUpdateRef.current = false;
    }, [urlSearchText]);

    // Update URL when debounced search text changes
    useEffect(() => {
        if (debouncedSearchText !== urlSearchText) {
            isInternalUpdateRef.current = true;
            setUrlSearchText(debouncedSearchText || null);
        }
    }, [debouncedSearchText, urlSearchText, setUrlSearchText]);

    // Parse search text and sync @age with ageFilter query param
    const parsedSearch = useMemo(() => parseSearchText(debouncedSearchText || ''), [debouncedSearchText]);

    // Sync @age syntax with ageFilter query param
    useEffect(() => {
        if (parsedSearch.age !== null && parsedSearch.age !== ageFilter) {
            startTransition(() => {
                setAgeFilter(parsedSearch.age);
            });
        }
        // Note: We don't clear ageFilter when @age is removed to preserve user's button selection
    }, [parsedSearch.age, ageFilter, setAgeFilter]);

    // Filter and sort jobs using cached timestamps
    const processedJobs = useMemo(() => {
        let filtered: JobWithTimestamp[] = jobsWithTimestamps;

        // Apply age filter using cached timestamps (much faster than parsing dates)
        // Use parsedSearch.age if available, otherwise fall back to ageFilter
        const effectiveAge = parsedSearch.age !== null ? parsedSearch.age : ageFilter;
        if (effectiveAge !== null) {
            const cutoff = Date.now() - effectiveAge * 24 * 60 * 60 * 1000;
            filtered = filtered.filter(job => {
                const timestamp = job._dateTimestamp;
                if (timestamp === null) return false;
                return timestamp >= cutoff;
            });
        }

        // Apply company filter using fuzzy matching (kept for better company name matching)
        if (parsedSearch.company) {
            filtered = filtered.filter(job =>
                fuzzyMatch(job.company, parsedSearch.company!, 0.95)
            );
        }

        // Apply location filter using fast substring matching (optimized for 20k+ jobs)
        if (parsedSearch.location) {
            const locationLower = normalizeForSearch(parsedSearch.location);
            filtered = filtered.filter(job =>
                normalizeForSearch(job.location).includes(locationLower)
            );
        }

        // Apply general search filter (optimized for performance)
        if (parsedSearch.generalSearch?.trim()) {
            const generalSearchLower = normalizeForSearch(parsedSearch.generalSearch);
            const searchTerms = generalSearchLower.split(/\s+/).filter(term => term.length > 0);

            filtered = filtered.filter(job => {
                const titleLower = normalizeForSearch(job.title);
                const locationLower = normalizeForSearch(job.location);

                // All search terms must match (AND logic) for multi-word searches
                return searchTerms.every(term => {
                    // Fast substring matching for title and location
                    if (titleLower.includes(term) || locationLower.includes(term)) {
                        return true;
                    }
                    // Fuzzy matching only for company (fewer companies, more tolerance needed)
                    return fuzzyMatch(job.company, term, 0.75);
                });
            });
        }

        // Structured filters from the Filter dialog
        if (extra.companies.length > 0) {
            filtered = filtered.filter(job => extra.companies.includes(job.company));
        }
        if (extra.excludeCompanies.length > 0) {
            filtered = filtered.filter(job => !extra.excludeCompanies.includes(job.company));
        }
        if (extra.locations.length > 0) {
            filtered = filtered.filter(job => extra.locations.includes(job.location));
        }
        if (extra.remoteOnly) {
            filtered = filtered.filter(job => isRemoteJob(job));
        }
        if (extra.minSalary != null) {
            filtered = filtered.filter(job => getSalaryValue(job.salary_summary) >= extra.minSalary!);
        }
        if (extra.experience) {
            filtered = filtered.filter(job => matchesExperienceLevel(job, extra.experience!));
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
            case 'title':
            default:
                sorted.sort((a, b) => compareStrings(a.title, b.title));
                break;
        }

        return sorted;
    }, [jobsWithTimestamps, parsedSearch, sortBy, ageFilter, extra]);

    // Pagination — slice the filtered/sorted set (no nested scroll container).
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
    const totalPages = Math.max(1, Math.ceil(processedJobs.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page ?? 1), totalPages);
    const pageJobs = processedJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const topRef = useRef<HTMLDivElement>(null);

    // Reset to page 1 when the result set changes (search / sort / filters).
    const didMountRef = useRef(false);
    useEffect(() => {
        if (didMountRef.current) {
            startTransition(() => { setPage(1); });
        } else {
            didMountRef.current = true;
        }
    }, [debouncedSearchText, sortBy, ageFilter, extra, setPage]);

    const goToPage = (p: number) => {
        const next = Math.min(Math.max(1, p), totalPages);
        startTransition(() => { setPage(next); });
        topRef.current?.scrollIntoView({ block: 'start' });
    };

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

    const currentFilters: FilterState = {
        companies: extra.companies,
        excludeCompanies: extra.excludeCompanies,
        locations: extra.locations,
        geoFilter: { type: 'none' },
        searchText: localSearchText,
        postedWithin: ageFilter ?? null,
        remoteOnly: extra.remoteOnly,
        minSalary: extra.minSalary,
        experience: extra.experience,
    };

    const extraActiveCount =
        extra.companies.length +
        extra.excludeCompanies.length +
        extra.locations.length +
        (extra.remoteOnly ? 1 : 0) +
        (extra.minSalary != null ? 1 : 0) +
        (extra.experience ? 1 : 0);

    const handleApplyFilters = (f: FilterState) => {
        setExtra({
            companies: f.companies,
            excludeCompanies: f.excludeCompanies,
            locations: f.locations,
            remoteOnly: f.remoteOnly,
            minSalary: f.minSalary,
            experience: f.experience,
        });
        if (f.searchText !== localSearchText) setLocalSearchText(f.searchText);
        if (f.postedWithin !== ageFilter) {
            startTransition(() => {
                setAgeFilter(f.postedWithin);
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Search + controls */}
            <div className="space-y-3">
                <div className="flex items-stretch gap-2">
                    <SearchField
                        value={localSearchText}
                        onChange={setLocalSearchText}
                        placeholder={hasJobs ? 'Search jobs (e.g. @company:Deepmind @location:SF engineer)' : 'No roles yet'}
                        disabled={!hasJobs}
                        className="flex-1"
                    />
                    <button
                        type="button"
                        onClick={() => setFilterOpen(true)}
                        disabled={!hasJobs}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[var(--radius-pill)] border-2 border-dotted border-[var(--line-strong)] bg-[var(--paper-3)] px-4 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="7" y1="12" x2="17" y2="12" />
                            <line x1="10" y1="18" x2="14" y2="18" />
                        </svg>
                        Filter
                        {extraActiveCount > 0 && (
                            <span className="rounded-[var(--radius-pill)] bg-[var(--violet-tint)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--violet-deep)]">
                                {extraActiveCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {/* Posted */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] text-[var(--ink-mute)]">Posted</span>
                        {[
                            { value: null, label: 'Any time' },
                            { value: 1, label: '24h' },
                            { value: 7, label: '7 days' },
                            { value: 30, label: '30 days' },
                        ].map((option) => (
                            <button
                                key={option.label}
                                onClick={() => handleAgeFilterChange(option.value)}
                                className={pill(ageFilter === option.value)}
                                disabled={!hasJobs || isPending}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    {/* Sort */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] text-[var(--ink-mute)]">Sort</span>
                        {[
                            { value: 'recent', label: 'Recent' },
                            { value: 'salary', label: 'Salary' },
                            { value: 'experience', label: 'Experience' },
                            { value: 'company', label: 'Company' },
                            { value: 'title', label: 'Title' },
                            { value: 'location', label: 'Location' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSortChange(option.value as SortOption)}
                                className={pill(sortBy === option.value)}
                                disabled={!hasJobs || isPending}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Job list — single column, paginated (no nested scroll) */}
            <div ref={topRef} className="scroll-mt-4 overflow-hidden rounded-xl">
                {isPending ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 size-7 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--violet)]" />
                        <p className="m-0 text-[14px] font-medium text-[var(--ink-soft)]">Loading jobs…</p>
                    </div>
                ) : processedJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 grid size-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-3)]">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--ink-mute)]">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </div>
                        <p className="m-0 mb-1 text-[14px] font-medium text-[var(--ink-soft)]">No jobs found</p>
                        <p className="m-0 text-[12px] text-[var(--ink-mute)]">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    pageJobs.map((job, i) => {
                        const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
                        const uniqueKey = `${job.ats_id || job.id || 'unknown'}-${(currentPage - 1) * PAGE_SIZE + i}`;
                        const formattedDate = formatJobDate(job);
                        const salary = formatSalary(job);
                        const experience = formatExperience(job.experience);

                        return (
                            <div
                                key={uniqueKey}
                                className="group flex items-center justify-between gap-3 border-b border-dotted border-[var(--line-strong)] px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)]"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/jobs/${slug}`}
                                            prefetch
                                            className="truncate text-[15px] font-medium leading-tight text-[var(--ink)] no-underline transition-colors group-hover:text-[var(--violet-deep)]"
                                        >
                                            {job.title}
                                        </Link>
                                        {experience && <span className="shrink-0 text-[11px] text-[var(--ink-mute)]">{experience}</span>}
                                    </div>
                                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-[var(--ink-mute)]">
                                        {!hideCompanyName && (
                                            <>
                                                <Link
                                                    href={`/jobs/${generateCompanySlug(job.company)}`}
                                                    className="shrink-0 font-medium uppercase tracking-wide no-underline transition-colors hover:text-[var(--violet-deep)]"
                                                >
                                                    {job.company}
                                                </Link>
                                                <span className="opacity-40">·</span>
                                            </>
                                        )}
                                        <span className="flex min-w-0 items-center gap-1 text-[var(--ink-soft)]">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <span className="truncate">{job.location}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    {salary && <span className="hidden text-[12.5px] font-medium text-[var(--emerald)] sm:inline">{salary}</span>}
                                    {formattedDate && (
                                        <span
                                            className={clsx(
                                                'rounded-[var(--radius-pill)] px-[6px] py-0.5 text-[10px] font-medium',
                                                formattedDate === 'New' ? 'bg-[var(--brand-tint)] text-[var(--brand-deep)]' : 'bg-[var(--paper-3)] text-[var(--ink-soft)]',
                                            )}
                                        >
                                            {formattedDate}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                                        <a
                                            href={addUtmParams(job.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Open job posting"
                                            className="grid size-6 place-items-center rounded-md text-[var(--ink-mute)] transition-colors hover:bg-[var(--paper-3)] hover:text-[var(--ink)]"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                                            </svg>
                                        </a>
                                        <SaveJobButton atsId={job.ats_id} name={job.title} company={job.company} variant="icon" />
                                        <AppliedJobButton atsId={job.ats_id} name={job.title} company={job.company} variant="icon" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!isPending && totalPages > 1 && (
                <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-1" aria-label="Pagination">
                    <button
                        type="button"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md pl-1.5 pr-2.5 text-[13px] font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-3)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Prev
                    </button>
                    {buildPageList(currentPage, totalPages).map((p, idx) =>
                        p === '…' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-[13px] text-[var(--ink-faint)]">…</span>
                        ) : (
                            <button key={p} type="button" onClick={() => goToPage(p)} className={pageBtn(p === currentPage)} aria-current={p === currentPage ? 'page' : undefined}>
                                {p}
                            </button>
                        ),
                    )}
                    <button
                        type="button"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md pl-2.5 pr-1.5 text-[13px] font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-3)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </nav>
            )}

            <FilterDialog
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                jobs={jobs}
                current={currentFilters}
                onApplyFilters={handleApplyFilters}
            />
        </div>
    );
}
