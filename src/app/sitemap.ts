import { MetadataRoute } from 'next';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateJobSlug, generateCompanySlug, generateRoleSlug, generateLocationSlug } from '@/lib/slug-utils';
import { extractBaseRole, getRoleStats } from '@/utils/role-utils';
import { getLocationStats } from '@/utils/location-utils';
import { filterInternshipJobs, getQualifyingInternshipCompanies } from '@/utils/internship-utils';
import { filterJapanJobs, getJapanCityStats } from '@/utils/japan-utils';

const URLS_PER_SITEMAP = 45000; // Safe buffer under Google's 50k limit
const MIN_JOBS_FOR_LISTING = 5; // Minimum jobs required for role/location pages
// Google Jobs drops listings that appear stale. Hide anything older than this
// from the sitemap so crawl budget goes to fresh, indexable postings.
const MAX_JOB_AGE_DAYS = 45;

function parseJobDate(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

// Helper to build all sitemap entries
async function buildAllSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://map.stapply.ai';
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const cutoff = Date.now() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000;
  const jobs = allJobs.filter((job) => {
    const ts = parseJobDate(job.posted_at);
    // If there's no date, include it (legacy rows) rather than hide everything.
    return Number.isNaN(ts) ? true : ts >= cutoff;
  });

  // 1. Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/roles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/locations`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/internships`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/japan`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/ja`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
  ];

  // 1b. Japan city pages (English) + Japanese mirrors.
  const japanJobs = filterJapanJobs(jobs);
  const japanCities = getJapanCityStats(japanJobs);
  const japanCityPages: MetadataRoute.Sitemap = japanCities.flatMap(({ slug }) => [
    {
      url: `${baseUrl}/japan/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/ja/${slug}-kyujin`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
  ]);

  // 1c. Japanese company pages (/ja/{company}-kyujin) for companies with at
  // least one Japan-based job.
  const japanCompanySlugs = new Set(japanJobs.map((j) => generateCompanySlug(j.company)));
  const jaCompanyPages: MetadataRoute.Sitemap = Array.from(japanCompanySlugs).map((slug) => ({
    url: `${baseUrl}/ja/${slug}-kyujin`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 2. Company pages (unique companies)
  const companyMap = new Map<string, string>();
  jobs.forEach((job) => {
    const companySlug = generateCompanySlug(job.company);
    if (!companyMap.has(companySlug)) {
      companyMap.set(companySlug, job.company);
    }
  });
  const companyPages: MetadataRoute.Sitemap = Array.from(companyMap.keys()).map((companySlug) => ({
    url: `${baseUrl}/jobs/${companySlug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 3. Role pages (only roles with >= MIN_JOBS_FOR_LISTING jobs)
  const roleStats = getRoleStats(jobs).filter(stat => stat.count >= MIN_JOBS_FOR_LISTING);
  const rolePages: MetadataRoute.Sitemap = roleStats.map((stat) => ({
    url: `${baseUrl}/roles/${generateRoleSlug(stat.baseRole)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 4. Location pages (only locations with >= MIN_JOBS_FOR_LISTING jobs)
  const locationStats = getLocationStats(jobs).filter(stat => stat.count >= MIN_JOBS_FOR_LISTING);
  const locationPages: MetadataRoute.Sitemap = locationStats.map((stat) => ({
    url: `${baseUrl}/locations/${generateLocationSlug(stat.baseLocation)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 5. Internship pages (companies with 4+ internships)
  const internshipCompanies = getQualifyingInternshipCompanies(jobs, 4);
  const internshipPages: MetadataRoute.Sitemap = internshipCompanies.map((company) => ({
    url: `${baseUrl}/internships/${company.companySlug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 5b. Programmatic by-role internship pages (e.g. /internships/role/software-engineer).
  // High-signal long-tail queries like "software engineer intern", "ml engineering
  // internship" already rank us ~position 2; these give each cluster a dedicated page.
  const internsByRoleCounts = new Map<string, number>();
  for (const job of filterInternshipJobs(jobs)) {
    const slug = generateRoleSlug(extractBaseRole(job.title));
    internsByRoleCounts.set(slug, (internsByRoleCounts.get(slug) ?? 0) + 1);
  }
  const internshipRolePages: MetadataRoute.Sitemap = Array.from(internsByRoleCounts.entries())
    .filter(([, count]) => count >= 5)
    .map(([slug]) => ({
      url: `${baseUrl}/internships/role/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  // 6. Job pages (fresh only). Use the job's own posted_at for lastModified so
  // Google Jobs has an accurate freshness signal per URL.
  const jobPages: MetadataRoute.Sitemap = jobs.map((job) => {
    const ts = parseJobDate(job.posted_at);
    const lastModified = Number.isNaN(ts) ? new Date() : new Date(ts);
    return {
      url: `${baseUrl}/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    };
  });

  return [
    ...staticPages,
    ...japanCityPages,
    ...jaCompanyPages,
    ...companyPages,
    ...rolePages,
    ...locationPages,
    ...internshipPages,
    ...internshipRolePages,
    ...jobPages,
  ];
}

// Generate sitemap IDs based on total URL count
export async function generateSitemaps() {
  const allEntries = await buildAllSitemapEntries();
  const numSitemaps = Math.ceil(allEntries.length / URLS_PER_SITEMAP);
  return Array.from({ length: numSitemaps }, (_, i) => ({ id: i }));
}

// Generate sitemap for specific ID
export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const start = id * URLS_PER_SITEMAP;
  const end = start + URLS_PER_SITEMAP;

  try {
    const allEntries = await buildAllSitemapEntries();
    return allEntries.slice(start, end);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
}
