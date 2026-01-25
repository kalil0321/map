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
    employmentType: determineEmploymentType(job.title),
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

  // Add actual job description if available
  if (job.description && job.description.length > 50) {
    // Use actual description if substantial
    const cleanDescription = job.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (cleanDescription.length > 50) {
      schema.description = cleanDescription.substring(0, 5000); // Google's limit
    }
  } else {
    // Fallback to generated description
    let descriptionParts = [`${job.title} position at ${job.company} in ${job.location}.`];

    const salaryFormatted = formatSalary(job);
    if (salaryFormatted) {
      descriptionParts.push(`Salary: ${salaryFormatted}.`);
    }

    if (job.experience) {
      descriptionParts.push(`Experience required: ${job.experience}.`);
    }

    descriptionParts.push('Apply now to join our team. Visit Stapply to discover more jobs at tech companies.');
    schema.description = descriptionParts.join(' ');
  }

  // Add structured salary data if available
  if (job.salary_currency && job.salary_summary) {
    const salaryParts = job.salary_summary.split(' - ');
    if (salaryParts.length === 2) {
      const minSalary = parseFloat(salaryParts[0].replace(/[^0-9.]/g, ''));
      const maxSalary = parseFloat(salaryParts[1].replace(/[^0-9.]/g, ''));

      if (!isNaN(minSalary) && !isNaN(maxSalary)) {
        schema.baseSalary = {
          '@type': 'MonetaryAmount',
          currency: job.salary_currency,
          value: {
            '@type': 'QuantitativeValue',
            minValue: minSalary,
            maxValue: maxSalary,
            unitText: job.salary_period === '1 YEAR' ? 'YEAR' : job.salary_period || 'YEAR',
          },
        };
      }
    }
  }

  // Add experience requirements if available
  if (job.experience) {
    schema.experienceRequirements = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: parseInt(job.experience) * 12 || 0,
    };
  }

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
 * Determine employment type based on job title
 */
function determineEmploymentType(title: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('intern') || titleLower.includes('internship')) {
    return 'INTERN';
  }

  if (titleLower.includes('part-time') || titleLower.includes('part time')) {
    return 'PART_TIME';
  }

  if (titleLower.includes('contract') || titleLower.includes('contractor')) {
    return 'CONTRACTOR';
  }

  if (titleLower.includes('temporary') || titleLower.includes('temp')) {
    return 'TEMPORARY';
  }

  return 'FULL_TIME'; // Default
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
