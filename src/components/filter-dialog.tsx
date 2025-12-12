'use client';

import { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import type { JobMarker } from '@/types';

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobMarker[];
  onApplyFilters: (filters: FilterState) => void;
  searchText: string;
  onSearchTextChange: (value: string | null) => void;
}

export interface FilterState {
  companies: string[];
  locations: string[];
  searchText: string;
  postedWithin: number | null;
}

export function FilterDialog({ isOpen, onClose, jobs, onApplyFilters, searchText: urlSearchText, onSearchTextChange }: FilterDialogProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [localSearchText, setLocalSearchText] = useState(urlSearchText);
  const [companySearchText, setCompanySearchText] = useState('');
  const [locationSearchText, setLocationSearchText] = useState('');
  const [postedWithin, setPostedWithin] = useState<number | null>(null);

  // Sync local state with URL when dialog opens or when URL changes externally
  useEffect(() => {
    if (isOpen) {
      setLocalSearchText(urlSearchText);
      // Reset selections to match current applied filters
      // Note: We don't track applied companies/locations here, so we start fresh
      // The parent component should pass these if we want to show current state
    }
  }, [isOpen, urlSearchText]);

  // Extract unique companies and locations from jobs
  const { companies, locations } = useMemo(() => {
    const companiesSet = new Set<string>();
    const locationsSet = new Set<string>();

    jobs.forEach(job => {
      if (job.company) {
        const normalized = job.company.trim();
        if (normalized) companiesSet.add(normalized);
      }
      if (job.location) {
        const normalized = job.location.trim();
        if (normalized) locationsSet.add(normalized);
      }
    });

    return {
      companies: Array.from(companiesSet).sort(),
      locations: Array.from(locationsSet).sort(),
    };
  }, [jobs]);

  // Filter companies and locations based on search
  const filteredCompanies = useMemo(() => {
    if (!companySearchText) return companies;
    return companies.filter(company =>
      company.toLowerCase().includes(companySearchText.toLowerCase())
    );
  }, [companies, companySearchText]);

  const filteredLocations = useMemo(() => {
    if (!locationSearchText) return locations;
    return locations.filter(location =>
      location.toLowerCase().includes(locationSearchText.toLowerCase())
    );
  }, [locations, locationSearchText]);

  const handleCompanyToggle = (company: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(company)) {
      newSelected.delete(company);
    } else {
      newSelected.add(company);
    }
    setSelectedCompanies(newSelected);
  };

  const handleLocationToggle = (location: string) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(location)) {
      newSelected.delete(location);
    } else {
      newSelected.add(location);
    }
    setSelectedLocations(newSelected);
  };

  const handleSelectAllCompanies = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies));
    }
  };

  const handleSelectAllLocations = () => {
    if (selectedLocations.size === filteredLocations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(filteredLocations));
    }
  };

  const handleApply = () => {
    onApplyFilters({
      companies: Array.from(selectedCompanies),
      locations: Array.from(selectedLocations),
      searchText: localSearchText || '',
      postedWithin,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCompanies(new Set());
    setSelectedLocations(new Set());
    setLocalSearchText('');
    setCompanySearchText('');
    setLocationSearchText('');
    setPostedWithin(null);
  };

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

  if (!isOpen) return null;

  const activeFilterCount = selectedCompanies.size + selectedLocations.size + (postedWithin !== null ? 1 : 0) + (localSearchText ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={clsx(
          'bg-black/50 backdrop-blur-2xl',
          'border border-white/10 rounded-2xl',
          'w-full max-w-[900px] max-h-[85vh]',
          'text-white font-[system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif]',
          'flex flex-col',
          'shadow-[0_8px_32px_rgba(0,0,0,0.8)]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <h2 className="text-[15px] font-medium m-0 tracking-[-0.01em]">Filter Jobs</h2>
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
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* General Search */}
          <div className="mb-5">
            <label className="block text-[11px] font-medium text-white/50 mb-2">
              Search by keyword
            </label>
            <div
              className={clsx(
                'bg-white/8 rounded-xl border border-white/12 overflow-hidden',
                'transition-all duration-200',
                'focus-within:border-white/20 focus-within:bg-white/10'
              )}
            >
              <input
                type="text"
                placeholder="Search job titles, companies, locations..."
                value={localSearchText}
                onChange={(e) => setLocalSearchText(e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5',
                  'bg-transparent border-none text-white text-[13px] outline-none',
                  'placeholder:text-white/40'
                )}
              />
            </div>
          </div>

          {/* Age Filter */}
          <div className="mb-5">
            <label className="block text-[11px] font-medium text-white/50 mb-2">
              Posted within
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Any time', value: null },
                { label: '24h', value: 1 },
                { label: '7 days', value: 7 },
                { label: '30 days', value: 30 },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => setPostedWithin(option.value)}
                  className={clsx(
                    'px-[10px] py-1 rounded-full text-[11px] font-medium',
                    'transition-[border-color,background-color] duration-200 ease-in-out cursor-pointer',
                    postedWithin === option.value
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      : 'bg-white/8 border border-white/12 text-white/70 hover:bg-white/12 hover:border-white/20'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Companies & Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Companies */}
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-2">
                Companies {selectedCompanies.size > 0 && (
                  <span className="text-white/50">({selectedCompanies.size} selected)</span>
                )}
              </label>
              <input
                type="text"
                value={companySearchText}
                onChange={(e) => setCompanySearchText(e.target.value)}
                placeholder="Search and select companies..."
                className="w-full px-4 py-2.5 bg-white/8 rounded-xl border border-white/12 text-white text-[13px] outline-none placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-all mb-2"
              />
              <div className="h-[200px] overflow-y-auto overscroll-contain space-y-1 border border-white/8 rounded-xl p-2">
                {filteredCompanies.length === 0 ? (
                  <div className="p-4 text-center text-white/40 text-[13px]">
                    No companies found
                  </div>
                ) : (
                  filteredCompanies.map((company) => (
                    <button
                      key={company}
                      onClick={() => handleCompanyToggle(company)}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all uppercase',
                        selectedCompanies.has(company)
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                      )}
                    >
                      {company}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-2">
                Locations {selectedLocations.size > 0 && (
                  <span className="text-white/50">({selectedLocations.size} selected)</span>
                )}
              </label>
              <input
                type="text"
                value={locationSearchText}
                onChange={(e) => setLocationSearchText(e.target.value)}
                placeholder="Search and select locations..."
                className="w-full px-4 py-2.5 bg-white/8 rounded-xl border border-white/12 text-white text-[13px] outline-none placeholder:text-white/40 focus:border-blue-500/50 focus:bg-white/10 transition-all mb-2"
              />
              <div className="h-[200px] overflow-y-auto overscroll-contain space-y-1 border border-white/8 rounded-xl p-2">
                {filteredLocations.length === 0 ? (
                  <div className="p-4 text-center text-white/40 text-[13px]">
                    No locations found
                  </div>
                ) : (
                  filteredLocations.map((location) => (
                    <button
                      key={location}
                      onClick={() => handleLocationToggle(location)}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all',
                        selectedLocations.has(location)
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                      )}
                    >
                      {location}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-5 pb-4">
          <button
            onClick={handleReset}
            className={clsx(
              'px-[10px] py-1 rounded-full',
              'bg-red-500/20 border border-red-500/50',
              'text-red-400 text-[11px] font-medium',
              'hover:bg-red-500/30 hover:border-red-500/60 transition-[border-color,background-color] duration-200 cursor-pointer'
            )}
          >
            Reset All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={clsx(
                'px-[10px] py-1 rounded-full',
                'bg-white/8 border border-white/12',
                'text-white text-[11px] font-medium',
                'hover:bg-white/12 hover:border-white/20 transition-[border-color,background-color] duration-200 cursor-pointer'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className={clsx(
                'px-[10px] py-1 rounded-full text-[11px] font-medium',
                'bg-blue-500/20 border border-blue-500/50 text-blue-400',
                'hover:bg-blue-500/30 hover:border-blue-500/60',
                'transition-[border-color,background-color] duration-200 cursor-pointer'
              )}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
