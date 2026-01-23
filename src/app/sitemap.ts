import { MetadataRoute } from 'next';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateJobSlug, generateCompanySlug, generateRoleSlug, generateLocationSlug } from '@/lib/slug-utils';
import { getRoleStats } from '@/utils/role-utils';
import { getLocationStats } from '@/utils/location-utils';
import { getQualifyingInternshipCompanies } from '@/utils/internship-utils';

const URLS_PER_SITEMAP = 45000; // Safe buffer under Google's 50k limit
const MIN_JOBS_FOR_LISTING = 5; // Minimum jobs required for role/location pages

// Helper to build all sitemap entries
async function buildAllSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://map.stapply.ai';
  const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

  // 1. Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/roles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/locations`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/internships`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
  ];

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

  // 6. Job pages (all jobs)
  const jobPages: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...companyPages, ...rolePages, ...locationPages, ...internshipPages, ...jobPages];
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
