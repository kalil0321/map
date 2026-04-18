import { NextResponse } from 'next/server';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { buildJobIndexCached, findJobBySlugFast } from '@/utils/job-index';
import { getRoleStats, extractBaseRole } from '@/utils/role-utils';
import { getLocationStats } from '@/utils/location-utils';
import {
  getQualifyingInternshipCompanies,
  getCompanyInternships,
  getCompanyDisplayName,
} from '@/utils/internship-utils';
import {
  generateCompanySlug,
  generateJobSlug,
  generateRoleSlug,
  generateLocationSlug,
} from '@/lib/slug-utils';
import { fetchJobDetailsFromDb } from '@/utils/db-query';
import { formatSalary } from '@/utils/salary-format';
import type { JobMarker } from '@/types';

// Markdown endpoint for LLM crawlers (ChatGPT, Perplexity, Claude, Gemini).
// Mirrors the site's structure at /md/... so LLM citations link back here.
//
// Supported paths:
//   /md                             -> index (like llms.txt, human-friendly)
//   /md/jobs/{company}/{value}      -> single job
//   /md/company/{slug}              -> company overview
//   /md/roles/{slug}                -> role overview
//   /md/locations/{slug}            -> location overview
//   /md/internships/{company-slug}  -> internships at a company

export const revalidate = 3600;

const BASE = 'https://map.stapply.ai';

