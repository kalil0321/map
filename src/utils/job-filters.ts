import type { JobMarker } from '@/types';
import { formatSalary } from './salary-format';
import { getJobDate } from './date-format';
import { isJobInGeoFilter, getDefaultGeoFilter, type GeoFilter } from './geo-filter';

export type { GeoFilter } from './geo-filter';

export type ExperienceLevel = 'entry' | 'mid' | 'senior';

export interface FilterState {
  companies: string[];
  /** Companies to exclude from results (takes precedence over `companies`). */
  excludeCompanies: string[];
  locations: string[];
  /** Map-based geographic filter (continent / country / radius). */
  geoFilter: GeoFilter;
  searchText: string;
  postedWithin: number | null; // days
  remoteOnly: boolean;
  minSalary: number | null; // 1 = "has any salary"; 100000 = "$100k+", etc.
  experience: ExperienceLevel | null;
}

export const EMPTY_FILTERS: FilterState = {
  companies: [],
  excludeCompanies: [],
  locations: [],
  geoFilter: getDefaultGeoFilter(),
  searchText: '',
  postedWithin: null,
  remoteOnly: false,
  minSalary: null,
  experience: null,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function isRemoteJob(job: { location?: string | null }): boolean {
  return /\bremote\b/i.test(job.location || '');
}

export function jobHasSalary(job: JobMarker): boolean {
  return formatSalary(job) != null;
}

export function isNewJob(job: JobMarker, days = 7): boolean {
  const d = getJobDate(job);
  if (!d) return false;
  return d.getTime() >= Date.now() - days * DAY_MS;
}

// Years of experience parsed from the free-text field (e.g. "3-5 years" -> 3).
export function getExperienceYears(experience?: string | null): number {
  if (!experience) return Infinity;
  const m = experience.match(/\d+/);
  return m ? parseInt(m[0], 10) : Infinity;
}

export function matchesExperienceLevel(job: JobMarker, level: ExperienceLevel): boolean {
  const y = getExperienceYears(job.experience);
  if (!isFinite(y)) return false; // no data -> excluded when a level is requested
  if (level === 'entry') return y <= 2;
  if (level === 'mid') return y >= 3 && y <= 5;
  return y >= 6; // senior
}

// Numeric salary value used for "min salary" comparisons and salary sorting.
// Returns -1 when no salary could be parsed (sorts/filters to the end).
export function getSalaryValue(salarySummary: string | null | undefined): number {
  if (!salarySummary) return -1;

  const normalized = salarySummary.replace(/[$€£¥₹]/g, '');

  // dict format: {'unit': 'USD', 'amount': '140900.0'}
  const dictAmountMatch = normalized.match(/'amount':\s*['"]([^'"]+)['"]|"amount":\s*['"]([^'"]+)['"]/i);
  if (dictAmountMatch) {
    const amount = parseFloat(dictAmountMatch[1] || dictAmountMatch[2] || '');
    if (!isNaN(amount)) return amount + 0.5;
  }

  // range format: "145,000-175,000" or "145K-175K"
  const rangeMatch = normalized.match(/([\d,]+)\s*K?\s*[-–—]\s*([\d,]+)\s*K?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    if (/K/i.test(rangeMatch[0])) min = min * 1000;
    if (!isNaN(min)) return min;
  }

  // single value: "130900" or "130,900" or "145K"
  const singleMatch = normalized.match(/([\d,]+)\s*K?/i);
  if (singleMatch) {
    let amount = parseFloat(singleMatch[1].replace(/,/g, ''));
    if (/K/i.test(singleMatch[0])) amount = amount * 1000;
    if (!isNaN(amount)) return amount + 0.5;
  }

  return -1;
}

// Single source of truth for "does this job match the dialog filters".
// Used by the dialog (live count), the page (map markers), and elsewhere.
export function matchesFilters(job: JobMarker, f: FilterState): boolean {
  if (f.companies.length > 0 && !f.companies.includes(job.company)) return false;
  if (f.excludeCompanies?.length > 0 && f.excludeCompanies.includes(job.company)) return false;
  if (f.locations.length > 0 && !f.locations.includes(job.location)) return false;
  if (f.geoFilter && f.geoFilter.type !== 'none' && !isJobInGeoFilter(job.lat, job.lng, f.geoFilter)) return false;

  if (f.searchText.trim()) {
    const terms = f.searchText.toLowerCase().split(/\s+/).filter(Boolean);
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    const location = job.location.toLowerCase();
    const ok = terms.every(
      (t) => title.includes(t) || company.includes(t) || location.includes(t),
    );
    if (!ok) return false;
  }

  if (f.postedWithin != null) {
    const d = getJobDate(job);
    if (!d || d.getTime() < Date.now() - f.postedWithin * DAY_MS) return false;
  }

  if (f.remoteOnly && !isRemoteJob(job)) return false;
  if (f.minSalary != null && getSalaryValue(job.salary_summary) < f.minSalary) return false;
  if (f.experience && !matchesExperienceLevel(job, f.experience)) return false;

  return true;
}

export function countMatches(jobs: JobMarker[], f: FilterState): number {
  let n = 0;
  for (const job of jobs) if (matchesFilters(job, f)) n++;
  return n;
}

export function countActiveFilters(f: FilterState): number {
  return (
    f.companies.length +
    (f.excludeCompanies?.length || 0) +
    f.locations.length +
    (f.geoFilter && f.geoFilter.type !== 'none' ? 1 : 0) +
    (f.searchText.trim() ? 1 : 0) +
    (f.postedWithin != null ? 1 : 0) +
    (f.remoteOnly ? 1 : 0) +
    (f.minSalary != null ? 1 : 0) +
    (f.experience ? 1 : 0)
  );
}
