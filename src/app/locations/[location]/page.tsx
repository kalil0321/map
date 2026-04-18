import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  generateLocationSlug,
  generateCompanySlug,
  generateRoleSlug,
  generateJobSlug,
  slugify,
} from '@/lib/slug-utils';
import { groupLocations, extractLocationBase, normalizeLocation, getLocationStats } from '@/utils/location-utils';
import { extractBaseRole } from '@/utils/role-utils';
import { generateStaticHeatmapUrl } from '@/utils/map-helpers';
import { generateBreadcrumbSchema } from '@/lib/structured-data';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location } = await params;

  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const grouped = groupLocations(allJobs);
    const locationSlug = slugify(location);

    // Find matching location (case-insensitive slug match)
    let matchingJobs: typeof allJobs = [];
    let locationDisplayName = location;

    for (const [normalizedLocation, jobs] of grouped.entries()) {
      const baseLocation = jobs.length > 0 ? jobs[0].location : normalizedLocation;
      const baseLocationSlug = generateLocationSlug(baseLocation);
      if (baseLocationSlug === locationSlug || slugify(normalizedLocation) === locationSlug) {
        matchingJobs = jobs;
        locationDisplayName = baseLocation;
        break;
      }
    }

    if (matchingJobs.length === 0) {
      return {
        title: 'Location Not Found | Stapply',
        description: 'This location page could not be found.',
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
    const roles = new Set(matchingJobs.map(job => job.title));
    const companies = new Set(matchingJobs.map(job => job.company));
    const title = `Jobs in ${locationDisplayName} (${jobCount}) | Stapply`;
    const description = `Find ${jobCount} tech job${jobCount === 1 ? '' : 's'} in ${locationDisplayName} across ${roles.size} role${roles.size === 1 ? '' : 's'} at ${companies.size} compan${companies.size === 1 ? 'y' : 'ies'}. Explore job opportunities in ${locationDisplayName} on Stapply's interactive job map.`;
    const pageUrl = `https://map.stapply.ai/locations/${locationSlug}`;

    return {
      title,
      description,
      keywords: [
        `jobs in ${locationDisplayName}`,
        `${locationDisplayName} tech jobs`,
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
      title: 'Location Not Found | Stapply',
      description: 'This location page could not be found.',
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

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;

  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const grouped = groupLocations(allJobs);
    const locationSlug = slugify(location);

    // Find matching location (case-insensitive slug match)
    let matchingJobs: typeof allJobs = [];
    let locationDisplayName = location;

    for (const [normalizedLocation, jobs] of grouped.entries()) {
      const baseLocation = jobs.length > 0 ? jobs[0].location : normalizedLocation;
      const baseLocationSlug = generateLocationSlug(baseLocation);
      if (baseLocationSlug === locationSlug || slugify(normalizedLocation) === locationSlug) {
        matchingJobs = jobs;
        locationDisplayName = baseLocation;
        break;
      }
    }

    if (matchingJobs.length === 0) {
      return <LocationNotFound />;
    }

    const roles = Array.from(new Set(matchingJobs.map(job => job.title)));
    const companies = Array.from(new Set(matchingJobs.map(job => job.company)));

    // Generate heatmap with all job locations
    const coordinates = matchingJobs
      .filter(job => !isNaN(job.lat) && !isNaN(job.lng))
      .map(job => ({ lat: job.lat, lng: job.lng }));

    const staticMapUrl = coordinates.length > 0
      ? generateStaticHeatmapUrl(coordinates, 900, 360)
      : null;

    // Generate breadcrumb structured data
    const pageUrl = `https://map.stapply.ai/locations/${locationSlug}`;
    const locationsPageUrl = 'https://map.stapply.ai/locations';
    const breadcrumbData = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://map.stapply.ai' },
      { name: 'Locations', url: locationsPageUrl },
      { name: locationDisplayName, url: pageUrl },
    ]);

    // ItemList with real job URLs.
    const itemList = matchingJobs.slice(0, 50).map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://map.stapply.ai/jobs/${generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url)}`,
      name: `${job.title} — ${job.company}`,
    }));

    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Jobs in ${locationDisplayName}`,
      description: `Browse ${matchingJobs.length} job openings in ${locationDisplayName}`,
      url: pageUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: matchingJobs.length,
        itemListElement: itemList,
      },
    };

    const topCompanies = Array.from(
      matchingJobs.reduce<Map<string, number>>((acc, job) => {
        acc.set(job.company, (acc.get(job.company) ?? 0) + 1);
        return acc;
      }, new Map()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const topRoles = Array.from(
      matchingJobs.reduce<Map<string, number>>((acc, job) => {
        const base = extractBaseRole(job.title);
        acc.set(base, (acc.get(base) ?? 0) + 1);
        return acc;
      }, new Map()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const nearbyLocations = getLocationStats(allJobs)
      .filter((s) => s.baseLocation !== locationDisplayName && s.count >= 5)
      .slice(0, 10);

    const faqs = [
      {
        q: `How many tech jobs are open in ${locationDisplayName} right now?`,
        a: `Stapply Map currently lists ${matchingJobs.length.toLocaleString()} open role${matchingJobs.length === 1 ? '' : 's'} in ${locationDisplayName} from ${companies.length} companies. Every posting is refreshed daily directly from the employer's careers site.`,
      },
      {
        q: `Which companies hire the most in ${locationDisplayName}?`,
        a: `The top employers in ${locationDisplayName} on Stapply right now are ${topCompanies
          .slice(0, 5)
          .map(([c]) => c)
          .join(', ')}.`,
      },
      {
        q: `What kinds of roles are open in ${locationDisplayName}?`,
        a: `The most common open roles in ${locationDisplayName} are ${topRoles
          .slice(0, 5)
          .map(([r]) => r)
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
          id="location-faq-schema"
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
              Tech Jobs in {locationDisplayName}
            </h1>
            <p className="text-white/70 text-[15px] leading-relaxed m-0">
              {matchingJobs.length.toLocaleString()} open role{matchingJobs.length === 1 ? '' : 's'} in {locationDisplayName} across {companies.length} companies. Refreshed daily.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {matchingJobs.length.toLocaleString()} open role{matchingJobs.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {roles.length} role{roles.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {companies.length} compan{companies.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
          </section>

          {staticMapUrl && (
            <section className="space-y-2">
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <img
                  src={staticMapUrl}
                  alt={`Job locations in ${locationDisplayName}`}
                  className="w-full h-auto"
                />
              </div>
            </section>
          )}

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
                Top companies hiring in {locationDisplayName}
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

          {topRoles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Popular roles in {locationDisplayName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {topRoles.map(([role, count]) => (
                  <Link
                    key={role}
                    href={`/roles/${generateRoleSlug(role)}`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                  >
                    {role} ({count})
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

          {nearbyLocations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Other active locations</h2>
              <div className="flex flex-wrap gap-2">
                {nearbyLocations.map((loc) => (
                  <Link
                    key={loc.baseLocation}
                    href={`/locations/${generateLocationSlug(loc.baseLocation)}`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                  >
                    {loc.baseLocation} ({loc.count})
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="text-[12px] text-white/40">
            <Link href={`/md/locations/${locationSlug}`} className="text-white/40 hover:text-white/60 no-underline">
              View as markdown
            </Link>
          </section>
        </main>
      </div>
    );
  } catch (error) {
    return <LocationNotFound />;
  }
}

function LocationNotFound() {
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
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Location Not Found</h1>
              <p className="text-white/60 text-[14px] m-0">We could not find any jobs for this location.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
            >
              Browse Locations
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


