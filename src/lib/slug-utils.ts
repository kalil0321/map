/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique hash from a string
 */
export function generateHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a job URL slug from job data
 * Format: {company-slug}/{value}
 * where value is {title-slug}-{hash}
 * Uses ats_id or url for hash if id is empty
 */
export function generateJobSlug(title: string, id: string, company: string, atsId?: string, url?: string): string {
  const companySlug = slugify(company);
  const titleSlug = slugify(title);
  // Use ats_id or url for hash if id is empty (many CSVs don't have an id column)
  const hashSource = id || atsId || url || '';
  const hash = generateHash(hashSource);
  const value = `${titleSlug}-${hash}`;
  return `${companySlug}/${value}`;
}

/**
 * Parse a job slug to extract the hash (for backward compatibility with old format)
 */
export function parseJobSlug(slug: string): string | null {
  // Handle new format: company/value
  if (slug.includes('/')) {
    const parts = slug.split('/');
    if (parts.length >= 2) {
      const value = parts[parts.length - 1];
      const hashParts = value.split('-');
      return hashParts.length > 0 ? hashParts[hashParts.length - 1] : null;
    }
  }
  // Handle old format: title-hash
  const parts = slug.split('-');
  if (parts.length === 0) return null;
  return parts[parts.length - 1];
}

/**
 * Parse job path to extract company and value
 */
export function parseJobPath(path: string): { company: string; value: string } | null {
  const parts = path.split('/');
  if (parts.length >= 2) {
    return {
      company: parts[parts.length - 2],
      value: parts[parts.length - 1],
    };
  }
  return null;
}

/**
 * Generate a company URL slug
 * Format: /company/{company-name-slug}
 */
export function generateCompanySlug(companyName: string): string {
  return slugify(companyName);
}

/**
 * Find a job by matching the full slug (company/value)
 * This is more reliable than extracting the hash because title slugs can contain hyphens
 */
export function findJobBySlug<T extends { title: string; id: string; company: string; ats_id?: string; url?: string }>(
  jobs: T[],
  companySlug: string,
  valueSlug: string
): T | undefined {
  return jobs.find(job => {
    const expectedSlug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
    const expectedParts = expectedSlug.split('/');
    if (expectedParts.length !== 2) return false;

    const [expectedCompany, expectedValue] = expectedParts;
    return expectedCompany === companySlug && expectedValue === valueSlug;
  });
}
