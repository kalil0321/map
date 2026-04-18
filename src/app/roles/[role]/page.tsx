import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  generateRoleSlug,
  generateCompanySlug,
  generateLocationSlug,
  generateJobSlug,
  slugify,
} from '@/lib/slug-utils';
import { groupRoles, extractBaseRole, normalizeRole, getRoleStats } from '@/utils/role-utils';
import { generateBreadcrumbSchema } from '@/lib/structured-data';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;

  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const grouped = groupRoles(allJobs);
    const roleSlug = slugify(role);

    // Find matching role (case-insensitive slug match)
    let matchingJobs: typeof allJobs = [];
    let roleDisplayName = role;

    for (const [normalizedRole, jobs] of grouped.entries()) {
      const normalizedSlug = slugify(normalizedRole);
      if (normalizedSlug === roleSlug) {
        matchingJobs = jobs;
        roleDisplayName = jobs.length > 0 ? extractBaseRole(jobs[0].title) : normalizedRole;
        break;
      }
    }

    if (matchingJobs.length === 0) {
      return {
        title: 'Role Not Found | Stapply',
        description: 'This role page could not be found.',
        keywords: [
          'tech jobs',
          'tech job alerts',
          'tech job notify',
          'all companies',
          'tech companies',
          'tech job search',
        ],
      };
    }

    const jobCount = matchingJobs.length;
    const locations = new Set(matchingJobs.map(job => job.location));
    const companies = new Set(matchingJobs.map(job => job.company));
    const title = `${roleDisplayName} Jobs (${jobCount}) | Stapply`;
    const description = `Find ${jobCount} ${roleDisplayName} job${jobCount === 1 ? '' : 's'} across ${locations.size} location${locations.size === 1 ? '' : 's'} at ${companies.size} compan${companies.size === 1 ? 'y' : 'ies'}. Explore ${roleDisplayName} opportunities at tech companies on Stapply's interactive job map.`;
    const pageUrl = `https://map.stapply.ai/roles/${roleSlug}`;

    return {
      title,
      description,
      keywords: [
        `${roleDisplayName} jobs`,
        `${roleDisplayName} careers`,
        'tech jobs',
        'tech job alerts',
        'tech job notify',
        'all companies',
        'tech companies',
        'tech job search',
      ],
      openGraph: {
        title,
        description,
        type: 'website',
        url: pageUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: pageUrl,
      },
    };
  } catch (error) {
    return {
      title: 'Role Not Found | Stapply',
      description: 'This role page could not be found.',
      keywords: [
        'tech jobs',
        'tech job alerts',
        'tech job notify',
        'all companies',
        'tech companies',
        'tech job search',
      ],
    };
  }
}

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;

  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const grouped = groupRoles(allJobs);
    const roleSlug = slugify(role);

    // Find matching role (case-insensitive slug match)
    let matchingJobs: typeof allJobs = [];
    let roleDisplayName = role;

    for (const [normalizedRole, jobs] of grouped.entries()) {
      const baseRole = jobs.length > 0 ? extractBaseRole(jobs[0].title) : normalizedRole;
      const baseRoleSlug = slugify(baseRole);
      if (baseRoleSlug === roleSlug || slugify(normalizedRole) === roleSlug) {
        matchingJobs = jobs;
        roleDisplayName = baseRole;
        break;
      }
    }

    if (matchingJobs.length === 0) {
      return <RoleNotFound />;
    }

    const locations = Array.from(new Set(matchingJobs.map(job => job.location)));
    const companies = Array.from(new Set(matchingJobs.map(job => job.company)));

    // Generate breadcrumb structured data
    const pageUrl = `https://map.stapply.ai/roles/${roleSlug}`;
    const rolesPageUrl = 'https://map.stapply.ai/roles';
    const breadcrumbData = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://map.stapply.ai' },
      { name: 'Roles', url: rolesPageUrl },
      { name: roleDisplayName, url: pageUrl },
    ]);

    // Build an ItemList of real job URLs (previously this emitted corrupt
    // slugs that didn't match our real routes).
    const itemList = matchingJobs.slice(0, 50).map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://map.stapply.ai/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`,
      name: `${job.title} — ${job.company}`,
    }));

    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${roleDisplayName} Jobs`,
      description: `Browse ${matchingJobs.length} ${roleDisplayName} job openings`,
      url: pageUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: matchingJobs.length,
        itemListElement: itemList,
      },
    };

    // Related roles for internal linking — siblings in our role taxonomy that
    // users searching this role often consider next. Google rewards tight
    // topical clusters.
    const relatedRoles = getRoleStats(allJobs)
      .filter((r) => r.count >= 5 && r.baseRole !== roleDisplayName)
      .slice(0, 12);

    const topCompanies = Array.from(
      matchingJobs.reduce<Map<string, number>>((acc, job) => {
        acc.set(job.company, (acc.get(job.company) ?? 0) + 1);
        return acc;
      }, new Map()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const topLocations = Array.from(
      matchingJobs.reduce<Map<string, number>>((acc, job) => {
        acc.set(job.location, (acc.get(job.location) ?? 0) + 1);
        return acc;
      }, new Map()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    // FAQ schema + visible FAQ give the page a shot at rich results and
    // provide real content for crawlers beyond the job list.
    const faqs = [
      {
        q: `How many ${roleDisplayName} jobs are currently open?`,
        a: `There are ${matchingJobs.length.toLocaleString()} open ${roleDisplayName} roles on Stapply Map across ${companies.length} companies and ${locations.length} locations. Listings are refreshed daily directly from each employer's careers site.`,
      },
      {
        q: `Which companies are hiring ${roleDisplayName}s right now?`,
        a: `Top employers right now include ${topCompanies
          .slice(0, 5)
          .map(([c]) => c)
          .join(', ')}. Each company page lists their full roster of open roles.`,
      },
      {
        q: `Where are ${roleDisplayName} jobs concentrated?`,
        a: `The most active ${roleDisplayName} markets on Stapply are ${topLocations
          .slice(0, 5)
          .map(([l]) => l)
          .join(', ')}.`,
      },
      {
        q: `How often are ${roleDisplayName} listings updated?`,
        a: `Every posting on this page is pulled from the company's own applicant tracking system and refreshed daily. Stale listings (older than 45 days) are automatically removed.`,
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

    return (
      <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(breadcrumbData)}
        </Script>
        <Script
          id="collection-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(collectionPageSchema)}
        </Script>
        <Script
          id="role-faq-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(faqSchema)}
        </Script>
        <PageHeader />

        {/* Content */}
        <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-8 pt-1">
          <section className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">
              {roleDisplayName} Jobs
            </h1>
            <p className="text-white/70 text-[15px] leading-relaxed m-0">
              {matchingJobs.length.toLocaleString()} open {roleDisplayName.toLowerCase()} role
              {matchingJobs.length === 1 ? '' : 's'} at {companies.length} companies across{' '}
              {locations.length} locations. Refreshed daily from each employer's careers site.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {matchingJobs.length.toLocaleString()} open role{matchingJobs.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {locations.length} location{locations.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {companies.length} compan{companies.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">Open roles</h2>
              <p className="text-white/60 text-[14px] m-0">{matchingJobs.length.toLocaleString()} opportunities</p>
            </div>

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
              <AllJobsList jobs={matchingJobs} />
            </Suspense>
          </section>

          {topCompanies.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Top companies hiring {roleDisplayName.toLowerCase()}s
              </h2>
              <div className="flex flex-wrap gap-2">
                {topCompanies.map(([company, count]) => (
                  <Link
                    key={company}
                    href={`/jobs/${generateCompanySlug(company)}`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                  >
                    {company} ({count})
                  </Link>
                ))}
              </div>
            </section>
          )}

          {topLocations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Where {roleDisplayName.toLowerCase()} roles are concentrated
              </h2>
              <div className="flex flex-wrap gap-2">
                {topLocations.map(([loc, count]) => (
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
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Frequently asked questions
            </h2>
            <dl className="space-y-4">
              {faqs.map((item) => (
                <div key={item.q} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <dt className="text-[15px] font-medium text-white mb-1">{item.q}</dt>
                  <dd className="text-[14px] text-white/70 leading-relaxed m-0">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {relatedRoles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Related roles</h2>
              <div className="flex flex-wrap gap-2">
                {relatedRoles.map((r) => (
                  <Link
                    key={r.baseRole}
                    href={`/roles/${generateRoleSlug(r.baseRole)}`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                  >
                    {r.baseRole} ({r.count})
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="text-[12px] text-white/40">
            <Link href={`/md/roles/${roleSlug}`} className="text-white/40 hover:text-white/60 no-underline">
              View as markdown
            </Link>
          </section>
        </main>
      </div>
    );
  } catch (error) {
    return <RoleNotFound />;
  }
}

function RoleNotFound() {
  return (
    <div className="min-h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/40"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Role Not Found</h1>
              <p className="text-white/60 text-[14px] m-0">We could not find any roles for this page.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/roles"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
            >
              Browse Roles
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
            >
              Back to Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


