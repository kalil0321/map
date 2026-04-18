import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { filterInternshipJobs, getQualifyingInternshipCompanies } from '@/utils/internship-utils';
import { extractBaseRole, getRoleStats } from '@/utils/role-utils';
import {
  generateRoleSlug,
  generateCompanySlug,
  generateLocationSlug,
  generateJobSlug,
  slugify,
} from '@/lib/slug-utils';
import { generateBreadcrumbSchema } from '@/lib/structured-data';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

// Programmatic by-role internship pages. Search Console data shows we already
// rank around position 2 for long-tail queries like "software engineer intern",
// "machine learning engineering internship", "summer intern", and similar —
// but we send users to a generic company list. Dedicated role pages give
// higher topical relevance and a cleaner CTR story in Google Jobs.

export const revalidate = 3600;

type Params = { role: string };

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

const BASE = 'https://map.stapply.ai';

async function findRole(roleSlug: string) {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const interns = filterInternshipJobs(allJobs);

  // Group the internship subset by normalized base role, then find the match.
  const counts = new Map<string, { display: string; jobs: typeof allJobs }>();
  for (const job of interns) {
    const display = extractBaseRole(job.title);
    const key = generateRoleSlug(display);
    const existing = counts.get(key);
    if (existing) {
      existing.jobs.push(job);
    } else {
      counts.set(key, { display, jobs: [job] });
    }
  }

  const match = counts.get(roleSlug);
  if (!match) return null;
  return { allJobs, match, allInterns: interns };
}

