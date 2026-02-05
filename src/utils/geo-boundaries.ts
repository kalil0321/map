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
  { code: 'GR', name: 'Greece', continent: 'europe' },
  { code: 'CZ', name: 'Czech Republic', continent: 'europe' },
  { code: 'HU', name: 'Hungary', continent: 'europe' },
  { code: 'RO', name: 'Romania', continent: 'europe' },
  { code: 'BG', name: 'Bulgaria', continent: 'europe' },
  { code: 'HR', name: 'Croatia', continent: 'europe' },
  { code: 'SI', name: 'Slovenia', continent: 'europe' },
  { code: 'SK', name: 'Slovakia', continent: 'europe' },
  { code: 'LT', name: 'Lithuania', continent: 'europe' },
  { code: 'LV', name: 'Latvia', continent: 'europe' },
  { code: 'EE', name: 'Estonia', continent: 'europe' },
  { code: 'LU', name: 'Luxembourg', continent: 'europe' },
  { code: 'MT', name: 'Malta', continent: 'europe' },
  { code: 'CY', name: 'Cyprus', continent: 'europe' },
  { code: 'IS', name: 'Iceland', continent: 'europe' },
  { code: 'UA', name: 'Ukraine', continent: 'europe' },
  { code: 'TR', name: 'Turkey', continent: 'europe' },
  
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
  { code: 'TH', name: 'Thailand', continent: 'asia' },
  { code: 'VN', name: 'Vietnam', continent: 'asia' },
  { code: 'MY', name: 'Malaysia', continent: 'asia' },
  { code: 'ID', name: 'Indonesia', continent: 'asia' },
  { code: 'PH', name: 'Philippines', continent: 'asia' },
  { code: 'PK', name: 'Pakistan', continent: 'asia' },
  { code: 'BD', name: 'Bangladesh', continent: 'asia' },
  { code: 'LK', name: 'Sri Lanka', continent: 'asia' },
  { code: 'QA', name: 'Qatar', continent: 'asia' },
  { code: 'SA', name: 'Saudi Arabia', continent: 'asia' },
  { code: 'KW', name: 'Kuwait', continent: 'asia' },
  { code: 'BH', name: 'Bahrain', continent: 'asia' },
  { code: 'OM', name: 'Oman', continent: 'asia' },
  
  // Oceania
  { code: 'AU', name: 'Australia', continent: 'oceania' },
  { code: 'NZ', name: 'New Zealand', continent: 'oceania' },
  
  // South America
  { code: 'BR', name: 'Brazil', continent: 'south-america' },
  { code: 'AR', name: 'Argentina', continent: 'south-america' },
  { code: 'CL', name: 'Chile', continent: 'south-america' },
  { code: 'CO', name: 'Colombia', continent: 'south-america' },
  { code: 'PE', name: 'Peru', continent: 'south-america' },
  { code: 'VE', name: 'Venezuela', continent: 'south-america' },
  { code: 'EC', name: 'Ecuador', continent: 'south-america' },
  { code: 'UY', name: 'Uruguay', continent: 'south-america' },
  { code: 'PY', name: 'Paraguay', continent: 'south-america' },
  { code: 'BO', name: 'Bolivia', continent: 'south-america' },
  
  // Africa
  { code: 'ZA', name: 'South Africa', continent: 'africa' },
  { code: 'NG', name: 'Nigeria', continent: 'africa' },
  { code: 'EG', name: 'Egypt', continent: 'africa' },
  { code: 'KE', name: 'Kenya', continent: 'africa' },
  { code: 'MA', name: 'Morocco', continent: 'africa' },
  { code: 'GH', name: 'Ghana', continent: 'africa' },
  { code: 'ET', name: 'Ethiopia', continent: 'africa' },
  { code: 'TZ', name: 'Tanzania', continent: 'africa' },
  { code: 'UG', name: 'Uganda', continent: 'africa' },
  { code: 'RW', name: 'Rwanda', continent: 'africa' },
  { code: 'TN', name: 'Tunisia', continent: 'africa' },
  { code: 'DZ', name: 'Algeria', continent: 'africa' },
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
  'GR': {
    type: 'Feature',
    properties: { name: 'Greece' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[19, 34], [19, 42], [30, 42], [30, 34], [19, 34]]]
    }
  },
  'CZ': {
    type: 'Feature',
    properties: { name: 'Czech Republic' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[12, 48], [12, 51], [19, 51], [19, 48], [12, 48]]]
    }
  },
  'HU': {
    type: 'Feature',
    properties: { name: 'Hungary' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[16, 45], [16, 49], [23, 49], [23, 45], [16, 45]]]
    }
  },
  'RO': {
    type: 'Feature',
    properties: { name: 'Romania' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[20, 43], [20, 48], [30, 48], [30, 43], [20, 43]]]
    }
  },
  'BG': {
    type: 'Feature',
    properties: { name: 'Bulgaria' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[22, 41], [22, 44], [29, 44], [29, 41], [22, 41]]]
    }
  },
  'HR': {
    type: 'Feature',
    properties: { name: 'Croatia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[13, 42], [13, 47], [20, 47], [20, 42], [13, 42]]]
    }
  },
  'SI': {
    type: 'Feature',
    properties: { name: 'Slovenia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[13, 45], [13, 47], [17, 47], [17, 45], [13, 45]]]
    }
  },
  'SK': {
    type: 'Feature',
    properties: { name: 'Slovakia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[17, 47], [17, 50], [23, 50], [23, 47], [17, 47]]]
    }
  },
  'LT': {
    type: 'Feature',
    properties: { name: 'Lithuania' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[21, 53], [21, 57], [27, 57], [27, 53], [21, 53]]]
    }
  },
  'LV': {
    type: 'Feature',
    properties: { name: 'Latvia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[21, 55], [21, 59], [29, 59], [29, 55], [21, 55]]]
    }
  },
  'EE': {
    type: 'Feature',
    properties: { name: 'Estonia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[22, 57], [22, 60], [29, 60], [29, 57], [22, 57]]]
    }
  },
  'LU': {
    type: 'Feature',
    properties: { name: 'Luxembourg' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[5, 49], [5, 51], [7, 51], [7, 49], [5, 49]]]
    }
  },
  'MT': {
    type: 'Feature',
    properties: { name: 'Malta' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[14, 35], [14, 37], [15, 37], [15, 35], [14, 35]]]
    }
  },
  'CY': {
    type: 'Feature',
    properties: { name: 'Cyprus' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[32, 34], [32, 36], [35, 36], [35, 34], [32, 34]]]
    }
  },
  'IS': {
    type: 'Feature',
    properties: { name: 'Iceland' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-25, 63], [-25, 67], [-13, 67], [-13, 63], [-25, 63]]]
    }
  },
  'UA': {
    type: 'Feature',
    properties: { name: 'Ukraine' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[22, 44], [22, 53], [41, 53], [41, 44], [22, 44]]]
    }
  },
  'TR': {
    type: 'Feature',
    properties: { name: 'Turkey' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[26, 36], [26, 42], [45, 42], [45, 36], [26, 36]]]
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
  'TH': {
    type: 'Feature',
    properties: { name: 'Thailand' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[97, 5], [97, 21], [106, 21], [106, 5], [97, 5]]]
    }
  },
  'VN': {
    type: 'Feature',
    properties: { name: 'Vietnam' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[102, 8], [102, 24], [110, 24], [110, 8], [102, 8]]]
    }
  },
  'MY': {
    type: 'Feature',
    properties: { name: 'Malaysia' },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [[[99, 2], [99, 7], [120, 7], [120, 2], [99, 2]]],
        [[[109, 0], [109, 5], [119, 5], [119, 0], [109, 0]]]
      ]
    }
  },
  'ID': {
    type: 'Feature',
    properties: { name: 'Indonesia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[95, -11], [95, 6], [141, 6], [141, -11], [95, -11]]]
    }
  },
  'PH': {
    type: 'Feature',
    properties: { name: 'Philippines' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[117, 5], [117, 20], [127, 20], [127, 5], [117, 5]]]
    }
  },
  'PK': {
    type: 'Feature',
    properties: { name: 'Pakistan' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[60, 23], [60, 38], [77, 38], [77, 23], [60, 23]]]
    }
  },
  'BD': {
    type: 'Feature',
    properties: { name: 'Bangladesh' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[88, 20], [88, 27], [93, 27], [93, 20], [88, 20]]]
    }
  },
  'LK': {
    type: 'Feature',
    properties: { name: 'Sri Lanka' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[79, 5], [79, 10], [82, 10], [82, 5], [79, 5]]]
    }
  },
  'QA': {
    type: 'Feature',
    properties: { name: 'Qatar' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[50, 24], [50, 27], [52, 27], [52, 24], [50, 24]]]
    }
  },
  'SA': {
    type: 'Feature',
    properties: { name: 'Saudi Arabia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[34, 16], [34, 32], [56, 32], [56, 16], [34, 16]]]
    }
  },
  'KW': {
    type: 'Feature',
    properties: { name: 'Kuwait' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[47, 28], [47, 31], [49, 31], [49, 28], [47, 28]]]
    }
  },
  'BH': {
    type: 'Feature',
    properties: { name: 'Bahrain' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[50, 25], [50, 27], [51, 27], [51, 25], [50, 25]]]
    }
  },
  'OM': {
    type: 'Feature',
    properties: { name: 'Oman' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[52, 17], [52, 27], [60, 27], [60, 17], [52, 17]]]
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
  'PE': {
    type: 'Feature',
    properties: { name: 'Peru' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-82, -19], [-82, 0], [-68, 0], [-68, -19], [-82, -19]]]
    }
  },
  'VE': {
    type: 'Feature',
    properties: { name: 'Venezuela' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-74, 1], [-74, 13], [-59, 13], [-59, 1], [-74, 1]]]
    }
  },
  'EC': {
    type: 'Feature',
    properties: { name: 'Ecuador' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-82, -5], [-82, 2], [-75, 2], [-75, -5], [-82, -5]]]
    }
  },
  'UY': {
    type: 'Feature',
    properties: { name: 'Uruguay' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-59, -35], [-59, -30], [-52, -30], [-52, -35], [-59, -35]]]
    }
  },
  'PY': {
    type: 'Feature',
    properties: { name: 'Paraguay' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-63, -28], [-63, -19], [-54, -19], [-54, -28], [-63, -28]]]
    }
  },
  'BO': {
    type: 'Feature',
    properties: { name: 'Bolivia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-70, -23], [-70, -10], [-57, -10], [-57, -23], [-70, -23]]]
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
  'MA': {
    type: 'Feature',
    properties: { name: 'Morocco' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-13, 28], [-13, 36], [-1, 36], [-1, 28], [-13, 28]]]
    }
  },
  'GH': {
    type: 'Feature',
    properties: { name: 'Ghana' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-4, 4], [-4, 12], [2, 12], [2, 4], [-4, 4]]]
    }
  },
  'ET': {
    type: 'Feature',
    properties: { name: 'Ethiopia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[33, 3], [33, 19], [48, 19], [48, 3], [33, 3]]]
    }
  },
  'TZ': {
    type: 'Feature',
    properties: { name: 'Tanzania' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[30, -12], [30, 0], [41, 0], [41, -12], [30, -12]]]
    }
  },
  'UG': {
    type: 'Feature',
    properties: { name: 'Uganda' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[30, -2], [30, 5], [35, 5], [35, -2], [30, -2]]]
    }
  },
  'RW': {
    type: 'Feature',
    properties: { name: 'Rwanda' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[29, -3], [29, -1], [31, -1], [31, -3], [29, -3]]]
    }
  },
  'TN': {
    type: 'Feature',
    properties: { name: 'Tunisia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[7, 30], [7, 38], [12, 38], [12, 30], [7, 30]]]
    }
  },
  'DZ': {
    type: 'Feature',
    properties: { name: 'Algeria' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-9, 19], [-9, 37], [12, 37], [12, 19], [-9, 19]]]
    }
  },
};
