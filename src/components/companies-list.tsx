'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { generateCompanySlug } from '@/lib/slug-utils';
import { useDebounce } from '@/hooks/use-debounce';
import { fuzzyMatch } from '@/utils/fuzzy-match';
import { SearchField } from './search-field';

interface Company {
    name: string;
    jobCount: number;
}

interface CompaniesListProps {
    companies: Company[];
}

export function CompaniesList({ companies }: CompaniesListProps) {
    const [urlSearchText, setUrlSearchText] = useQueryState('search', {
        defaultValue: '',
        clearOnDefault: true,
    });
    const [localSearchText, setLocalSearchText] = useState(urlSearchText || '');
    const debouncedSearchText = useDebounce(localSearchText, 300);
    const isInternalUpdateRef = useRef(false);

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

    // Filter companies based on search (uses fuzzy matching for better results)
    const filteredCompanies = useMemo(() => {
        if (!debouncedSearchText?.trim()) {
            return companies;
        }

        const searchLower = debouncedSearchText.toLowerCase();
        return companies.filter(company =>
            // Use fuzzy matching since there are fewer companies
            fuzzyMatch(company.name, searchLower, 0.75)
        );
    }, [companies, debouncedSearchText]);

    return (
        <div className="space-y-4">
            <SearchField
                value={localSearchText}
                onChange={setLocalSearchText}
                placeholder="Search companies…"
            />

            {/* Results count */}
            {debouncedSearchText && (
                <div className="text-[13px] text-[var(--ink-mute)]">
                    {filteredCompanies.length === 0 ? (
                        <span>No companies match &quot;{debouncedSearchText}&quot;</span>
                    ) : (
                        <span>
                            {filteredCompanies.length.toLocaleString()} compan{filteredCompanies.length === 1 ? 'y' : 'ies'}
                        </span>
                    )}
                </div>
            )}

            {/* Companies grid */}
            {filteredCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="mb-4 grid size-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-3)]">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[var(--ink-mute)]"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </div>
                    <p className="m-0 mb-1 text-[14px] font-medium text-[var(--ink-soft)]">No companies found</p>
                    <p className="m-0 text-[12px] text-[var(--ink-mute)]">Try adjusting your search</p>
                </div>
            ) : (
                <div className="overflow-hidden">
                    {/* Internal dotted gridlines only — the -mr/-mb px pulls the
                        outermost cell borders past the clip box so just the
                        column/row dividers remain (matches the header dots). */}
                    <div className="-mb-px -mr-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCompanies.map(({ name, jobCount }) => (
                            <Link
                                key={name}
                                href={`/jobs/${generateCompanySlug(name)}`}
                                className="group border-b border-r border-dotted border-[var(--line-strong)] p-4 no-underline transition-colors hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)]"
                            >
                                <h3 className="truncate text-[15px] font-semibold uppercase leading-tight tracking-tight text-[var(--ink)]">
                                    {name}
                                </h3>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-[12px] font-medium text-[var(--ink-mute)]">
                                        {jobCount.toLocaleString()} {jobCount === 1 ? 'opening' : 'openings'}
                                    </span>
                                    <span className="text-[11px] font-medium text-[var(--ink-mute)] transition-colors group-hover:text-[var(--violet-deep)]">
                                        View →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

