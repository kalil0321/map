'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { JobMarker } from '@/types';
import { SearchField } from './search-field';
import { LocationFilterMap } from './location-filter-map';
import {
  type FilterState,
  type ExperienceLevel,
  EMPTY_FILTERS,
  countMatches,
  countActiveFilters,
} from '@/utils/job-filters';

export type { FilterState } from '@/utils/job-filters';

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobMarker[];
  onApplyFilters: (filters: FilterState) => void;
  /** Currently-applied filters — the dialog syncs to these when it opens. */
  current: FilterState;
}

const pill = (active: boolean) =>
  clsx(
    'inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-medium transition-colors',
    active
      ? 'bg-[var(--violet-tint)] text-[var(--violet-deep)]'
      : 'bg-[var(--paper-3)] text-[var(--ink-soft)] hover:text-[var(--ink)]',
  );

const labelCls = 'block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-mute)] mb-2';

const SALARY_TIERS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: 'Has salary', value: 1 },
  { label: '$100k+', value: 100000 },
  { label: '$150k+', value: 150000 },
  { label: '$200k+', value: 200000 },
  { label: '$300k+', value: 300000 },
];

const EXPERIENCE_LEVELS: { label: string; value: ExperienceLevel | null }[] = [
  { label: 'Any', value: null },
  { label: 'Entry', value: 'entry' },
  { label: 'Mid', value: 'mid' },
  { label: 'Senior', value: 'senior' },
];

