import { Metadata } from 'next';
import Link from 'next/link';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateCompanySlug, findJobBySlug } from '@/lib/slug-utils';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import { generateStaticMapUrl } from '@/utils/map-helpers';
import Script from 'next/script';
import { PageHeader } from '@/components/page-header';
import { formatSalary } from '@/utils/salary-format';
import type { JobMarker } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ company: string; value: string }> }): Promise<Metadata> {
    const { company: companySlug, value } = await params;

    try {
        const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');

        // Find job by matching the full slug (more reliable than extracting hash)
        const job = findJobBySlug<JobMarker>(allJobs, companySlug, value);

        if (!job) {
            return {
                title: 'Job Not Found | Stapply',
                description: 'This job posting could not be found.',
            };
        }

        const salaryInfo = formatSalary(job);
        const title = `${job.title} at ${job.company} - ${job.location}${salaryInfo ? ` - ${salaryInfo}` : ''} | Stapply`;
        const description = salaryInfo
            ? `Apply for ${job.title} at ${job.company} in ${job.location}. ${salaryInfo}. Explore jobs at tech companies on Stapply's interactive job map.`
            : `Apply for ${job.title} at ${job.company} in ${job.location}. Explore jobs at tech companies on Stapply's interactive job map.`;
        const jobUrl = `https://map.stapply.ai/jobs/${companySlug}/${value}`;
        const ogImageUrl = `https://map.stapply.ai/api/og/job?company=${encodeURIComponent(companySlug)}&value=${encodeURIComponent(value)}`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                url: jobUrl,
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${job.title} at ${job.company} - ${job.location}`,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [ogImageUrl],
            },
            alternates: {
                canonical: jobUrl, // Our URL, not external ATS
            },
        };
    } catch (error) {
        return {
            title: 'Job Not Found | Stapply',
            description: 'This job posting could not be found.',
        };
    }
}

export default async function JobPage({ params }: { params: Promise<{ company: string; value: string }> }) {
    const { company: companySlug, value } = await params;

    try {
        const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');

        // Find job by matching the full slug (more reliable than extracting hash)
        const job = findJobBySlug<JobMarker>(allJobs, companySlug, value);

        if (!job || !job.url) {
            return <JobNotFound />;
        }

        // Generate static map URL
        const staticMapUrl = generateStaticMapUrl(job.lng, job.lat, 3, 600, 400);

        // Generate JobPosting structured data
        const jobUrl = `https://map.stapply.ai/jobs/${companySlug}/${value}`;
        const companyPageUrl = `https://map.stapply.ai/jobs/${companySlug}`;
        const structuredData = generateJobPostingSchema(job, jobUrl);

        // Generate breadcrumb structured data
        const breadcrumbData = generateBreadcrumbSchema([
            { name: 'Home', url: 'https://map.stapply.ai' },
            { name: job.company, url: companyPageUrl },
            { name: job.title, url: jobUrl },
        ]);

        return (
            <div className="h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif] overflow-y-auto">
                {/* Structured Data using Next.js Script component */}
                <Script
                    id="job-posting-schema"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                >
                    {JSON.stringify(structuredData)}
                </Script>
                <Script
                    id="breadcrumb-schema"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                >
                    {JSON.stringify(breadcrumbData)}
                </Script>

                <PageHeader
                    rightAction={
                        <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white no-underline bg-white/8 px-4 py-2 rounded-full border border-white/12 text-[13px] inline-flex items-center justify-center gap-2 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-white/12 hover:border-white/20 cursor-pointer font-medium"
                        >
                            View job
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                            </svg>
                        </a>
                    }
                />

                {/* Content */}
                <main className="max-w-4xl flex flex-col mx-auto px-5 pb-6 md:pb-8 space-y-2 pt-1 gap-4">
                    {/* Job Header */}
                    <div className="flex flex-col">
                        <div className="inline-flex items-center gap-2 mb-1 flex-wrap">
                            <Link
                                href={`/company/${generateCompanySlug(job.company)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/50 font-medium no-underline hover:text-blue-400 transition-colors group"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                                >
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                                {job.company}
                            </Link>
                            {formatSalary(job) && (
                                <span className="text-[11px] text-green-400/80 font-medium">
                                    {formatSalary(job)}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-[-0.02em]">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-white/60 text-[13px]">
                            <div className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{job.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Static Map */}
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                        <img
                            src={staticMapUrl}
                            alt={`Map showing location of ${job.title} in ${job.location}`}
                            className="w-full h-auto"
                            width={600}
                            height={600}
                            loading="lazy"
                        />
                    </div>
                </main>
            </div>
        );
    } catch (error) {
        return <JobNotFound />;
    }
}

function JobNotFound() {
    return (
        <div className="h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif] overflow-y-auto">
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
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">Job Not Found</h1>
                            <p className="text-white/60 text-[14px] m-0">This job posting could not be found.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
                        >
                            Browse Jobs
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
