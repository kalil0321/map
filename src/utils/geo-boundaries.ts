import type { Feature, Polygon, MultiPolygon } from 'geojson';

/**
 * Continent metadata with center coordinates for map positioning
 */
export const CONTINENTS = [
  { id: 'north-america', name: 'North America', center: [-100, 45] as [number, number] },
  { id: 'south-america', name: 'South America', center: [-60, -15] as [number, number] },
  { id: 'europe', name: 'Europe', center: [10, 50] as [number, number] },
  { id: 'asia', name: 'Asia', center: [100, 35] as [number, number] },
  { id: 'africa', name: 'Africa', center: [20, 0] as [number, number] },
  { id: 'oceania', name: 'Oceania', center: [135, -25] as [number, number] },
] as const;

/**
 * Countries with tech job presence - grouped by continent
 */
export const COUNTRIES = [
  // North America
  { code: 'US', name: 'United States', continent: 'north-america' },
  { code: 'CA', name: 'Canada', continent: 'north-america' },
  { code: 'MX', name: 'Mexico', continent: 'north-america' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', continent: 'europe' },
  { code: 'DE', name: 'Germany', continent: 'europe' },
  { code: 'FR', name: 'France', continent: 'europe' },
  { code: 'NL', name: 'Netherlands', continent: 'europe' },
  { code: 'IE', name: 'Ireland', continent: 'europe' },
  { code: 'ES', name: 'Spain', continent: 'europe' },
  { code: 'IT', name: 'Italy', continent: 'europe' },
  { code: 'SE', name: 'Sweden', continent: 'europe' },
  { code: 'CH', name: 'Switzerland', continent: 'europe' },
  { code: 'PL', name: 'Poland', continent: 'europe' },
  { code: 'PT', name: 'Portugal', continent: 'europe' },
  { code: 'BE', name: 'Belgium', continent: 'europe' },
  { code: 'AT', name: 'Austria', continent: 'europe' },
  { code: 'DK', name: 'Denmark', continent: 'europe' },
  { code: 'FI', name: 'Finland', continent: 'europe' },
  { code: 'NO', name: 'Norway', continent: 'europe' },
  
  // Asia
  { code: 'JP', name: 'Japan', continent: 'asia' },
  { code: 'SG', name: 'Singapore', continent: 'asia' },
  { code: 'IN', name: 'India', continent: 'asia' },
  { code: 'CN', name: 'China', continent: 'asia' },
  { code: 'KR', name: 'South Korea', continent: 'asia' },
  { code: 'IL', name: 'Israel', continent: 'asia' },
  { code: 'AE', name: 'United Arab Emirates', continent: 'asia' },
  { code: 'HK', name: 'Hong Kong', continent: 'asia' },
  { code: 'TW', name: 'Taiwan', continent: 'asia' },
  
  // Oceania
  { code: 'AU', name: 'Australia', continent: 'oceania' },
  { code: 'NZ', name: 'New Zealand', continent: 'oceania' },
  
  // South America
  { code: 'BR', name: 'Brazil', continent: 'south-america' },
  { code: 'AR', name: 'Argentina', continent: 'south-america' },
  { code: 'CL', name: 'Chile', continent: 'south-america' },
  { code: 'CO', name: 'Colombia', continent: 'south-america' },
  
  // Africa
  { code: 'ZA', name: 'South Africa', continent: 'africa' },
  { code: 'NG', name: 'Nigeria', continent: 'africa' },
  { code: 'EG', name: 'Egypt', continent: 'africa' },
  { code: 'KE', name: 'Kenya', continent: 'africa' },
] as const;

/**
 * Get countries for a specific continent
 */
export function getCountriesByContinent(continentId: string) {
  return COUNTRIES.filter(c => c.continent === continentId);
}

/**
 * Simplified continent boundaries using bounding box polygons
 * These are approximate but fast for point-in-polygon checks
 * Format: [lng, lat] pairs forming a closed polygon
 */
export const CONTINENT_BOUNDARIES: Record<string, Feature<Polygon | MultiPolygon>> = {
  'north-america': {
    type: 'Feature',
    properties: { name: 'North America' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-170, 15], [-170, 72], [-50, 72], [-50, 15], [-170, 15]
      ]]
    }
  },
  'south-america': {
    type: 'Feature',
    properties: { name: 'South America' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-82, -56], [-82, 13], [-34, 13], [-34, -56], [-82, -56]
      ]]
    }
  },
  'europe': {
    type: 'Feature',
    properties: { name: 'Europe' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-25, 35], [-25, 72], [65, 72], [65, 35], [-25, 35]
      ]]
    }
  },
  'asia': {
    type: 'Feature',
    properties: { name: 'Asia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [25, 0], [25, 80], [180, 80], [180, 0], [25, 0]
      ]]
    }
  },
  'africa': {
    type: 'Feature',
    properties: { name: 'Africa' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-18, -35], [-18, 38], [52, 38], [52, -35], [-18, -35]
      ]]
    }
  },
  'oceania': {
    type: 'Feature',
    properties: { name: 'Oceania' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [110, -50], [110, 0], [180, 0], [180, -50], [110, -50]
      ]]
    }
  },
};

