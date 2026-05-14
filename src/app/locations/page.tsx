import { Metadata } from 'next';
import Link from 'next/link';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateLocationSlug } from '@/lib/slug-utils';
import { getLocationStats } from '@/utils/location-utils';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Browse Jobs by Location | Stapply',
};

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const locationStats = getLocationStats(allJobs);

    return (
      <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
        <PageHeader />

        {/* Content */}
        <main className="max-w-4xl mx-auto px-5 pb-6 md:pb-8 space-y-6 pt-1">
          <section className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">JOBS BY LOCATION</h1>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {locationStats.length.toLocaleString()} location{locationStats.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {allJobs.length.toLocaleString()} total jobs
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">All Locations</h2>
              <p className="text-white/60 text-[14px] m-0">Browse jobs by location</p>
            </div>

            <div className="space-y-2">
              {locationStats.map((stat) => {
                const locationSlug = generateLocationSlug(stat.baseLocation);
                return (
                  <Link
                    key={stat.location}
                    href={`/locations/${locationSlug}`}
                    className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 no-underline"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {stat.baseLocation}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
                          <span>{stat.count.toLocaleString()} job{stat.count === 1 ? '' : 's'}</span>
                          <span className="text-white/30">·</span>
                          <span>{stat.companies.size} compan{stat.companies.size === 1 ? 'y' : 'ies'}</span>
                          <span className="text-white/30">·</span>
                          <span>{stat.roles.size} role{stat.roles.size === 1 ? '' : 's'}</span>
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
                <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Error Loading Locations</h1>
                <p className="text-white/60 text-[14px] m-0">We could not load the locations directory at this time.</p>
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

