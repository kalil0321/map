import type { JobMarker } from '@/types';

/**
 * Normalize job title for comparison (lowercase, trim, remove special chars)
 */
export function normalizeRole(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Extract base role name by removing seniority levels and normalizing variations
 */
export function extractBaseRole(title: string): string {
  const normalized = normalizeRole(title);

  // Remove common seniority prefixes
  const seniorityPatterns = [
    /^senior\s+/i,
    /^sr\s+/i,
    /^junior\s+/i,
    /^jr\s+/i,
    /^lead\s+/i,
    /^principal\s+/i,
    /^staff\s+/i,
    /^head\s+of\s+/i,
    /^director\s+of\s+/i,
    /^vp\s+of\s+/i,
    /^vice\s+president\s+of\s+/i,
    /\s+senior$/i,
    /\s+sr$/i,
    /\s+lead$/i,
    /\s+principal$/i,
    /\s+staff$/i,
  ];

  let baseRole = normalized;
  for (const pattern of seniorityPatterns) {
    baseRole = baseRole.replace(pattern, ' ').trim();
  }

  // Normalize common synonyms and variations
  const synonymMap: Record<string, string> = {
    'sde': 'software engineer',
    'sw engineer': 'software engineer',
    'software dev': 'software engineer',
    'developer': 'engineer',
    'dev': 'engineer',
    'swe': 'software engineer',
    'mle': 'machine learning engineer',
    'ml engineer': 'machine learning engineer',
    'ai engineer': 'machine learning engineer',
    'data sci': 'data scientist',
    'ds': 'data scientist',
    'pm': 'product manager',
    'product mgr': 'product manager',
    'eng': 'engineer',
    'engr': 'engineer',
  };

  // Handle plurals
  baseRole = baseRole.replace(/s$/, '');

  // Apply synonym mapping
  for (const [synonym, canonical] of Object.entries(synonymMap)) {
    if (baseRole.includes(synonym)) {
      baseRole = baseRole.replace(new RegExp(synonym.replace(/\s+/g, '\\s+'), 'g'), canonical);
    }
  }

  // Capitalize first letter of each word for display
  return baseRole
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Group jobs by normalized role
 */
export function groupRoles(jobs: JobMarker[]): Map<string, JobMarker[]> {
  const grouped = new Map<string, JobMarker[]>();

  jobs.forEach((job) => {
    const baseRole = extractBaseRole(job.title);
    const normalizedRole = normalizeRole(baseRole);

    if (!grouped.has(normalizedRole)) {
      grouped.set(normalizedRole, []);
    }
    grouped.get(normalizedRole)!.push(job);
  });

  return grouped;
}

/**
 * Get statistics for each role
 */
export function getRoleStats(jobs: JobMarker[]): Array<{
  role: string;
  baseRole: string;
  count: number;
  locations: Set<string>;
  companies: Set<string>;
}> {
  const grouped = groupRoles(jobs);
  const stats: Array<{
    role: string;
    baseRole: string;
    count: number;
    locations: Set<string>;
    companies: Set<string>;
  }> = [];

  grouped.forEach((roleJobs, normalizedRole) => {
    const baseRole = roleJobs.length > 0 ? extractBaseRole(roleJobs[0].title) : normalizedRole;
    const locations = new Set(roleJobs.map(job => job.location));
    const companies = new Set(roleJobs.map(job => job.company));

    stats.push({
      role: normalizedRole,
      baseRole,
      count: roleJobs.length,
      locations,
      companies,
    });
  });

  return stats.sort((a, b) => b.count - a.count);
}


