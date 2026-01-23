import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateRoleSlug } from '@/lib/slug-utils';
import { getRoleStats } from '@/utils/role-utils';
import { PageHeader } from '@/components/page-header';
import { generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Browse Jobs by Role | Stapply',
  description: 'Explore tech jobs by role type. Find software engineer, data scientist, product manager, and more job openings at tech companies worldwide.',
  keywords: [
    'tech jobs by role',
    'software engineer jobs',
    'data scientist jobs',
    'product manager jobs',
    'tech job roles',
    'job titles',
    'tech careers',
    'tech job search',
    'role-based job search',
  ],
  openGraph: {
    title: 'Browse Jobs by Role | Stapply',
    description: 'Explore tech jobs by role type. Find software engineer, data scientist, product manager, and more job openings.',
    type: 'website',
    url: 'https://map.stapply.ai/roles',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Jobs by Role | Stapply',
    description: 'Explore tech jobs by role type. Find software engineer, data scientist, product manager, and more job openings.',
  },
  alternates: {
    canonical: 'https://map.stapply.ai/roles',
  },
};

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const roleStats = getRoleStats(allJobs);

    // Generate breadcrumb structured data
    const pageUrl = 'https://map.stapply.ai/roles';
    const breadcrumbData = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://map.stapply.ai' },
      { name: 'Roles', url: pageUrl },
    ]);

    // Generate CollectionPage structured data
    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Jobs by Role',
      description: 'Browse tech jobs organized by role type',
      url: pageUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: roleStats.length,
        itemListElement: roleStats.slice(0, 50).map((stat, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Thing',
            name: stat.baseRole,
            url: `https://map.stapply.ai/roles/${generateRoleSlug(stat.baseRole)}`,
          },
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
        <main className="max-w-4xl mx-auto px-5 pb-6 md:pb-8 space-y-6 pt-1">
          <section className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">JOBS BY ROLE</h1>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {roleStats.length.toLocaleString()} role{roleStats.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {allJobs.length.toLocaleString()} total jobs
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">All Roles</h2>
              <p className="text-white/60 text-[14px] m-0">Browse jobs by role type</p>
            </div>

            <div className="space-y-2">
              {roleStats.map((stat) => {
                const roleSlug = generateRoleSlug(stat.baseRole);
                return (
                  <Link
                    key={stat.role}
                    href={`/roles/${roleSlug}`}
                    className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 no-underline"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {stat.baseRole}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
                          <span>{stat.count.toLocaleString()} job{stat.count === 1 ? '' : 's'}</span>
                          <span className="text-white/30">·</span>
                          <span>{stat.companies.size} compan{stat.companies.size === 1 ? 'y' : 'ies'}</span>
                          <span className="text-white/30">·</span>
                          <span>{stat.locations.size} location{stat.locations.size === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white/40 shrink-0"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    );
  } catch (error) {
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Error Loading Roles</h1>
                <p className="text-white/60 text-[14px] m-0">We could not load the roles directory at this time.</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to Map
            </Link>
          </div>
        </div>
      </div>
    );
  }
}


