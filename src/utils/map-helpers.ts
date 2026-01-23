import { MAPBOX_TOKEN } from '@/lib/config';

/**
 * Generate a static map image URL using Mapbox Static Images API
 * https://docs.mapbox.com/api/maps/static-images/
 *
 * @param lng - Longitude
 * @param lat - Latitude
 * @param zoom - Zoom level (default: 12)
 * @param width - Image width in pixels (default: 600)
 * @param height - Image height in pixels (default: 400)
 * @param retina - Use @2x for retina displays (default: true)
 * @returns Static map image URL
 */
export function generateStaticMapUrl(
  lng: number,
  lat: number,
  zoom: number = 12,
  width: number = 600,
  height: number = 400,
  retina: boolean = true
): string {
  const retinaStr = retina ? '@2x' : '';
  const markerColor = '3b82f6'; // blue-500

  // Pin overlay format: pin-{size}+{color}({lng},{lat})
  const overlay = `pin-s+${markerColor}(${lng},${lat})`;

  // Static Images API format:
  // /styles/v1/{username}/{style_id}/static/{overlay}/{lng},{lat},{zoom}/{width}x{height}{@2x}
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${overlay}/${lng},${lat},${zoom}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Generate a static map showing the area where jobs are located
 * Clean map view without markers, properly centered and zoomed
 *
 * @param jobs - Array of jobs with lat/lng coordinates
 * @param width - Image width in pixels (default: 900)
 * @param height - Image height in pixels (default: 360)
 * @returns Static map image URL centered on job locations
 */
export function generateStaticHeatmapUrl(
  jobs: Array<{ lat: number; lng: number }>,
  width: number = 900,
  height: number = 360
): string {
  if (jobs.length === 0) {
    // Fallback to world view if no jobs
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/0,20,1.5/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  }

  // For a single job, show it with a marker
  if (jobs.length === 1) {
    const job = jobs[0];
    return generateStaticMapUrl(job.lng, job.lat, 8, width, height);
  }

  // Calculate bounding box for multiple jobs
  const lats = jobs.map(job => job.lat);
  const lngs = jobs.map(job => job.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Calculate center point (simple average works for most cases)
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate appropriate zoom level based on bounding box
  const latDiff = Math.max(0.01, maxLat - minLat);
  const lngDiff = Math.max(0.01, maxLng - minLng);

  // Add padding so the area isn't right at the edge
  const padding = 1.8;
  const worldDimension = { height: height * padding, width: width * padding };
  const tileSize = 512; // Mapbox uses 512px tiles

  const zoomLat = Math.log2((170.1022 * worldDimension.height) / (tileSize * latDiff));
  const zoomLng = Math.log2((360 * worldDimension.width) / (tileSize * lngDiff));

  // Use the smaller zoom to fit both dimensions, and clamp to reasonable range
  let zoom = Math.floor(Math.min(zoomLat, zoomLng));
  zoom = Math.max(1, Math.min(12, zoom)); // Limit zoom between 1-12 for OG images

  const retinaStr = '@2x';

  // Clean map without markers - just show the area
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${centerLng},${centerLat},${zoom}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;
}
