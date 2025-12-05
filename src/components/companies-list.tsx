'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import clsx from 'clsx';
import { generateCompanySlug } from '@/lib/slug-utils';
import { useDebounce } from '@/hooks/use-debounce';

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

    // Filter companies based on search
    const filteredCompanies = useMemo(() => {
        if (!debouncedSearchText?.trim()) {
            return companies;
        }

        const searchLower = debouncedSearchText.toLowerCase();
        return companies.filter(company =>
            company.name.toLowerCase().includes(searchLower)
        );
    }, [companies, debouncedSearchText]);

    return (
        <div className="space-y-3">
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
                    placeholder="Search companies..."
                    value={localSearchText}
                    onChange={(e) => setLocalSearchText(e.target.value)}
                    className={clsx(
                        'w-full px-4 py-2.5',
                        'bg-transparent border-none text-white text-[13px] outline-none',
                        'placeholder:text-white/40'
                    )}
                />
            </div>

            {/* Results count */}
            {debouncedSearchText && (
                <div className="text-[13px] text-white/60">
                    {filteredCompanies.length === 0 ? (
                        <span>No companies found matching &quot;{debouncedSearchText}&quot;</span>
                    ) : (
                        <span>
                            {filteredCompanies.length.toLocaleString()} compan{filteredCompanies.length === 1 ? 'y' : 'ies'} found
                        </span>
                    )}
                </div>
            )}

            {/* Companies Grid */}
            {filteredCompanies.length === 0 ? (
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
                    <p className="text-[14px] text-white/70 font-medium m-0 mb-1">No companies found</p>
                    <p className="text-[12px] text-white/50 m-0">Try adjusting your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCompanies.map(({ name, jobCount }) => (
                        <Link
                            key={name}
                            href={`/jobs/${generateCompanySlug(name)}`}
                            className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group no-underline"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-[14px] text-white truncate pr-4 uppercase">{name}</span>
                                <span className="text-[12px] text-white/40 group-hover:text-white/60 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                    {jobCount}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