/**
 * Simplified country boundaries using bounding box polygons
 * These are approximate but sufficient for job location filtering
 */
export const COUNTRY_BOUNDARIES: Record<string, Feature<Polygon | MultiPolygon>> = {
  // North America
  'US': {
    type: 'Feature',
    properties: { name: 'United States' },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        // Continental US
        [[[-125, 24], [-125, 50], [-66, 50], [-66, 24], [-125, 24]]],
        // Alaska
        [[[-180, 51], [-180, 72], [-130, 72], [-130, 51], [-180, 51]]],
        // Hawaii
        [[[-161, 18], [-161, 23], [-154, 23], [-154, 18], [-161, 18]]]
      ]
    }
  },
  'CA': {
    type: 'Feature',
    properties: { name: 'Canada' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-141, 42], [-141, 84], [-52, 84], [-52, 42], [-141, 42]]]
    }
  },
  'MX': {
    type: 'Feature',
    properties: { name: 'Mexico' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-118, 14], [-118, 33], [-86, 33], [-86, 14], [-118, 14]]]
    }
  },
  
  // Europe
  'GB': {
    type: 'Feature',
    properties: { name: 'United Kingdom' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-8, 49], [-8, 61], [2, 61], [2, 49], [-8, 49]]]
    }
  },
  'DE': {
    type: 'Feature',
    properties: { name: 'Germany' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[5, 47], [5, 55], [16, 55], [16, 47], [5, 47]]]
    }
  },
  'FR': {
    type: 'Feature',
    properties: { name: 'France' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-5, 42], [-5, 51], [10, 51], [10, 42], [-5, 42]]]
    }
  },
  'NL': {
    type: 'Feature',
    properties: { name: 'Netherlands' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[3, 50], [3, 54], [8, 54], [8, 50], [3, 50]]]
    }
  },
  'IE': {
    type: 'Feature',
    properties: { name: 'Ireland' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-11, 51], [-11, 56], [-5, 56], [-5, 51], [-11, 51]]]
    }
  },
  'ES': {
    type: 'Feature',
    properties: { name: 'Spain' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-10, 35], [-10, 44], [5, 44], [5, 35], [-10, 35]]]
    }
  },
  'IT': {
    type: 'Feature',
    properties: { name: 'Italy' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[6, 36], [6, 47], [19, 47], [19, 36], [6, 36]]]
    }
  },
  'SE': {
    type: 'Feature',
    properties: { name: 'Sweden' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[10, 55], [10, 70], [25, 70], [25, 55], [10, 55]]]
    }
  },
  'CH': {
    type: 'Feature',
    properties: { name: 'Switzerland' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[5, 45], [5, 48], [11, 48], [11, 45], [5, 45]]]
    }
  },
  'PL': {
    type: 'Feature',
    properties: { name: 'Poland' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[14, 49], [14, 55], [25, 55], [25, 49], [14, 49]]]
    }
  },
  'PT': {
    type: 'Feature',
    properties: { name: 'Portugal' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-10, 37], [-10, 42], [-6, 42], [-6, 37], [-10, 37]]]
    }
  },
  'BE': {
    type: 'Feature',
    properties: { name: 'Belgium' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[2, 49], [2, 52], [7, 52], [7, 49], [2, 49]]]
    }
  },
  'AT': {
    type: 'Feature',
    properties: { name: 'Austria' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[9, 46], [9, 49], [18, 49], [18, 46], [9, 46]]]
    }
  },
  'DK': {
    type: 'Feature',
    properties: { name: 'Denmark' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[8, 54], [8, 58], [16, 58], [16, 54], [8, 54]]]
    }
  },
  'FI': {
    type: 'Feature',
    properties: { name: 'Finland' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[20, 59], [20, 70], [32, 70], [32, 59], [20, 59]]]
    }
  },
  'NO': {
    type: 'Feature',
    properties: { name: 'Norway' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[4, 58], [4, 72], [32, 72], [32, 58], [4, 58]]]
    }
  },
  
  // Asia
  'JP': {
    type: 'Feature',
    properties: { name: 'Japan' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[129, 30], [129, 46], [146, 46], [146, 30], [129, 30]]]
    }
  },
  'SG': {
    type: 'Feature',
    properties: { name: 'Singapore' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[103, 1], [103, 2], [105, 2], [105, 1], [103, 1]]]
    }
  },
  'IN': {
    type: 'Feature',
    properties: { name: 'India' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[68, 6], [68, 36], [98, 36], [98, 6], [68, 6]]]
    }
  },
  'CN': {
    type: 'Feature',
    properties: { name: 'China' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[73, 18], [73, 54], [135, 54], [135, 18], [73, 18]]]
    }
  },
  'KR': {
    type: 'Feature',
    properties: { name: 'South Korea' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[124, 33], [124, 39], [132, 39], [132, 33], [124, 33]]]
    }
  },
  'IL': {
    type: 'Feature',
    properties: { name: 'Israel' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[34, 29], [34, 34], [36, 34], [36, 29], [34, 29]]]
    }
  },
  'AE': {
    type: 'Feature',
    properties: { name: 'United Arab Emirates' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[51, 22], [51, 27], [57, 27], [57, 22], [51, 22]]]
    }
  },
  'HK': {
    type: 'Feature',
    properties: { name: 'Hong Kong' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[113, 22], [113, 23], [115, 23], [115, 22], [113, 22]]]
    }
  },
  'TW': {
    type: 'Feature',
    properties: { name: 'Taiwan' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[119, 21], [119, 26], [123, 26], [123, 21], [119, 21]]]
    }
  },
  
  // Oceania
  'AU': {
    type: 'Feature',
    properties: { name: 'Australia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[113, -44], [113, -10], [154, -10], [154, -44], [113, -44]]]
    }
  },
  'NZ': {
    type: 'Feature',
    properties: { name: 'New Zealand' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[165, -48], [165, -33], [179, -33], [179, -48], [165, -48]]]
    }
  },
  
  // South America
  'BR': {
    type: 'Feature',
    properties: { name: 'Brazil' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-74, -34], [-74, 6], [-34, 6], [-34, -34], [-74, -34]]]
    }
  },
  'AR': {
    type: 'Feature',
    properties: { name: 'Argentina' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-74, -56], [-74, -21], [-53, -21], [-53, -56], [-74, -56]]]
    }
  },
  'CL': {
    type: 'Feature',
    properties: { name: 'Chile' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-76, -56], [-76, -17], [-66, -17], [-66, -56], [-76, -56]]]
    }
  },
  'CO': {
    type: 'Feature',
    properties: { name: 'Colombia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-80, -5], [-80, 14], [-66, 14], [-66, -5], [-80, -5]]]
    }
  },
  
  // Africa
  'ZA': {
    type: 'Feature',
    properties: { name: 'South Africa' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[16, -35], [16, -22], [33, -22], [33, -35], [16, -35]]]
    }
  },
  'NG': {
    type: 'Feature',
    properties: { name: 'Nigeria' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[2, 4], [2, 14], [15, 14], [15, 4], [2, 4]]]
    }
  },
  'EG': {
    type: 'Feature',
    properties: { name: 'Egypt' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[24, 22], [24, 32], [37, 32], [37, 22], [24, 22]]]
    }
  },
  'KE': {
    type: 'Feature',
    properties: { name: 'Kenya' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[33, -5], [33, 5], [42, 5], [42, -5], [33, -5]]]
    }
  },
};
