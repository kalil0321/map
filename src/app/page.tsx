'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import Link from 'next/link';
import { JobMap } from '@/components/job-map';
import { LoadingScreen } from '@/components/loading-screen';
import { ChatInterface } from '@/components/chat-interface';
import { FilterDialog, type FilterState } from '@/components/filter-dialog';
import { JobListSidebar } from '@/components/job-list-sidebar';
import { JobAlertModal } from '@/components/job-alert-modal';
import { loadJobsWithCoordinates, getLocationStats } from '@/utils/data-processor';
import type { JobMarker } from '@/types';
import { MAPBOX_TOKEN } from '@/lib/config';
import { AIService } from '@/services/ai-service';
import type { MapControlCallbacks, ViewState } from '@/utils/map-control';
import { Analytics } from '@vercel/analytics/react';
import { getJobDate } from '@/utils/date-format';
import { SeoContent } from '@/components/seo-content';
import { isJobInGeoFilter, isRemoteJob, getDefaultGeoFilter, getDefaultRemoteFilter, type GeoFilter, type RemoteFilter } from '@/utils/geo-filter';

function HomeContent() {
  const [jobMarkers, setJobMarkers] = useState<JobMarker[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [filteredJobs, setFilteredJobs] = useState<JobMarker[] | null>(null);
  const [viewState, setViewState] = useState<ViewState | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isJobListOpen, setIsJobListOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const aiServiceRef = useRef<AIService>(new AIService());
  const mapControlCallbacksRef = useRef<MapControlCallbacks | null>(null);

  // URL query state for search
  const [urlSearchText, setUrlSearchText] = useQueryState('search', {
    defaultValue: '',
    clearOnDefault: true,
  });

  // URL query state for age filter
  const [ageFilter, setAgeFilter] = useQueryState('age', parseAsInteger);

  // Track applied filters (excluding search and age which come from URL)
  // OLD: Included 'locations' for text-based filtering (commented out for rollback if needed)
  // const [appliedFilters, setAppliedFilters] = useState<Pick<FilterState, 'companies' | 'locations'>>({
  //   companies: [],
  //   locations: [],
  // });
  
  // NEW: Track companies, geoFilter, and remoteFilter
  const [appliedFilters, setAppliedFilters] = useState<{
    companies: string[];
    geoFilter: GeoFilter;
    remoteFilter: RemoteFilter;
  }>({
    companies: [],
    geoFilter: getDefaultGeoFilter(),
    remoteFilter: getDefaultRemoteFilter(),
  });

  const handleMapControlReady = useCallback((callbacks: MapControlCallbacks) => {
    mapControlCallbacksRef.current = callbacks;
    if (jobMarkers.length > 0) {
      aiServiceRef.current.initialize(
        jobMarkers,
        {
          ...callbacks,
          setFilteredJobs: (jobs) => {
            setFilteredJobs(jobs);
            callbacks.setFilteredJobs(jobs);
          },
        },
        viewState || undefined
      );
    }
  }, [jobMarkers, viewState]);

  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(newViewState);
    if (mapControlCallbacksRef.current && jobMarkers.length > 0) {
      aiServiceRef.current.updateViewState(newViewState);
    }
  }, [jobMarkers.length]);

  useEffect(() => {
    if (jobMarkers.length > 0 && mapControlCallbacksRef.current) {
      aiServiceRef.current.updateJobs(jobMarkers);
    }
  }, [jobMarkers]);

  const applyFilters = useCallback((filters: FilterState) => {
    let filtered = jobMarkers;

    // Filter by companies
    if (filters.companies.length > 0) {
      filtered = filtered.filter(job => filters.companies.includes(job.company));
    }

    // OLD: Filter by locations (text-based, commented out for rollback if needed)
    // if (filters.locations.length > 0) {
    //   filtered = filtered.filter(job => filters.locations.includes(job.location));
    // }

    // NEW: Filter by remote status
    if (filters.remoteFilter === 'only') {
      // Only show remote jobs
      filtered = filtered.filter(job => isRemoteJob(job.location));
    } else if (filters.remoteFilter === 'exclude') {
      // Exclude remote jobs
      filtered = filtered.filter(job => !isRemoteJob(job.location));
    }
    // 'include' does nothing - show all jobs

    // NEW: Filter by geographic area
    if (filters.geoFilter.type !== 'none') {
      filtered = filtered.filter(job => {
        // Remote jobs bypass geographic filter when we're including them
        if (isRemoteJob(job.location) && filters.remoteFilter === 'include') {
          return true;
        }
        // Check if job coordinates are within the geographic filter
        return isJobInGeoFilter(job.lat, job.lng, filters.geoFilter);
      });
    }

    // Filter by search text
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    // Filter by age
    if (filters.postedWithin !== null) {
      const cutoff = Date.now() - filters.postedWithin * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(job => {
        const date = getJobDate(job);
        if (!date) return false;
        return date.getTime() >= cutoff;
      });
    }

    setFilteredJobs(filtered.length < jobMarkers.length ? filtered : null);
  }, [jobMarkers]);

  const handleApplyFilters = useCallback((filters: FilterState) => {
    // OLD: Stored 'locations' for text-based filtering (commented out for rollback if needed)
    // setAppliedFilters({
    //   companies: filters.companies,
    //   locations: filters.locations,
    // });
    
    // NEW: Store companies, geoFilter, and remoteFilter
    setAppliedFilters({
      companies: filters.companies,
      geoFilter: filters.geoFilter,
      remoteFilter: filters.remoteFilter,
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
      // OLD: Included 'locations' for text-based filtering (commented out for rollback if needed)
      // applyFilters({
      //   companies: appliedFilters.companies,
      //   locations: appliedFilters.locations,
      //   searchText: urlSearchText || '',
      //   postedWithin: ageFilter,
      // });
      
      // NEW: Include geoFilter and remoteFilter
      applyFilters({
        companies: appliedFilters.companies,
        searchText: urlSearchText || '',
        postedWithin: ageFilter,
        geoFilter: appliedFilters.geoFilter,
        remoteFilter: appliedFilters.remoteFilter,
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

        // Initialize AI service once we have jobs
        if (mapControlCallbacksRef.current) {
          aiServiceRef.current.initialize(
            jobs,
            mapControlCallbacksRef.current,
            viewState || undefined
          );
        }
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

  // Show chat interface (API key is checked server-side)
  // The chat will show an error if the API key isn't configured
  const showChat = true;

  return (
    <>
      {/* Hidden heading for SEO */}
      <h1 className="sr-only">Stapply Map - Explore Jobs at Tech Companies Worldwide</h1>
      <Analytics />
      <JobMap
        jobs={jobMarkers}
        mapboxToken={MAPBOX_TOKEN}
        totalJobs={totalJobsCount}
        onMapControlReady={handleMapControlReady}
        filteredJobs={filteredJobs}
        onViewStateChange={handleViewStateChange}
        onOpenFilters={() => setIsFilterDialogOpen(true)}
        onOpenJobList={toggleJobList}
        onOpenAlert={() => setIsAlertModalOpen(true)}
      />
      {showChat && (
        <ChatInterface
          aiService={aiServiceRef.current}
          hideButton={isJobListOpen}
        />
      )}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        jobs={jobMarkers}
        onApplyFilters={handleApplyFilters}
        searchText={urlSearchText || ''}
        onSearchTextChange={setUrlSearchText}
      />
      <JobListSidebar
        jobs={jobMarkers}
        isOpen={isJobListOpen}
        onClose={() => setIsJobListOpen(false)}
        onJobClick={handleJobClick}
        filteredJobs={filteredJobs}
      />
      <JobAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        jobs={jobMarkers}
      />
      <SeoContent totalJobs={totalJobsCount} />
      <Link
        href="/jobs"
        className="fixed bottom-1 left-2 z-40 text-[10px] text-white/5 hover:text-white/60 transition-colors font-mono no-underline mix-blend-difference"
      >
        Directory
      </Link>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}
