'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { JobMap } from '@/components/job-map';
import { LoadingScreen } from '@/components/loading-screen';
import { PageHeader } from '@/components/page-header';
import { FilterDialog, type FilterState } from '@/components/filter-dialog';
import { JobListSidebar } from '@/components/job-list-sidebar';
import { loadJobsWithCoordinates, getLocationStats } from '@/utils/data-processor';
import type { JobMarker } from '@/types';
import { MAPBOX_TOKEN } from '@/lib/config';
import type { MapControlCallbacks } from '@/utils/map-control';
import { Analytics } from '@vercel/analytics/react';
import { matchesFilters, type ExperienceLevel } from '@/utils/job-filters';
import { getDefaultGeoFilter, type GeoFilter } from '@/utils/geo-filter';

function HomeContent() {
  const [jobMarkers, setJobMarkers] = useState<JobMarker[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [filteredJobs, setFilteredJobs] = useState<JobMarker[] | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isJobListOpen, setIsJobListOpen] = useState(false);
  const mapControlCallbacksRef = useRef<MapControlCallbacks | null>(null);

  // URL query state for search
  const [urlSearchText, setUrlSearchText] = useQueryState('search', {
    defaultValue: '',
    clearOnDefault: true,
  });

  // URL query state for age filter
  const [ageFilter, setAgeFilter] = useQueryState('age', parseAsInteger);

  // Track applied filters (search + age come from the URL)
  const [appliedFilters, setAppliedFilters] = useState<{
    companies: string[];
    excludeCompanies: string[];
    locations: string[];
    geoFilter: GeoFilter;
    remoteOnly: boolean;
    minSalary: number | null;
    experience: ExperienceLevel | null;
  }>({
    companies: [],
    excludeCompanies: [],
    locations: [],
    geoFilter: getDefaultGeoFilter(),
    remoteOnly: false,
    minSalary: null,
    experience: null,
  });

  const hasActiveFilters =
    appliedFilters.companies.length > 0 ||
    appliedFilters.excludeCompanies.length > 0 ||
    appliedFilters.locations.length > 0 ||
    appliedFilters.geoFilter.type !== 'none' ||
    appliedFilters.remoteOnly ||
    appliedFilters.minSalary != null ||
    appliedFilters.experience != null ||
    !!urlSearchText ||
    ageFilter != null;

  // Build the FilterState the dialog syncs to when it opens.
  const currentFilters: FilterState = {
    companies: appliedFilters.companies,
    excludeCompanies: appliedFilters.excludeCompanies,
    locations: appliedFilters.locations,
    geoFilter: appliedFilters.geoFilter,
    searchText: urlSearchText || '',
    postedWithin: ageFilter ?? null,
    remoteOnly: appliedFilters.remoteOnly,
    minSalary: appliedFilters.minSalary,
    experience: appliedFilters.experience,
  };

  const handleMapControlReady = useCallback((callbacks: MapControlCallbacks) => {
    mapControlCallbacksRef.current = callbacks;
  }, []);

  const applyFilters = useCallback((filters: FilterState) => {
    const filtered = jobMarkers.filter((job) => matchesFilters(job, filters));
    setFilteredJobs(filtered.length < jobMarkers.length ? filtered : null);
  }, [jobMarkers]);

  const handleApplyFilters = useCallback((filters: FilterState) => {
    setAppliedFilters({
      companies: filters.companies,
      excludeCompanies: filters.excludeCompanies,
      locations: filters.locations,
      geoFilter: filters.geoFilter,
      remoteOnly: filters.remoteOnly,
      minSalary: filters.minSalary,
      experience: filters.experience,
    });

    // Sync search text to URL if different
    if (filters.searchText !== urlSearchText) {
      setUrlSearchText(filters.searchText || null);
    }

    // Sync age filter to URL if different
    if (filters.postedWithin !== ageFilter) {
      setAgeFilter(filters.postedWithin);
    }

    // Apply filters after syncing to URL
    applyFilters(filters);
  }, [applyFilters, urlSearchText, setUrlSearchText, ageFilter, setAgeFilter]);

  useEffect(() => {
    if (jobMarkers.length > 0 && urlSearchText !== undefined && ageFilter !== undefined) {
      applyFilters({
        companies: appliedFilters.companies,
        excludeCompanies: appliedFilters.excludeCompanies,
        locations: appliedFilters.locations,
        geoFilter: appliedFilters.geoFilter,
        searchText: urlSearchText || '',
        postedWithin: ageFilter,
        remoteOnly: appliedFilters.remoteOnly,
        minSalary: appliedFilters.minSalary,
        experience: appliedFilters.experience,
      });
    }
  }, [urlSearchText, ageFilter, jobMarkers, applyFilters, appliedFilters]);

  const toggleJobList = useCallback(() => {
    setIsJobListOpen((prev) => !prev);
  }, []);

  const handleJobClick = useCallback((job: JobMarker) => {
    if (mapControlCallbacksRef.current) {
      // Fly to the job location and zoom in
      mapControlCallbacksRef.current.flyTo(job.lng, job.lat, 12);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        // Load CSV with coordinates
        const jobs = await loadJobsWithCoordinates('/ai.csv');
        console.log(`Loaded ${jobs.length} jobs with coordinates`);

        if (jobs.length === 0) {
          throw new Error('No jobs found in CSV file');
        }

        setTotalJobsCount(jobs.length);
        setJobMarkers(jobs);

        // Get stats
        const stats = getLocationStats(jobs);
        console.log('Location stats:', stats);

        setInitialLoading(false);
      } catch (err) {
        console.error('Error loading job data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job data');
        setInitialLoading(false);
      }
    }

    loadData();
  }, []);

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-red-500 p-5 text-center">
        <h1 className="text-2xl mb-4">Error Loading Data</h1>
        <p className="text-base text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-blue-500 text-white border-none rounded-md cursor-pointer text-base hover:bg-blue-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Hidden heading for SEO */}
      <h1 className="sr-only">Stapply Map - Explore Jobs at Tech Companies Worldwide</h1>
      <Analytics />

      <PageHeader
        rightAction={
          <MapControls
            hasActiveFilters={hasActiveFilters}
            onOpenFilters={() => setIsFilterDialogOpen(true)}
            onOpenJobList={toggleJobList}
          />
        }
      />

      <div className="relative min-h-0 flex-1">
        <JobMap
          jobs={jobMarkers}
          mapboxToken={MAPBOX_TOKEN}
          totalJobs={totalJobsCount}
          onMapControlReady={handleMapControlReady}
          filteredJobs={filteredJobs}
        />
      </div>

      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        jobs={jobMarkers}
        onApplyFilters={handleApplyFilters}
        current={currentFilters}
      />
      <JobListSidebar
        jobs={jobMarkers}
        isOpen={isJobListOpen}
        onClose={() => setIsJobListOpen(false)}
        onJobClick={handleJobClick}
        filteredJobs={filteredJobs}
      />
    </div>
  );
}

/* Map-page controls relocated from the old floating stats panel into the
 * header (Filter + All Jobs), styled with the design-system chrome tokens. */
function MapControls({
  hasActiveFilters,
  onOpenFilters,
  onOpenJobList,
}: {
  hasActiveFilters: boolean;
  onOpenFilters: () => void;
  onOpenJobList: () => void;
}) {
  const cls =
    'inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-[14px] font-normal text-[color:var(--ink-soft)] transition-colors hover:bg-[color:var(--paper-3)] hover:text-[color:var(--ink)]';
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <button type="button" onClick={onOpenFilters} className={cls} aria-label="Open filters">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
        Filter
        {hasActiveFilters && (
          <span className="size-1.5 rounded-full bg-[color:var(--brand)]" />
        )}
      </button>
      <button type="button" onClick={onOpenJobList} className={cls} aria-label="Open job list">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        All Jobs
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}
