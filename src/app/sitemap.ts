import { MetadataRoute } from 'next';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  generateJobSlug,
  generateCompanySlug,
  generateRoleSlug,
  generateLocationSlug,
} from '@/lib/slug-utils';
import { extractBaseRole, getRoleStats } from '@/utils/role-utils';
import { getLocationStats } from '@/utils/location-utils';
import { filterInternshipJobs, getQualifyingInternshipCompanies } from '@/utils/internship-utils';
import { filterJapanJobs, getJapanCityStats } from '@/utils/japan-utils';
import type { JobMarker } from '@/types';

const URLS_PER_SITEMAP = 45000; // Safe buffer under Google's 50k limit

// Quality thresholds. The sitemap is the crawl-budget signal — a lean
// sitemap of strong pages beats a 40k-URL dump that dilutes authority.
// Tuned against Search Console data (Apr 2026): pages under these
// thresholds were getting 0 impressions anyway.
const MIN_JOBS_FOR_ROLE_PAGE = 10;
const MIN_JOBS_FOR_LOCATION_PAGE = 10;
const MIN_JOBS_FOR_COMPANY_PAGE = 3;
const MIN_JOBS_FOR_INTERNSHIP_COMPANY = 4;
const MIN_JOBS_FOR_INTERNSHIP_ROLE = 5;
// Google Jobs drops listings that appear stale. 30d matches the employer
// ATS norm better than 45d.
const MAX_JOB_AGE_DAYS = 30;

function parseJobDate(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

// Deduplicate jobs that share the same role at the same company & location,
// keeping the freshest. Duplicate postings arise when a company re-lists the
// same role on multiple ATS boards, or when crawl runs overlap.
function dedupeJobs(jobs: JobMarker[]): JobMarker[] {
  const byKey = new Map<string, JobMarker>();
  for (const job of jobs) {
    const key = [
      job.company.toLowerCase().trim(),
      job.title.toLowerCase().trim(),
      job.location.toLowerCase().trim(),
    ].join('|');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, job);
      continue;
    }
    const existingTs = parseJobDate(existing.posted_at);
    const candidateTs = parseJobDate(job.posted_at);
    if (!Number.isNaN(candidateTs) && (Number.isNaN(existingTs) || candidateTs > existingTs)) {
      byKey.set(key, job);
    }
  }
  return Array.from(byKey.values());
}

// Remove listings Google is unlikely to rank: no date at all, title-only
// placeholders, or matches that already lost long ago.
function filterSitemapQualityJobs(jobs: JobMarker[]): JobMarker[] {
  const cutoff = Date.now() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000;
  return jobs.filter((job) => {
    const ts = parseJobDate(job.posted_at);
    // Require a real posted date — most "undated" rows are stale imports.
    if (Number.isNaN(ts)) return false;
    if (ts < cutoff) return false;
    if (!job.title || job.title.trim().length < 3) return false;
    if (!job.company || !job.url) return false;
    return true;
  });
}

