'use client';

import { useState, useCallback, useMemo, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import Link from 'next/link';
import clsx from 'clsx';
import Supercluster from 'supercluster';
import type { JobMarker } from '@/types';
import type { MapControlCallbacks, ViewState } from '@/utils/map-control';
import { generateCompanySlug, generateJobSlug } from '@/lib/slug-utils';
import { formatExperience, formatSalary } from '@/utils/salary-format';
import { SaveJobButton } from '@/components/save-job-button';
import { AppliedJobButton } from '@/components/applied-job-button';
import { addUtmParams } from '@/utils/url-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

interface JobMapProps {
  jobs: JobMarker[];
  mapboxToken: string;
  totalJobs?: number;
  isLoadingMore?: boolean;
  loadingProgress?: { current: number; total: number };
  onMapControlReady?: (callbacks: MapControlCallbacks) => void;
  filteredJobs?: JobMarker[] | null;
  onViewStateChange?: (viewState: ViewState) => void;
}

// Use supercluster's built-in types
type SuperclusterFeature = Supercluster.ClusterFeature<any> | Supercluster.PointFeature<JobMarker>;

// Helper to check if feature is a cluster
function isClusterFeature(feature: SuperclusterFeature): feature is Supercluster.ClusterFeature<any> {
  return 'cluster' in feature.properties && feature.properties.cluster === true;
}

// Helper to check if a point is visible on the current hemisphere (for globe view)
function isPointVisible(pointLng: number, pointLat: number, centerLng: number, centerLat: number, zoom: number): boolean {
  // At high zoom levels (zoomed in), show all markers
  if (zoom > 4) return true;

  // Calculate the angular distance between the point and the map center
  // For globe projection, hide points that are on the far side (> 90 degrees away)
  const deltaLng = Math.abs(((pointLng - centerLng + 540) % 360) - 180);

  // Use a threshold that varies with zoom - at lower zooms (more globe-like), be more strict
  const threshold = 90 + (zoom * 5); // Gradually increase visible range as we zoom in

  return deltaLng < threshold;
}

// Pre-cluster jobs at exact same coordinates to avoid performance issues
// when many jobs share the same location (e.g., 2000 jobs at one SF office)
function preClusterExactDuplicates(jobs: JobMarker[]): {
  features: Supercluster.PointFeature<JobMarker & { __locationKey: string; __jobCount: number }>[];
  exactLocationGroups: Record<string, JobMarker[]>;
} {
  const locationGroups: Record<string, JobMarker[]> = {};

  // Group jobs by exact coordinates (precision to 6 decimals ~ 11cm)
  jobs.forEach((job) => {
    const key = `${job.lat.toFixed(6)},${job.lng.toFixed(6)}`;
    if (!locationGroups[key]) {
      locationGroups[key] = [];
    }
    locationGroups[key].push(job);
  });

  // Create features - one per unique location, using first job as representative
  const features: Supercluster.PointFeature<JobMarker & { __locationKey: string; __jobCount: number }>[] = [];
  Object.entries(locationGroups).forEach(([key, jobsAtLocation]) => {
    features.push({
      type: 'Feature',
      properties: {
        ...jobsAtLocation[0], // Use first job as representative
        __locationKey: key, // Store the location key for popup lookup
        __jobCount: jobsAtLocation.length, // Store actual job count for this location
      },
      geometry: {
        type: 'Point',
        coordinates: [jobsAtLocation[0].lng, jobsAtLocation[0].lat],
      },
    });
  });

  return { features, exactLocationGroups: locationGroups };
}

export const JobMap = forwardRef<MapControlCallbacks, JobMapProps>(
  ({ jobs, mapboxToken, totalJobs, isLoadingMore, loadingProgress, onMapControlReady, filteredJobs, onViewStateChange }, ref) => {
    // Calculate initial view state based on jobs if available
    const getInitialViewState = (): ViewState => {
      if (jobs.length > 0) {
        // Calculate center of all jobs
        const validJobs = jobs.filter(j => !isNaN(j.lat) && !isNaN(j.lng));
        if (validJobs.length > 0) {
          const avgLat = validJobs.reduce((sum, j) => sum + j.lat, 0) / validJobs.length;
          const avgLng = validJobs.reduce((sum, j) => sum + j.lng, 0) / validJobs.length;
          return {
            longitude: avgLng,
            latitude: avgLat,
            zoom: 2,
          };
        }
      }
      return {
        longitude: -95.7129,
        latitude: 37.0902,
        zoom: 3.5,
      };
    };

    const [viewState, setViewState] = useState<ViewState>(getInitialViewState());

    // Update view state when jobs change (if initially empty)
    useEffect(() => {
      if (jobs.length > 0 && viewState.longitude === -95.7129 && viewState.latitude === 37.0902) {
        const newViewState = getInitialViewState();
        setViewState(newViewState);
      }
    }, [jobs.length]);

    const [popupJob, setPopupJob] = useState<JobMarker | null>(null);
    const [popupJobsAtLocation, setPopupJobsAtLocation] = useState<JobMarker[]>([]);
    const [currentJobIndex, setCurrentJobIndex] = useState(0);

    // Use filtered jobs if provided, otherwise use all jobs
    const displayJobs = useMemo(() => {
      return filteredJobs !== null && filteredJobs !== undefined ? filteredJobs : jobs;
    }, [jobs, filteredJobs]);

    // Initialize supercluster
    const superclusterRef = useRef<Supercluster<JobMarker & { __locationKey: string; __jobCount: number }>>(
      new Supercluster<JobMarker & { __locationKey: string; __jobCount: number }>({
        radius: 40, // Cluster radius in pixels (smaller = more individual markers visible)
        maxZoom: 14, // Max zoom to cluster points on (after this zoom, always show individual markers)
        minZoom: 0,
        extent: 512,
        nodeSize: 64,
        // Map function - adds __jobCount property to each point
        map: (props) => ({ __jobCount: props.__jobCount || 1 }),
        // Reduce function - sums up __jobCount when clustering points together
        reduce: (accumulated, props) => {
          accumulated.__jobCount += props.__jobCount;
        },
      })
    );

    // Track when supercluster is loaded to trigger re-render
    const [superclusterLoaded, setSuperclusterLoaded] = useState(0);

    // Store exact location groups for reference when clicking markers
    const exactLocationGroupsRef = useRef<Record<string, JobMarker[]>>({});

    // Load points into supercluster when displayJobs change
    useEffect(() => {
      const { features, exactLocationGroups } = preClusterExactDuplicates(displayJobs);
      exactLocationGroupsRef.current = exactLocationGroups;
      superclusterRef.current.load(features);
      // Increment to trigger clusters recalculation
      setSuperclusterLoaded(prev => prev + 1);
    }, [displayJobs]);

    // Get clusters for current viewport
    const clusters = useMemo(() => {
      if (displayJobs.length === 0) return [];

      // Ensure supercluster is loaded before trying to get clusters
      if (!superclusterRef.current || superclusterLoaded === 0) return [];

      // Calculate proper map bounds based on zoom level
      // At lower zooms, show more of the world; at higher zooms, show tighter bounds
      const latDelta = 180 / Math.pow(2, viewState.zoom - 1);
      const lngDelta = 360 / Math.pow(2, viewState.zoom - 1);

      // Add padding to ensure markers at edges are visible
      const padding = 1.2;

      const bbox: [number, number, number, number] = [
        Math.max(-180, viewState.longitude - lngDelta * padding),
        Math.max(-85, viewState.latitude - latDelta * padding),
        Math.min(180, viewState.longitude + lngDelta * padding),
        Math.min(85, viewState.latitude + latDelta * padding),
      ];

      const zoom = Math.floor(viewState.zoom);

      try {
        return superclusterRef.current.getClusters(bbox, zoom);
      } catch (error) {
        console.error('Error getting clusters:', error);
        return [];
      }
    }, [displayJobs.length, viewState.zoom, viewState.longitude, viewState.latitude, superclusterLoaded]);

    // Map control callbacks
    const flyTo = useCallback((longitude: number, latitude: number, zoom?: number) => {
      setViewState(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: zoom !== undefined ? zoom : prev.zoom,
      }));
    }, []);

    const setZoom = useCallback((zoom: number) => {
      setViewState(prev => ({
        ...prev,
        zoom: Math.max(1, Math.min(15, zoom)),
      }));
    }, []);

    const setFilteredJobs = useCallback((_filtered: JobMarker[] | null) => {
      // This is handled by the filteredJobs prop from parent
      // We could emit an event here if needed
    }, []);

    const getViewState = useCallback((): ViewState => {
      return { ...viewState };
    }, [viewState]);

    // Expose callbacks via ref and callback
    const callbacks: MapControlCallbacks = useMemo(() => ({
      flyTo,
      setZoom,
      setFilteredJobs,
      getViewState,
    }), [flyTo, setZoom, setFilteredJobs, getViewState]);

    useEffect(() => {
      onMapControlReady?.(callbacks);
    }, [callbacks, onMapControlReady]);

    useImperativeHandle(ref, () => callbacks, [callbacks]);

    const handleClusterClick = useCallback((feature: SuperclusterFeature) => {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props = feature.properties as any;

      if ('cluster' in props && props.cluster === true) {
        // Cluster clicked - zoom in on it
        const clusterId = props.cluster_id;

        // Get expansion zoom - default to current zoom + 2 if id is not available
        let expansionZoom = viewState.zoom + 2;
        if (typeof clusterId === 'number') {
          try {
            expansionZoom = superclusterRef.current.getClusterExpansionZoom(clusterId);
          } catch (e) {
            // If getClusterExpansionZoom fails, use default
            console.warn('Failed to get cluster expansion zoom:', e);
          }
        }

        setViewState(prev => ({
          ...prev,
          longitude: lng,
          latitude: lat,
          zoom: Math.min(expansionZoom, 20),
        }));
      } else {
        // Single point clicked - show popup with ALL jobs at this exact location
        // Use the stored location key to ensure we get all jobs
        const locationKey = props.__locationKey;
        const jobsAtLocation = locationKey
          ? exactLocationGroupsRef.current[locationKey]
          : [props as JobMarker];

        setPopupJobsAtLocation(jobsAtLocation || [props as JobMarker]);
        setCurrentJobIndex(0);
        setPopupJob(jobsAtLocation?.[0] || props as JobMarker);
      }
    }, [viewState.zoom]);

    const handleNextJob = useCallback(() => {
      const nextIndex = (currentJobIndex + 1) % popupJobsAtLocation.length;
      setCurrentJobIndex(nextIndex);
      setPopupJob(popupJobsAtLocation[nextIndex]);
    }, [currentJobIndex, popupJobsAtLocation]);

    const handlePrevJob = useCallback(() => {
      const prevIndex = currentJobIndex === 0 ? popupJobsAtLocation.length - 1 : currentJobIndex - 1;
      setCurrentJobIndex(prevIndex);
      setPopupJob(popupJobsAtLocation[prevIndex]);
    }, [currentJobIndex, popupJobsAtLocation]);

    const handleClosePopup = useCallback(() => {
      setPopupJob(null);
      setPopupJobsAtLocation([]);
      setCurrentJobIndex(0);
    }, []);

    // Keyboard navigation support
    useEffect(() => {
      if (!popupJob || popupJobsAtLocation.length <= 1) return;

      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevJob();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextJob();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleClosePopup();
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }, [popupJob, popupJobsAtLocation, handleNextJob, handlePrevJob, handleClosePopup]);

    const getClusterColor = (count: number): string => {
      if (count < 5) return '#3b82f6';     // blue - very small
      if (count < 10) return '#06b6d4';    // cyan - small
      if (count < 25) return '#10b981';    // emerald - small-medium
      if (count < 50) return '#22c55e';    // green - medium
      if (count < 100) return '#84cc16';   // lime - medium-large
      if (count < 200) return '#eab308';   // yellow - large
      if (count < 500) return '#f59e0b';   // amber - very large
      if (count < 1000) return '#f97316';  // orange - huge
      if (count < 2000) return '#ef4444';  // red - massive
      if (count < 5000) return '#dc2626';  // dark red - enormous
      return '#be123c';                     // deep red - extreme (5000+)
    };

    const getClusterSize = (count: number): number => {
      if (count < 5) return 32;
      if (count < 10) return 36;
      if (count < 25) return 40;
      if (count < 50) return 44;
      if (count < 100) return 48;
      if (count < 200) return 52;
      if (count < 500) return 56;
      if (count < 1000) return 60;
      if (count < 2000) return 64;
      if (count < 5000) return 68;
      return 72; // Maximum size for 5000+
    };

    // Ensure map always renders, even with 0 jobs
    // if (!mapboxToken) {
    //   return (
    //     <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
    //       <div className="text-center">
    //         <h2>Mapbox token missing</h2>
    //         <p>Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env file</p>
    //       </div>
    //     </div>
    //   );
    // }


    return (
      <div className="w-full h-full relative">
        {isLoadingMore && loadingProgress && (
          <div className={clsx(
            'absolute bottom-6 left-1/2 -translate-x-1/2 z-1',
            'bg-black/50 backdrop-blur-[20px]',
            'px-6 py-3.5 rounded-xl',
            'text-white border border-white/10',
            'flex items-center gap-3 min-w-[240px]',
            'font-[system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif]'
          )}>
            <div className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <div className="flex-1">
              <div className="text-xs text-white/90 mb-1.5 font-medium">
                Loading jobs
              </div>
              <div className="w-full h-[3px] bg-blue-500/15 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-[width] duration-300 ease-in-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-white/40 mt-1 tabular-nums">
                {loadingProgress.current} / {loadingProgress.total}
              </div>
            </div>
          </div>
        )}

        <Map
          {...viewState}
          onMove={(evt) => {
            const newViewState = evt.viewState;
            setViewState(newViewState);
            onViewStateChange?.(newViewState);
          }}
          onError={(e) => {
            // Mapbox errors can be various types - log more details
            const errorInfo = {
              error: e,
              errorType: typeof e,
              errorString: String(e),
              errorJSON: JSON.stringify(e, Object.getOwnPropertyNames(e)),
              message: e?.error?.message || 'Unknown error',
              type: e?.type || 'Unknown',
            };
            console.error('Map error:', errorInfo);
          }}
          onLoad={() => {
            console.log('Map loaded successfully');
          }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={mapboxToken}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />

          {clusters.map((feature, index) => {
            const [lng, lat] = feature.geometry.coordinates as [number, number];
            const isCluster = isClusterFeature(feature);
            const props = feature.properties as any;

            // Check if this marker is on the visible hemisphere
            const isVisible = isPointVisible(lng, lat, viewState.longitude, viewState.latitude, viewState.zoom);

            // Don't render markers on the back side of the globe
            if (!isVisible) {
              return null;
            }

            // Get the actual job count (either from cluster aggregation or individual point)
            let jobCount = 1;
            let isExactLocationCluster = false;

            if (isCluster) {
              // Use the aggregated __jobCount from the cluster
              jobCount = props.__jobCount || props.point_count;
            } else {
              // Use the __jobCount from the individual point (which represents all jobs at that exact location)
              jobCount = props.__jobCount || 1;
              if (jobCount > 1) {
                isExactLocationCluster = true;
              }
            }

            const size = (isCluster || isExactLocationCluster) ? getClusterSize(jobCount) : 20;
            const color = (isCluster || isExactLocationCluster) ? getClusterColor(jobCount) : '#3b82f6';

            // Create a stable key for each marker
            const markerKey = isCluster
              ? `cluster-${props.cluster_id}-${lng}-${lat}`
              : `point-${props.__locationKey || `${lat}-${lng}`}-${index}`;

            return (
              <Marker
                key={markerKey}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(feature);
                }}
              >
                {(isCluster || isExactLocationCluster) ? (
                  <div
                    className="relative cursor-pointer"
                    style={{ width: size, height: size }}
                    onMouseEnter={(e) => {
                      const inner = e.currentTarget.querySelector('.marker-inner') as HTMLElement;
                      if (inner) inner.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      const inner = e.currentTarget.querySelector('.marker-inner') as HTMLElement;
                      if (inner) inner.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Flat, crisp cluster — solid dark core, heat-color ring + count, no glow/pulse */}
                    <div
                      className={clsx(
                        'marker-inner',
                        'relative grid h-full w-full place-items-center rounded-full',
                        'bg-[color:var(--paper)] flex items-center justify-center',
                        'font-semibold tabular-nums',
                        'transition-transform duration-150 ease-out',
                        'shadow-[0_2px_6px_rgba(0,0,0,0.5)]'
                      )}
                      style={{
                        border: `2px solid ${color}`,
                        color: color,
                        fontSize: jobCount >= 1000 ? 11 : 13,
                      }}
                    >
                      {jobCount >= 1000 ? `${(jobCount / 1000).toFixed(jobCount >= 10000 ? 0 : 1)}k` : jobCount}
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative cursor-pointer"
                    onMouseEnter={(e) => {
                      const dot = e.currentTarget.querySelector('.marker-dot') as HTMLElement;
                      if (dot) dot.style.transform = 'scale(1.25)';
                    }}
                    onMouseLeave={(e) => {
                      const dot = e.currentTarget.querySelector('.marker-dot') as HTMLElement;
                      if (dot) dot.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Flat single-job dot — solid heat color, thin dark ring, no glow */}
                    <div
                      className="marker-dot rounded-full border border-black/60 transition-transform duration-150 ease-out"
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: color,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      }}
                    />
                  </div>
                )}
              </Marker>
            );
          })}

          {popupJob && (
            <Popup
              longitude={popupJob.lng}
              latitude={popupJob.lat}
              anchor="bottom"
              onClose={handleClosePopup}
              closeButton={false}
              closeOnClick={false}
              offset={15}
              className="custom-popup"
            >
              <div className={clsx(
                'popup-content',
                'bg-[color:var(--paper-2)]/95 backdrop-blur-xl',
                'rounded-xl p-3.5',
                'w-[300px]',
                'font-sans text-[var(--ink)]',
                'relative flex flex-col box-border',
                'shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
              )}>
                {/* Close button */}
                <button
                  onClick={handleClosePopup}
                  aria-label="Close"
                  className="absolute top-2.5 right-2.5 z-1 grid size-6 place-items-center rounded-md cursor-pointer text-[var(--ink-mute)] transition-colors hover:bg-[var(--paper-3)] hover:text-[var(--ink)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-3.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>

                {/* Multiple-jobs nav (only when >1 at this location) */}
                {popupJobsAtLocation.length > 1 && (
                  <div className="mb-2.5 flex items-center justify-between pr-7">
                    <span className="text-[11px] font-medium text-[var(--ink-mute)]">
                      {currentJobIndex + 1} / {popupJobsAtLocation.length} here
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={handlePrevJob}
                        title="Previous job (←)"
                        className="grid size-6 place-items-center rounded-md cursor-pointer bg-[var(--paper-3)] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><path d="m15 18-6-6 6-6" /></svg>
                      </button>
                      <button
                        onClick={handleNextJob}
                        title="Next job (→)"
                        className="grid size-6 place-items-center rounded-md cursor-pointer bg-[var(--paper-3)] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><path d="m9 18 6-6-6-6" /></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Title + company — same treatment as the All Jobs sidebar rows */}
                <div className="pr-7">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${generateJobSlug(popupJob.title, popupJob.id, popupJob.company, popupJob.ats_id, popupJob.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-[15px] font-medium leading-tight text-[var(--ink)] no-underline transition-colors hover:text-[var(--brand-deep)]"
                    >
                      {popupJob.title}
                    </Link>
                    {formatExperience(popupJob.experience) && (
                      <span className="shrink-0 text-[12px] text-[var(--ink-mute)]">{formatExperience(popupJob.experience)}</span>
                    )}
                  </div>
                  <Link
                    href={`/company/${generateCompanySlug(popupJob.company)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block w-fit text-[12px] font-medium uppercase tracking-wider text-[var(--ink-mute)] no-underline transition-colors hover:text-[var(--brand-deep)]"
                  >
                    {popupJob.company}
                  </Link>
                </div>

                {/* Location + salary */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="flex min-w-0 items-center gap-1.5 text-[var(--ink-soft)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{popupJob.location}</span>
                  </span>
                  {formatSalary(popupJob) && (
                    <span className="shrink-0 font-medium text-[var(--emerald)]">{formatSalary(popupJob)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3.5 flex items-center gap-2">
                  <Link
                    href={addUtmParams(popupJob.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--brand)] px-4 py-2 text-[13px] font-semibold text-white no-underline transition-colors hover:bg-[var(--brand-deep)]"
                  >
                    View Job
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
                  <SaveJobButton atsId={popupJob.ats_id} name={popupJob.title} company={popupJob.company} variant="icon" />
                  <AppliedJobButton atsId={popupJob.ats_id} name={popupJob.title} company={popupJob.company} variant="icon" />
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    );
  }
);

JobMap.displayName = 'JobMap';
