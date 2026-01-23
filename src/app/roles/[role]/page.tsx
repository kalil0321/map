import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateRoleSlug, slugify } from '@/lib/slug-utils';
import { groupRoles, extractBaseRole, normalizeRole } from '@/utils/role-utils';
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

    // Generate CollectionPage structured data with JobPosting items
    const jobPostings = matchingJobs.slice(0, 50).map((job, index) => {
      const jobSlug = `${job.company}/${job.title}-${job.ats_id}`.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      return {
        '@type': 'JobPosting',
        title: job.title,
        description: `${job.title} position at ${job.company} in ${job.location}`,
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
        },
        url: `https://map.stapply.ai/jobs/${job.company}/${jobSlug}`,
      };
    });

    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${roleDisplayName} Jobs`,
      description: `Browse ${matchingJobs.length} ${roleDisplayName} job openings`,
      url: pageUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: matchingJobs.length,
        itemListElement: jobPostings.map((posting, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: posting,
        })),
      },
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
        <PageHeader />

        {/* Content */}
        <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-6 pt-1">
          <section className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">{roleDisplayName.toUpperCase()}</h1>
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


