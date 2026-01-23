'use client';

import { useState, useCallback, useMemo, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import Link from 'next/link';
import clsx from 'clsx';
import Supercluster from 'supercluster';
import type { JobMarker } from '@/types';
import { StatsOverlay } from './stats-overlay';
import type { MapControlCallbacks, ViewState } from '@/utils/map-control';
import { generateCompanySlug } from '@/lib/slug-utils';
import { formatExperience } from '@/utils/salary-format';
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
  onOpenFilters?: () => void;
  onOpenJobList?: () => void;
  onOpenAlert?: () => void;
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
  ({ jobs, mapboxToken, totalJobs, isLoadingMore, loadingProgress, onMapControlReady, filteredJobs, onViewStateChange, onOpenFilters, onOpenJobList, onOpenAlert }, ref) => {
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

    const uniqueLocations = useMemo(() => {
      const locations = new Set(displayJobs.map(job => job.location));
      return locations.size;
    }, [displayJobs]);

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
      <div className="w-screen h-screen relative">
        <StatsOverlay
          totalJobs={totalJobs || jobs.length}
          displayedJobs={displayJobs.length}
          totalLocations={uniqueLocations}
          popupOpen={!!popupJob}
          onOpenFilters={onOpenFilters}
          onOpenJobList={onOpenJobList}
          onOpenAlert={onOpenAlert}
          hasActiveFilters={filteredJobs !== null}
        />

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
                      if (inner) inner.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={(e) => {
                      const inner = e.currentTarget.querySelector('.marker-inner') as HTMLElement;
                      if (inner) inner.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Pulsing ring */}
                    <div
                      className="absolute -inset-2 rounded-full opacity-20 animate-pulse"
                      style={{ backgroundColor: color }}
                    />

                    {/* Main marker */}
                    <div
                      className={clsx(
                        'marker-inner',
                        'relative w-full h-full rounded-full',
                        'bg-black/80 flex items-center justify-center',
                        'font-semibold text-[13px] tabular-nums',
                        'transition-transform duration-200 ease-in-out',
                        'shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                      )}
                      style={{
                        border: `2px solid ${color}`,
                        color: color,
                        boxShadow: `0 0 20px ${color}40, 0 4px 12px rgba(0, 0, 0, 0.4)`,
                      }}
                    >
                      {jobCount}
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative cursor-pointer"
                    onMouseEnter={(e) => {
                      const dot = e.currentTarget.querySelector('.marker-dot') as HTMLElement;
                      if (dot) dot.style.transform = 'scale(1.3)';
                    }}
                    onMouseLeave={(e) => {
                      const dot = e.currentTarget.querySelector('.marker-dot') as HTMLElement;
                      if (dot) dot.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Single job marker - minimalist dot */}
                    <div
                      className="marker-dot rounded-full border-2 border-black/50 transition-transform duration-200 ease-in-out"
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: color,
                        boxShadow: `0 0 12px ${color}80, 0 2px 8px rgba(0, 0, 0, 0.3)`,
                      }}
                    />
                    {/* Inner glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-80" />
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
                'bg-black/90 backdrop-blur-[20px]',
                'border border-white/10 rounded-xl px-5 pt-5 pb-4',
                'min-w-[300px] max-w-[360px] w-[300px] h-[280px]',
                'text-white font-[system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif]',
                'relative flex flex-col box-border'
              )}>
                {/* Close button */}
                <button
                  onClick={handleClosePopup}
                  className={clsx(
                    'absolute top-3 right-3 z-1',
                    'bg-white/10 border-none rounded-md',
                    'w-7 h-7 flex items-center justify-center cursor-pointer',
                    'text-white/60 text-lg transition-all duration-200',
                    'hover:bg-white/20 hover:text-white'
                  )}
                >
                  ×
                </button>

                {/* Multiple jobs indicator and navigation - always reserve space */}
                <div
                  className={clsx(
                    'flex items-center justify-between mb-3 pr-8 h-8',
                    popupJobsAtLocation.length > 1 ? 'visible' : 'invisible'
                  )}
                >
                  <div className="text-[11px] text-white/50 font-medium">
                    {currentJobIndex + 1} of {popupJobsAtLocation.length} jobs here
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handlePrevJob}
                      title="Previous job (←)"
                      className={clsx(
                        'bg-white/10 border border-white/20 rounded-md',
                        'w-8 h-8 flex items-center justify-center cursor-pointer',
                        'text-white text-base transition-all duration-200',
                        'hover:bg-blue-500/20 hover:border-blue-500'
                      )}
                    >
                      ←
                    </button>
                    <button
                      onClick={handleNextJob}
                      title="Next job (→)"
                      className={clsx(
                        'bg-white/10 border border-white/20 rounded-md',
                        'w-8 h-8 flex items-center justify-center cursor-pointer',
                        'text-white text-base transition-all duration-200',
                        'hover:bg-blue-500/20 hover:border-blue-500'
                      )}
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 h-3.5 overflow-hidden text-ellipsis whitespace-nowrap">
                  <Link
                    href={`/company/${generateCompanySlug(popupJob.company)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] uppercase tracking-wider text-white/40 font-medium no-underline hover:text-blue-400 transition-colors"
                  >
                    {popupJob.company}
                  </Link>
                </div>

                <div className="flex items-center gap-2 mb-4 pr-5">
                  <h3 className="m-0 text-lg font-medium text-white leading-snug h-[50px] overflow-hidden line-clamp-2 wrap-break-word">
                    {popupJob.title}
                  </h3>
                  {formatExperience(popupJob.experience) && (
                    <span className="text-[12px] text-white/50 shrink-0">
                      {formatExperience(popupJob.experience)}
                    </span>
                  )}
                </div>

                <div className="text-[13px] text-white/50 mb-3 flex items-center gap-1.5 h-5 overflow-hidden text-ellipsis whitespace-nowrap">
                  <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                  {popupJob.location}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={addUtmParams(popupJob.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      'flex items-center justify-center gap-2 flex-1',
                      'px-4 py-2 bg-white/8 text-white no-underline rounded-full',
                      'text-[13px] font-medium border border-white/12',
                      'transition-[border-color,background-color] duration-200 ease-in-out',
                      'hover:bg-white/12 hover:border-white/20'
                    )}
                  >
                    View Job
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
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
