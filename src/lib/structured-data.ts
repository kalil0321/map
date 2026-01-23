import type { JobMarker } from '@/types';
import { formatSalary } from '@/utils/salary-format';
import { normalizeJobUrl } from '@/utils/url-utils';

/**
 * Generate JobPosting structured data (JSON-LD) for SEO
 * https://schema.org/JobPosting
 */
export function generateJobPostingSchema(job: JobMarker, jobUrl: string) {
  const postedDate =
    job.posted_at && !Number.isNaN(Date.parse(job.posted_at))
      ? new Date(job.posted_at)
      : new Date();

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: `${job.title} position at ${job.company} in ${job.location}. Apply now to join our team. Visit Stapply to discover more jobs at tech companies.`,
    datePosted: postedDate.toISOString().split('T')[0],
    validThrough: new Date(
      postedDate.getTime() + 60 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split('T')[0],
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: job.lat,
        longitude: job.lng,
      },
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: getCountryFromLocation(job.location),
    },
    jobLocationType: determineJobLocationType(job.location),
    employmentType: 'FULL_TIME',
    directApply: true,
    applicationContact: {
      '@type': 'ContactPoint',
      url: normalizeJobUrl(job.url),
    },
    identifier: {
      '@type': 'PropertyValue',
      name: 'Stapply Job ID',
      value: job.id,
    },
  };

  // Add salary and experience information if available
  const salaryFormatted = formatSalary(job);
  let descriptionParts = [`${job.title} position at ${job.company} in ${job.location}.`];

  if (salaryFormatted) {
    descriptionParts.push(`Salary: ${salaryFormatted}.`);
  }

  if (job.experience) {
    descriptionParts.push(`Experience required: ${job.experience}.`);
  }

  descriptionParts.push('Apply now to join our team. Visit Stapply to discover more jobs at tech companies.');
  schema.description = descriptionParts.join(' ');

  return schema;
}

/**
 * Extract country from location string
 */
function getCountryFromLocation(location: string): string {
  // Common patterns: "City, Country" or "City, State, Country" or "Remote" or "Country"
  const parts = location.split(',').map(p => p.trim());

  // If "Remote" or similar
  if (location.toLowerCase().includes('remote')) {
    return 'Worldwide';
  }

  // Take the last part as country
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }

  return location;
}

/**
 * Determine job location type based on location string
 */
function determineJobLocationType(location: string): string {
  const locationLower = location.toLowerCase();

  if (locationLower.includes('remote')) {
    return 'TELECOMMUTE';
  }

  return 'ONSITE'; // Default
}

/**
 * Generate BreadcrumbList structured data (JSON-LD) for SEO
 * https://schema.org/BreadcrumbList
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
