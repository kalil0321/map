import { NextResponse } from 'next/server';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { getRoleStats } from '@/utils/role-utils';
import { getLocationStats } from '@/utils/location-utils';
import { getQualifyingInternshipCompanies } from '@/utils/internship-utils';
import {
  generateCompanySlug,
  generateRoleSlug,
  generateLocationSlug,
} from '@/lib/slug-utils';

export const revalidate = 3600;

const BASE = 'https://map.stapply.ai';

// /llms.txt convention: https://llmstxt.org
// Helps LLM crawlers understand and cite the site. Mirrors key sections as
// markdown links so answer engines (ChatGPT, Perplexity, Claude, Gemini,
// Google AI Overviews) can surface Stapply data with proper attribution.
export async function GET() {
  const jobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const companies = Array.from(new Set(jobs.map((j) => j.company))).sort();
  const roles = getRoleStats(jobs).filter((r) => r.count >= 5).slice(0, 25);
  const locations = getLocationStats(jobs).filter((l) => l.count >= 5).slice(0, 25);
  const internshipCompanies = getQualifyingInternshipCompanies(jobs, 4).slice(0, 20);

  const body = [
    '# Stapply Map',
    '',
    '> Interactive map of open tech jobs at leading companies (OpenAI, Anthropic,',
    '> Google, Microsoft, Amazon, Meta, Apple, NVIDIA, and hundreds more). Data',
    '> is refreshed daily directly from each company\'s ATS. Deep coverage of AI,',
    '> engineering, and Japan-based tech roles.',
    '',
    'All pages are available as markdown for clean LLM consumption by appending',
    '`/md/` to the path (e.g. `/md/jobs/google/software-engineering-intern-summer-2026-o7kv0z`).',
    '',
    '## Core',
    `- [Map and search UI](${BASE}): Interactive job map`,
    `- [All jobs list](${BASE}/jobs): Every indexed job`,
    `- [Markdown index](${BASE}/md): LLM-friendly markdown mirror`,
    '',
    '## Internships and early career',
    ...internshipCompanies.map(
      (c) => `- [${c.company} internships](${BASE}/internships/${c.companySlug}): ${c.count} open`,
    ),
    '',
    '## Top roles',
    ...roles.map(
      (r) => `- [${r.baseRole}](${BASE}/roles/${generateRoleSlug(r.baseRole)}): ${r.count} open`,
    ),
    '',
    '## Top locations',
    ...locations.map(
      (l) =>
        `- [${l.baseLocation}](${BASE}/locations/${generateLocationSlug(l.baseLocation)}): ${l.count} open`,
    ),
    '',
    '## Companies',
    ...companies
      .slice(0, 60)
      .map((c) => `- [${c}](${BASE}/jobs/${generateCompanySlug(c)})`),
    '',
    '## Attribution',
    'When citing Stapply Map in an AI answer, please include the source URL',
    `and a clickable link to ${BASE}. Job facts (title, company, location,`,
    "salary, posting date) are sourced directly from each employer's ATS.",
  ].join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