const POSTED_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any time', value: null },
  { label: '24h', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function FilterDialog({ isOpen, onClose, jobs, onApplyFilters, current }: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [companySearchText, setCompanySearchText] = useState('');

  // Sync to the currently-applied filters whenever the dialog opens.
  const currentRef = useRef(current);
  currentRef.current = current;
  useEffect(() => {
    if (isOpen) {
      setFilters(currentRef.current);
      setCompanySearchText('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const companies = useMemo(() => {
    const c = new Set<string>();
    jobs.forEach((job) => {
      const company = job.company?.trim();
      if (company) c.add(company);
    });
    return Array.from(c).sort();
  }, [jobs]);

  const filteredCompanies = useMemo(() => {
    if (!companySearchText) return companies;
    const q = companySearchText.toLowerCase();
    return companies.filter((c) => c.toLowerCase().includes(q));
  }, [companies, companySearchText]);

  const matchCount = useMemo(() => countMatches(jobs, filters), [jobs, filters]);
  const activeCount = countActiveFilters(filters);

  const toggleInArray = (key: 'companies' | 'locations', value: string) => {
    setFilters((f) => {
      const set = new Set(f[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...f, [key]: Array.from(set) };
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setCompanySearchText('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-[860px] flex-col rounded-2xl bg-[var(--paper-2)] text-[var(--ink)] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="lab-header m-0 text-[16px] font-normal tracking-tight">Filter jobs</h2>
            {activeCount > 0 && (
              <span className="rounded-[var(--radius-pill)] bg-[var(--violet-tint)] px-2 py-0.5 text-[11px] font-medium text-[var(--violet-deep)]">
                {activeCount} active
              </span>
            )}
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

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Keyword search */}
          <div>
            <label className={labelCls}>Search by keyword</label>
            <SearchField
              value={filters.searchText}
              onChange={(v) => setFilters((f) => ({ ...f, searchText: v }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
              placeholder="Title, company, location…"
              autoFocus
            />
          </div>

          {/* Quick filters */}
          <div>
            <label className={labelCls}>Quick filters</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, postedWithin: f.postedWithin === 7 ? null : 7 }))}
                className={pill(filters.postedWithin === 7)}
              >
                ✦ New
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, remoteOnly: !f.remoteOnly }))}
                className={pill(filters.remoteOnly)}
              >
                Remote
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, minSalary: f.minSalary != null ? null : 1 }))}
                className={pill(filters.minSalary != null)}
              >
                Has salary
              </button>
            </div>
          </div>

          {/* Segmented controls (click an active one to clear it) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Posted within</label>
              <div className="flex flex-wrap gap-2">
                {POSTED_OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => setFilters((f) => ({ ...f, postedWithin: f.postedWithin === o.value ? null : o.value }))}
                    className={pill(filters.postedWithin === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Experience</label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => setFilters((f) => ({ ...f, experience: f.experience === o.value ? null : o.value }))}
                    className={pill(filters.experience === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Salary</label>
              <div className="flex flex-wrap gap-2">
                {SALARY_TIERS.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => setFilters((f) => ({ ...f, minSalary: f.minSalary === o.value ? null : o.value }))}
                    className={pill(filters.minSalary === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location — interactive map (continent / country / radius) */}
          <div>
            <label className={labelCls}>Location</label>
            <LocationFilterMap
              currentFilter={filters.geoFilter}
              onFilterChange={(geoFilter) => setFilters((f) => ({ ...f, geoFilter }))}
            />
          </div>

          {/* Companies */}
          <SelectList
            title="Companies"
            placeholder="Search companies…"
            items={filteredCompanies}
            selected={filters.companies}
            searchText={companySearchText}
            onSearchChange={setCompanySearchText}
            onToggle={(v) => toggleInArray('companies', v)}
            onClear={() => setFilters((f) => ({ ...f, companies: [] }))}
            uppercase
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <button
            onClick={handleReset}
            disabled={activeCount === 0}
            className="text-[13px] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset all
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-[var(--radius-pill)] bg-[var(--paper-3)] px-4 py-1.5 text-[13px] font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="rounded-[var(--radius-pill)] bg-[var(--violet-solid)] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--violet-solid-hover)]"
            >
              Show {matchCount.toLocaleString()} {matchCount === 1 ? 'job' : 'jobs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectList({
  title,
  placeholder,
  items,
  selected,
  searchText,
  onSearchChange,
  onToggle,
  onClear,
  uppercase = false,
}: {
  title: string;
  placeholder: string;
  items: string[];
  selected: string[];
  searchText: string;
  onSearchChange: (v: string) => void;
  onToggle: (v: string) => void;
  onClear: () => void;
  uppercase?: boolean;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[13px] font-medium text-[var(--ink)]">
          {title}
          {selected.length > 0 && (
            <span className="ml-1.5 text-[var(--ink-mute)]">({selected.length})</span>
          )}
        </label>
        {selected.length > 0 && (
          <button onClick={onClear} className="text-[11px] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]">
            Clear
          </button>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex max-h-[64px] flex-wrap gap-1.5 overflow-y-auto">
          {selected.map((v) => (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--violet-tint)] px-2 py-0.5 text-[11px] font-medium text-[var(--violet-deep)]',
                uppercase && 'uppercase',
              )}
            >
              <span className="max-w-[140px] truncate">{v}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="size-3 shrink-0">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <SearchField value={searchText} onChange={onSearchChange} placeholder={placeholder} className="mb-2" />

      <div className="h-[190px] overflow-y-auto overscroll-contain rounded-xl border border-[var(--line)] p-1.5">
        {items.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-[var(--ink-mute)]">No matches</div>
        ) : (
          items.map((item) => {
            const isSelected = selectedSet.has(item);
            return (
              <button
                key={item}
                onClick={() => onToggle(item)}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors',
                  uppercase && 'uppercase',
                  isSelected
                    ? 'bg-[var(--violet-tint)] text-[var(--violet-deep)]'
                    : 'text-[var(--ink-soft)] hover:bg-[var(--paper-3)] hover:text-[var(--ink)]',
                )}
              >
                <span
                  className={clsx(
                    'grid size-[15px] shrink-0 place-items-center rounded-[4px] border transition-colors',
                    isSelected
                      ? 'border-[var(--violet-solid)] bg-[var(--violet-solid)] text-white'
                      : 'border-[var(--line-strong)]',
                  )}
                >
                  {isSelected && <CheckIcon />}
                </span>
                <span className="truncate">{item}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