async function buildAllSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://map.stapply.ai';
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const qualityJobs = dedupeJobs(filterSitemapQualityJobs(allJobs));

  // Aggregate pages (company/role/location) are computed from the full fresh
  // set — we still want these pages to exist even if some of their underlying
  // jobs don't make it into the job URL list.
  const aggregateSourceJobs = allJobs; // gives richer aggregates than the 30d slice

  // 1. Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/roles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/locations`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/internships`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/japan`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/ja`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
  ];

  // 1b. Japan hub cities (only cities with real job volume appear in
  // getJapanCityStats).
  const japanJobsForAggregates = filterJapanJobs(aggregateSourceJobs);
  const japanCities = getJapanCityStats(japanJobsForAggregates);
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

  // 1c. /ja/{company}-kyujin — only companies that actually have Japan-based
  // jobs (not every company in the dataset).
  const japanCompanySlugs = new Set(japanJobsForAggregates.map((j) => generateCompanySlug(j.company)));
  const jaCompanyPages: MetadataRoute.Sitemap = Array.from(japanCompanySlugs).map((slug) => ({
    url: `${baseUrl}/ja/${slug}-kyujin`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 2. Company pages — only companies with ≥ MIN_JOBS_FOR_COMPANY_PAGE.
  const companyCounts = new Map<string, { name: string; count: number }>();
  for (const job of aggregateSourceJobs) {
    const slug = generateCompanySlug(job.company);
    const existing = companyCounts.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      companyCounts.set(slug, { name: job.company, count: 1 });
    }
  }
  const companyPages: MetadataRoute.Sitemap = Array.from(companyCounts.entries())
    .filter(([, info]) => info.count >= MIN_JOBS_FOR_COMPANY_PAGE)
    .map(([slug]) => ({
      url: `${baseUrl}/jobs/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  // 3. Role pages — raised to MIN_JOBS_FOR_ROLE_PAGE. Roles below this
  // threshold are either very niche or duplicates introduced by the role
  // normalizer and don't rank.
  const roleStats = getRoleStats(aggregateSourceJobs).filter(
    (stat) => stat.count >= MIN_JOBS_FOR_ROLE_PAGE,
  );
  const rolePages: MetadataRoute.Sitemap = roleStats.map((stat) => ({
    url: `${baseUrl}/roles/${generateRoleSlug(stat.baseRole)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 4. Location pages — raised threshold for the same reason.
  const locationStats = getLocationStats(aggregateSourceJobs).filter(
    (stat) => stat.count >= MIN_JOBS_FOR_LOCATION_PAGE,
  );
  const locationPages: MetadataRoute.Sitemap = locationStats.map((stat) => ({
    url: `${baseUrl}/locations/${generateLocationSlug(stat.baseLocation)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 5. Internship company pages
  const internshipCompanies = getQualifyingInternshipCompanies(
    aggregateSourceJobs,
    MIN_JOBS_FOR_INTERNSHIP_COMPANY,
  );
  const internshipPages: MetadataRoute.Sitemap = internshipCompanies.map((company) => ({
    url: `${baseUrl}/internships/${company.companySlug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 5b. Programmatic by-role internship pages.
  const internsByRoleCounts = new Map<string, number>();
  for (const job of filterInternshipJobs(aggregateSourceJobs)) {
    const slug = generateRoleSlug(extractBaseRole(job.title));
    internsByRoleCounts.set(slug, (internsByRoleCounts.get(slug) ?? 0) + 1);
  }
  const internshipRolePages: MetadataRoute.Sitemap = Array.from(internsByRoleCounts.entries())
    .filter(([, count]) => count >= MIN_JOBS_FOR_INTERNSHIP_ROLE)
    .map(([slug]) => ({
      url: `${baseUrl}/internships/role/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  // 6. Job pages — fresh, deduped, quality-filtered. Each URL is a single
  // unique posting that's actually worth spending Google's crawl budget on.
  // URL-level dedup protects against the same slug appearing twice (which
  // would waste the Sitemap lastmod signal).
  const seenJobUrls = new Set<string>();
  const jobPages: MetadataRoute.Sitemap = [];
  for (const job of qualityJobs) {
    const slug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
    if (seenJobUrls.has(slug)) continue;
    seenJobUrls.add(slug);
    const ts = parseJobDate(job.posted_at);
    jobPages.push({
      url: `${baseUrl}/jobs/${slug}`,
      lastModified: Number.isNaN(ts) ? new Date() : new Date(ts),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    });
  }

  const entries: MetadataRoute.Sitemap = [
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

  // Final belt-and-suspenders dedup — nothing should appear twice across
  // categories.
  const seenUrls = new Set<string>();
  return entries.filter((e) => {
    if (seenUrls.has(e.url)) return false;
    seenUrls.add(e.url);
    return true;
  });
}

// Generate sitemap IDs based on total URL count
export async function generateSitemaps() {
  const allEntries = await buildAllSitemapEntries();
  const numSitemaps = Math.max(1, Math.ceil(allEntries.length / URLS_PER_SITEMAP));
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
