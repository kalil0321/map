import type { JobMarker } from '@/types';

/**
 * Keywords that indicate an internship or early career position
 */
const INTERNSHIP_KEYWORDS = [
  'intern',
  'internship',
  'graduate',
  'new grad',
  'new-grad',
  'newgrad',
  'university graduate',
  'university grad',
  'college graduate',
  'recent graduate',
  'entry level',
  'entry-level',
  'summer 2025',
  'summer 2026',
  'winter 2025',
  'winter 2026',
  'fall 2025',
  'fall 2026',
  '2025 intern',
  '2026 intern',
  '2025 graduate',
  '2026 graduate',
  'early career',
  'campus',
  'undergraduate',
  'phd intern',
  'masters intern',
  'mba intern',
];

/**
 * Keywords that should NOT trigger internship matching (false positives)
 */
const EXCLUDE_KEYWORDS = [
  'internal',
  'international',
  'internal tools',
  'internal systems',
  'internal audit',
];

/**
 * Check if a job title indicates an internship or early career position
 */
export function isInternshipJob(job: JobMarker): boolean {
  const titleLower = job.title.toLowerCase();
  
  // Check for exclusion keywords first
  for (const exclude of EXCLUDE_KEYWORDS) {
    // Only exclude if the word is standalone (not part of "intern" pattern)
    if (titleLower.includes(exclude) && !titleLower.includes('intern')) {
      return false;
    }
  }
  
  // Check for internship keywords
  for (const keyword of INTERNSHIP_KEYWORDS) {
    if (titleLower.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter jobs to get only internship positions
 */
export function filterInternshipJobs(jobs: JobMarker[]): JobMarker[] {
  return jobs.filter(isInternshipJob);
}

/**
 * Get internship statistics by company
 */
export interface InternshipCompanyStats {
  company: string;
  companySlug: string;
  count: number;
  locations: string[];
  sampleTitles: string[];
}

/**
 * Generate a URL-friendly slug from company name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get companies with their internship counts, sorted by count descending
 */
export function getInternshipCompanyStats(jobs: JobMarker[]): InternshipCompanyStats[] {
  const internshipJobs = filterInternshipJobs(jobs);
  
  const companyMap = new Map<string, {
    jobs: JobMarker[];
    locations: Set<string>;
  }>();
  
  for (const job of internshipJobs) {
    const existing = companyMap.get(job.company);
    if (existing) {
      existing.jobs.push(job);
      existing.locations.add(job.location);
    } else {
      companyMap.set(job.company, {
        jobs: [job],
        locations: new Set([job.location]),
      });
    }
  }
  
  const stats: InternshipCompanyStats[] = [];
  
  for (const [company, data] of companyMap.entries()) {
    stats.push({
      company,
      companySlug: slugify(company),
      count: data.jobs.length,
      locations: Array.from(data.locations),
      sampleTitles: data.jobs.slice(0, 5).map(j => j.title),
    });
  }
  
  // Sort by count descending
  return stats.sort((a, b) => b.count - a.count);
}

/**
 * Get companies that meet the minimum threshold for an internship hub page
 */
export function getQualifyingInternshipCompanies(
  jobs: JobMarker[],
  minJobs: number = 4
): InternshipCompanyStats[] {
  return getInternshipCompanyStats(jobs).filter(stat => stat.count >= minJobs);
}

/**
 * Get internship jobs for a specific company
 */
export function getCompanyInternships(jobs: JobMarker[], companySlug: string): JobMarker[] {
  return filterInternshipJobs(jobs).filter(
    job => slugify(job.company) === companySlug
  );
}

/**
 * Get the display name for a company from its slug
 */
export function getCompanyDisplayName(jobs: JobMarker[], companySlug: string): string | null {
  const job = jobs.find(j => slugify(j.company) === companySlug);
  return job ? job.company : null;
}