// Pre-build pages only for internship role clusters with enough volume to be
// useful (and to keep the sitemap tight).
export async function generateStaticParams() {
  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const interns = filterInternshipJobs(allJobs);
    const counts = new Map<string, number>();
    for (const job of interns) {
      const display = extractBaseRole(job.title);
      const key = generateRoleSlug(display);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, n]) => n >= 5)
      .map(([role]) => ({ role }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { role } = await params;
  const roleSlug = slugify(role);
  const found = await findRole(roleSlug);
  if (!found) {
    return { title: 'Internships Not Found | Stapply' };
  }
  const { match } = found;
  const count = match.jobs.length;
  const title = `${match.display} Internships ${nextYear} (${count}) — Stapply`;
  const description = `Browse ${count} open ${match.display.toLowerCase()} internship${count === 1 ? '' : 's'} across top tech companies for ${nextYear}. Summer, PhD, and new-grad tracks. Refreshed daily.`;
  const pageUrl = `${BASE}/internships/role/${roleSlug}`;
  return {
    title,
    description,
    openGraph: { title, description, url: pageUrl, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: pageUrl },
  };
}

export default async function InternshipsByRolePage({ params }: { params: Promise<Params> }) {
  const { role } = await params;
  const roleSlug = slugify(role);
  const found = await findRole(roleSlug);
  if (!found) notFound();

  const { allJobs, match, allInterns } = found;
  const { display: roleDisplay, jobs: roleJobs } = match;
  const pageUrl = `${BASE}/internships/role/${roleSlug}`;

  const companies = Array.from(
    roleJobs.reduce<Map<string, number>>((acc, job) => {
      acc.set(job.company, (acc.get(job.company) ?? 0) + 1);
      return acc;
    }, new Map()),
  ).sort((a, b) => b[1] - a[1]);

  const locations = Array.from(
    roleJobs.reduce<Map<string, number>>((acc, job) => {
      acc.set(job.location, (acc.get(job.location) ?? 0) + 1);
      return acc;
    }, new Map()),
  ).sort((a, b) => b[1] - a[1]);

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: BASE },
    { name: 'Internships', url: `${BASE}/internships` },
    { name: `${roleDisplay} Internships`, url: pageUrl },
  ]);

  const itemList = roleJobs.slice(0, 50).map((job, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${BASE}/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`,
    name: `${job.title} — ${job.company}`,
  }));

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${roleDisplay} Internships ${nextYear}`,
    description: `Browse ${roleJobs.length} ${roleDisplay.toLowerCase()} internship openings at top tech companies for ${nextYear}.`,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: roleJobs.length,
      itemListElement: itemList,
    },
  };

  const faqs = [
    {
      q: `How many ${roleDisplay} internships are available for ${nextYear}?`,
      a: `There are ${roleJobs.length.toLocaleString()} open ${roleDisplay.toLowerCase()} internship${roleJobs.length === 1 ? '' : 's'} on Stapply Map right now, spread across ${companies.length} companies and ${locations.length} locations. Listings update daily directly from each employer's applicant tracking system.`,
    },
    {
      q: `Which companies hire ${roleDisplay.toLowerCase()} interns?`,
      a: `The most active ${roleDisplay.toLowerCase()} intern employers on Stapply right now are ${companies
        .slice(0, 5)
        .map(([c]) => c)
        .join(', ')}.`,
    },
    {
      q: `When should I apply for ${nextYear} ${roleDisplay.toLowerCase()} internships?`,
      a: `Top tech companies typically open ${nextYear} summer applications between August and October of the previous year. Roles at Google, Meta, Microsoft, Amazon, and NVIDIA often fill quickly on a rolling basis, so earlier applications are strongly favored.`,
    },
    {
      q: `Where are ${roleDisplay.toLowerCase()} internships concentrated?`,
      a: `The most active ${roleDisplay.toLowerCase()} intern locations on Stapply are ${locations
        .slice(0, 5)
        .map(([l]) => l)
        .join(', ')}.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const siblingRoles = getRoleStats(allJobs)
    .filter((r) => r.count >= 5 && r.baseRole !== roleDisplay)
    .slice(0, 10);

  const otherInternCompanies = getQualifyingInternshipCompanies(allJobs, 4).slice(0, 8);

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbData)}
      </Script>
      <Script id="collection-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(collectionSchema)}
      </Script>
      <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqSchema)}
      </Script>
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        <nav className="flex items-center gap-2 text-[13px] text-white/50">
          <Link href="/internships" className="hover:text-white/70 transition-colors no-underline">
            Internships
          </Link>
          <span>/</span>
          <span className="text-white/70">{roleDisplay}</span>
        </nav>

        <section className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">
            {roleDisplay} Internships {nextYear}
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed m-0">
            {roleJobs.length.toLocaleString()} open {roleDisplay.toLowerCase()} internship{roleJobs.length === 1 ? '' : 's'} across {companies.length} companies and {locations.length} locations. Summer, PhD, new-grad, and early career tracks — refreshed daily from each employer.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {roleJobs.length.toLocaleString()} open
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {companies.length} companies
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {locations.length} locations
            </span>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Open {roleDisplay.toLowerCase()} internships</h2>
          <Suspense
            fallback={
              <div className="space-y-3">
                <div className="bg-white/8 rounded-xl border border-white/12 h-11 animate-pulse" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 h-24 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            }
          >
            <AllJobsList jobs={roleJobs} />
          </Suspense>
        </section>

        {companies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Companies hiring {roleDisplay.toLowerCase()} interns
            </h2>
            <div className="flex flex-wrap gap-2">
              {companies.slice(0, 24).map(([company, count]) => (
                <Link
                  key={company}
                  href={`/internships/${generateCompanySlug(company)}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {company} ({count})
                </Link>
              ))}
            </div>
          </section>
        )}

        {locations.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Top locations</h2>
            <div className="flex flex-wrap gap-2">
              {locations.slice(0, 16).map(([loc, count]) => (
                <Link
                  key={loc}
                  href={`/locations/${generateLocationSlug(loc)}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {loc} ({count})
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Frequently asked questions</h2>
          <dl className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <dt className="text-[15px] font-medium text-white mb-1">{item.q}</dt>
                <dd className="text-[14px] text-white/70 leading-relaxed m-0">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {siblingRoles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Related internships</h2>
            <div className="flex flex-wrap gap-2">
              {siblingRoles.map((r) => (
                <Link
                  key={r.baseRole}
                  href={`/internships/role/${generateRoleSlug(r.baseRole)}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {r.baseRole} intern
                </Link>
              ))}
            </div>
          </section>
        )}

        {otherInternCompanies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">More internship programs</h2>
            <div className="flex flex-wrap gap-2">
              {otherInternCompanies.map((c) => (
                <Link
                  key={c.companySlug}
                  href={`/internships/${c.companySlug}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {c.company} ({c.count})
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
