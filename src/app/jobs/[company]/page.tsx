import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  slugify,
} from '@/lib/slug-utils';
import { extractBaseRole } from '@/utils/role-utils';
import { generateStaticHeatmapUrl } from '@/utils/map-helpers';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';
import { isInternshipJob } from '@/utils/internship-utils';

type Params = { company: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { company } = await params;

    try {
        const jobs = await loadJobsWithCoordinatesServer('/ai.csv');
        const matchingJobs = jobs.filter(job => slugify(job.company) === company);

        if (matchingJobs.length === 0) {
            return {
                title: 'Company Jobs | Stapply',
            };
        }

        const companyName = matchingJobs[0].company;
        const jobCount = matchingJobs.length;
        const title = `${companyName} Jobs (${jobCount}) | Stapply`;

        return {
            title,
        };
    } catch (error) {
        return {
            title: 'Company Jobs | Stapply',
        };
    }
}

export default async function JobsPage({ params }: { params: Promise<Params> }) {
    const { company } = await params;

    try {
        const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
        const matchingJobs = allJobs.filter(job => slugify(job.company) === company);

        if (matchingJobs.length === 0) {
            return <CompanyNotFound />;
        }

        const companyName = matchingJobs[0].company;
        const locations = Array.from(new Set(matchingJobs.map(job => job.location)));

        // Generate heatmap with all job locations
        const staticMapUrl = generateStaticHeatmapUrl(
            matchingJobs.map(job => ({ lat: job.lat, lng: job.lng })),
            900,
            360
        );

        const topLocations = Array.from(
          matchingJobs.reduce<Map<string, number>>((acc, job) => {
            acc.set(job.location, (acc.get(job.location) ?? 0) + 1);
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

        const internshipCount = matchingJobs.filter(isInternshipJob).length;

        const faqs = [
          {
            q: `How many open positions does ${companyName} have right now?`,
            a: `${companyName} has ${matchingJobs.length.toLocaleString()} open roles across ${locations.length} location${locations.length === 1 ? '' : 's'} on Stapply Map. The list is refreshed daily directly from their careers site.`,
          },
          internshipCount > 0
            ? {
                q: `Does ${companyName} have internships or new-grad positions?`,
                a: `Yes. ${internshipCount} of the current ${companyName} openings are internships, new-grad, or early-career roles.`,
              }
            : null,
          {
            q: `Where does ${companyName} hire the most?`,
            a: `${companyName}'s most active hiring locations on Stapply are ${topLocations
              .slice(0, 5)
              .map(([l]) => l)
              .join(', ')}.`,
          },
          {
            q: `What roles is ${companyName} hiring for?`,
            a: `The most common open roles at ${companyName} right now are ${topRoles
              .slice(0, 5)
              .map(([r]) => r)
              .join(', ')}.`,
          },
        ].filter(Boolean) as { q: string; a: string }[];

        return (
            <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
                <PageHeader />

                {/* Content */}
                <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-8 pt-1">
                    <section className="space-y-3">
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">
                          {companyName} Jobs & Careers
                        </h1>
                        <p className="text-white/70 text-[15px] leading-relaxed m-0">
                          {matchingJobs.length.toLocaleString()} open role{matchingJobs.length === 1 ? '' : 's'} at {companyName} across {locations.length} location{locations.length === 1 ? '' : 's'}
                          {internshipCount > 0 ? `, including ${internshipCount} internship / new-grad position${internshipCount === 1 ? '' : 's'}` : ''}
                          . Refreshed daily.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {matchingJobs.length.toLocaleString()} open role{matchingJobs.length === 1 ? '' : 's'}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {locations.length} location{locations.length === 1 ? '' : 's'}
                            </span>
                            {internshipCount > 0 && (
                              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                                {internshipCount} internships
                              </span>
                            )}
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
                            <AllJobsList jobs={matchingJobs} hideCompanyName={true} />
                        </Suspense>
                    </section>

                    {topLocations.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">
                          {companyName} locations
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {topLocations.map(([loc, count]) => (
                            <span
                              key={loc}
                              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80"
                            >
                              {loc} ({count})
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {topRoles.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">
                          Roles hiring now
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {topRoles.map(([role, count]) => (
                            <span
                              key={role}
                              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80"
                            >
                              {role} ({count})
                            </span>
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

                </main>
            </div>
        );
    } catch (error) {
        return <CompanyNotFound />;
    }
}

function CompanyNotFound() {
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
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Company Not Found</h1>
                            <p className="text-white/60 text-[14px] m-0">We could not find any roles for this company.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/companies"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Browse Companies
                        </Link>
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
        </div>
    );
}
