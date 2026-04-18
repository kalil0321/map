import type { JobMarker } from '@/types';

// Japan detection is location-based. We match common English and Japanese
// spellings plus major cities. Used by /japan/* and /ja/* pages for filtering.

const JAPAN_CITY_ALIASES: Record<string, string[]> = {
  tokyo: ['tokyo', '東京'],
  osaka: ['osaka', '大阪'],
  kyoto: ['kyoto', '京都'],
  yokohama: ['yokohama', '横浜'],
  fukuoka: ['fukuoka', '福岡'],
  nagoya: ['nagoya', '名古屋'],
  sapporo: ['sapporo', '札幌'],
  sendai: ['sendai', '仙台'],
};

export const JAPAN_CITIES = Object.keys(JAPAN_CITY_ALIASES);

export const JAPAN_CITY_DISPLAY: Record<string, { en: string; ja: string }> = {
  tokyo: { en: 'Tokyo', ja: '東京' },
  osaka: { en: 'Osaka', ja: '大阪' },
  kyoto: { en: 'Kyoto', ja: '京都' },
  yokohama: { en: 'Yokohama', ja: '横浜' },
  fukuoka: { en: 'Fukuoka', ja: '福岡' },
  nagoya: { en: 'Nagoya', ja: '名古屋' },
  sapporo: { en: 'Sapporo', ja: '札幌' },
  sendai: { en: 'Sendai', ja: '仙台' },
};

export function isJapanJob(job: JobMarker): boolean {
  const location = job.location.toLowerCase();
  if (
    location.includes('japan') ||
    location.includes('日本') ||
    location.includes('東京')
  ) {
    return true;
  }
  for (const aliases of Object.values(JAPAN_CITY_ALIASES)) {
    for (const alias of aliases) {
      if (location.includes(alias)) return true;
    }
  }
  return false;
}

export function isJapanCityJob(job: JobMarker, citySlug: string): boolean {
  const location = job.location.toLowerCase();
  const aliases = JAPAN_CITY_ALIASES[citySlug];
  if (!aliases) return false;
  return aliases.some((alias) => location.includes(alias));
}

export function filterJapanJobs(jobs: JobMarker[]): JobMarker[] {
  return jobs.filter(isJapanJob);
}

export function filterJapanCityJobs(jobs: JobMarker[], citySlug: string): JobMarker[] {
  return jobs.filter((job) => isJapanCityJob(job, citySlug));
}

export function getJapanCityStats(jobs: JobMarker[]): Array<{ slug: string; count: number }> {
  return JAPAN_CITIES.map((slug) => ({
    slug,
    count: jobs.filter((job) => isJapanCityJob(job, slug)).length,
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}