function markdown(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

function notFound(path: string) {
  return new NextResponse(`# Not found\n\nNo markdown view exists for /${path}.\n`, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

function esc(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\r/g, '').trim();
}

function jobLine(job: JobMarker): string {
  const salary = formatSalary(job);
  const bits = [job.location, salary].filter(Boolean).join(' · ');
  const slug = `${BASE}/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`;
  return `- [${job.title}](${slug})${bits ? ` — ${bits}` : ''}`;
}

async function renderJob(companySlug: string, valueSlug: string) {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const jobIndex = buildJobIndexCached(allJobs);
  const job = findJobBySlugFast(jobIndex, companySlug, valueSlug);
  if (!job) return null;

  const details = await fetchJobDetailsFromDb(job.ats_id, job.url);
  const description = (details?.description ?? job.description ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const salary = formatSalary(job);
  const posted = job.posted_at ? new Date(job.posted_at).toISOString().slice(0, 10) : null;

  const related = allJobs
    .filter((j) => j.company === job.company && j !== job)
    .slice(0, 10);

  const canonical = `${BASE}/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`;

  const lines: string[] = [
    `# ${esc(job.title)} — ${esc(job.company)}`,
    '',
    `**Company:** ${esc(job.company)}  `,
    `**Location:** ${esc(job.location)}  `,
    salary ? `**Compensation:** ${salary}  ` : '',
    posted ? `**Posted:** ${posted}  ` : '',
    `**Apply:** ${canonical}`,
    '',
    description ? '## Description' : '',
    description ? description.slice(0, 6000) : '',
    '',
    related.length ? `## Other open roles at ${esc(job.company)}` : '',
    ...related.map(jobLine),
    '',
    '---',
    `View on the map: ${BASE} · Explore all jobs: ${BASE}/jobs`,
  ].filter((l) => l !== '');

  return markdown(lines.join('\n') + '\n');
}

async function renderCompany(companySlug: string) {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const jobs = allJobs.filter((j) => generateCompanySlug(j.company) === companySlug);
  if (jobs.length === 0) return null;

  const name = jobs[0].company;
  const locations = Array.from(new Set(jobs.map((j) => j.location))).sort();
  const canonical = `${BASE}/jobs/${companySlug}`;

  const lines: string[] = [
    `# ${esc(name)} — Open Jobs`,
    '',
    `**${jobs.length} open roles** across ${locations.length} locations.  `,
    `Canonical: ${canonical}`,
    '',
    '## Locations',
    ...locations.slice(0, 40).map((loc) => `- ${esc(loc)}`),
    '',
    '## Open roles',
    ...jobs.slice(0, 100).map(jobLine),
    '',
    '---',
    `Updated daily from the ${esc(name)} careers site via Stapply Map.`,
  ];
  return markdown(lines.join('\n') + '\n');
}

async function renderRole(roleSlug: string) {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const stats = getRoleStats(allJobs);
  const match = stats.find((s) => generateRoleSlug(s.baseRole) === roleSlug);
  if (!match) return null;

  const jobs = allJobs.filter((j) => extractBaseRole(j.title) === match.baseRole);
  const companies = Array.from(match.companies).sort();
  const locations = Array.from(match.locations).sort();
  const canonical = `${BASE}/roles/${roleSlug}`;

  const lines: string[] = [
    `# ${esc(match.baseRole)} Jobs`,
    '',
    `**${match.count} open ${esc(match.baseRole).toLowerCase()} roles** across ${companies.length} companies and ${locations.length} locations.  `,
    `Canonical: ${canonical}`,
    '',
    '## Companies hiring',
    ...companies.slice(0, 50).map((c) => `- [${c}](${BASE}/jobs/${generateCompanySlug(c)})`),
    '',
    '## Sample roles',
    ...jobs.slice(0, 60).map(jobLine),
  ];
  return markdown(lines.join('\n') + '\n');
}

async function renderLocation(locationSlug: string) {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const stats = getLocationStats(allJobs);
  const match = stats.find((s) => generateLocationSlug(s.baseLocation) === locationSlug);
  if (!match) return null;

  const jobs = allJobs.filter((j) => j.location === match.baseLocation);
  const companies = Array.from(match.companies).sort();
  const canonical = `${BASE}/locations/${locationSlug}`;

  const lines: string[] = [
    `# Tech Jobs in ${esc(match.baseLocation)}`,
    '',
    `**${match.count} open roles** across ${companies.length} companies.  `,
    `Canonical: ${canonical}`,
    '',
    '## Top companies hiring in this location',
    ...companies.slice(0, 40).map((c) => `- [${c}](${BASE}/jobs/${generateCompanySlug(c)})`),
    '',
    '## Open roles',
    ...jobs.slice(0, 80).map(jobLine),
  ];
  return markdown(lines.join('\n') + '\n');
}

async function renderInternships(companySlug: string) {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const name = getCompanyDisplayName(allJobs, companySlug);
  if (!name) return null;
  const jobs = getCompanyInternships(allJobs, companySlug);
  if (jobs.length === 0) return null;

  const canonical = `${BASE}/internships/${companySlug}`;
  const lines: string[] = [
    `# ${esc(name)} Internships & New Grad Roles`,
    '',
    `**${jobs.length} current internship / early career positions** at ${esc(name)}.  `,
    `Canonical: ${canonical}`,
    '',
    '## Open positions',
    ...jobs.slice(0, 100).map(jobLine),
  ];
  return markdown(lines.join('\n') + '\n');
}

async function renderIndex() {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const companies = Array.from(new Set(allJobs.map((j) => j.company))).sort();
  const roles = getRoleStats(allJobs).filter((r) => r.count >= 5).slice(0, 40);
  const locations = getLocationStats(allJobs).filter((l) => l.count >= 5).slice(0, 40);
  const internshipCompanies = getQualifyingInternshipCompanies(allJobs, 4).slice(0, 30);

  const lines: string[] = [
    '# Stapply Map',
    '',
    'Interactive map of open tech jobs at leading companies — updated daily.',
    `Live site: ${BASE}`,
    '',
    '## Browse',
    '',
    '### Internships & new grad',
    ...internshipCompanies.map(
      (c) => `- [${c.company} (${c.count})](${BASE}/internships/${c.companySlug})`,
    ),
    '',
    '### Roles',
    ...roles.map(
      (r) => `- [${r.baseRole} (${r.count})](${BASE}/roles/${generateRoleSlug(r.baseRole)})`,
    ),
    '',
    '### Locations',
    ...locations.map(
      (l) =>
        `- [${l.baseLocation} (${l.count})](${BASE}/locations/${generateLocationSlug(l.baseLocation)})`,
    ),
    '',
    '### Companies',
    ...companies
      .slice(0, 80)
      .map((c) => `- [${c}](${BASE}/jobs/${generateCompanySlug(c)})`),
  ];
  return markdown(lines.join('\n') + '\n');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params;
  try {
    if (slug.length === 0) return renderIndex();

    const [section, ...rest] = slug;
    if (section === 'jobs' && rest.length === 2) {
      const result = await renderJob(rest[0], rest[1]);
      return result ?? notFound(slug.join('/'));
    }
    if (section === 'company' && rest.length === 1) {
      const result = await renderCompany(rest[0]);
      return result ?? notFound(slug.join('/'));
    }
    if (section === 'jobs' && rest.length === 1) {
      const result = await renderCompany(rest[0]);
      return result ?? notFound(slug.join('/'));
    }
    if (section === 'roles' && rest.length === 1) {
      const result = await renderRole(rest[0]);
      return result ?? notFound(slug.join('/'));
    }
    if (section === 'locations' && rest.length === 1) {
      const result = await renderLocation(rest[0]);
      return result ?? notFound(slug.join('/'));
    }
    if (section === 'internships' && rest.length === 1) {
      const result = await renderInternships(rest[0]);
      return result ?? notFound(slug.join('/'));
    }
    return notFound(slug.join('/'));
  } catch (error) {
    console.error('md route error:', error);
    return notFound(slug.join('/'));
  }
}
