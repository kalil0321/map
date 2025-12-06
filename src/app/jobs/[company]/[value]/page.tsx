import { Metadata } from 'next';
import Link from 'next/link';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { generateCompanySlug, findJobBySlug } from '@/lib/slug-utils';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import Script from 'next/script';
import { PageHeader } from '@/components/page-header';
import { formatSalary } from '@/utils/salary-format';
import { fetchJobDetailsFromDb } from '@/utils/db-query';
import { formatJobDate } from '@/utils/date-format';
import { JobDescription } from '@/components/job-description';
import { addUtmParams } from '@/utils/url-utils';
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
        const dbDetails = await fetchJobDetailsFromDb(job.ats_id, job.url);
        const descriptionText = (dbDetails?.description ?? job.description ?? '').replace(/\s+/g, ' ').trim();
        const descriptionSnippet =
            descriptionText.length > 220 ? `${descriptionText.slice(0, 220).trimEnd()}...` : descriptionText;
        const title = `${job.title} at ${job.company} - ${job.location}${salaryInfo ? ` - ${salaryInfo}` : ''} | Stapply`;
        const baseDescription = salaryInfo
            ? `Apply for ${job.title} at ${job.company} in ${job.location}. ${salaryInfo}. Explore jobs at tech companies on Stapply's interactive job map.`
            : `Apply for ${job.title} at ${job.company} in ${job.location}. Explore jobs at tech companies on Stapply's interactive job map.`;
        const description = descriptionSnippet ? `${baseDescription} ${descriptionSnippet}` : baseDescription;
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

        // Fetch additional job details from database
        const dbDetails = await fetchJobDetailsFromDb(job.ats_id, job.url);

        // Merge database details with job data
        const enrichedJob: JobMarker = {
            ...job,
            description: dbDetails?.description ?? job.description ?? null,
            ats_type: dbDetails?.ats_type ?? job.ats_type ?? null,
            posted_at: dbDetails?.posted_at ?? job.posted_at ?? null,
        };

        const postedLabel =
            formatJobDate(enrichedJob) ??
            (enrichedJob.posted_at
                ? new Date(enrichedJob.posted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })
                : null);

        // Generate JobPosting structured data
        const jobUrl = `https://map.stapply.ai/jobs/${companySlug}/${value}`;
        const companyPageUrl = `https://map.stapply.ai/jobs/${companySlug}`;
        const structuredData = generateJobPostingSchema(enrichedJob, jobUrl);

        // Generate breadcrumb structured data
        const breadcrumbData = generateBreadcrumbSchema([
            { name: 'Home', url: 'https://map.stapply.ai' },
            { name: enrichedJob.company, url: companyPageUrl },
            { name: enrichedJob.title, url: jobUrl },
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

                <PageHeader />

                {/* Content */}
                <main className="max-w-4xl flex flex-col mx-auto px-5 pb-6 md:pb-8 pt-8 gap-8">
                    {/* Job Header */}
                    <div className="flex flex-col gap-6">
                        {/* Title and Apply Button */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] leading-tight">{job.title}</h1>
                            <Link
                                href={addUtmParams(job.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 text-white rounded-full border border-white/12 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20 shrink-0 self-start"
                            >
                                Apply Now
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 17L17 7" />
                                    <path d="M7 7h10v10" />
                                </svg>
                            </Link>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-[15px] text-white/70">
                                <Link
                                    href={`/company/${generateCompanySlug(job.company)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/90 hover:text-white transition-colors no-underline font-medium uppercase"
                                >
                                    {job.company}
                                </Link>
                                <span className="text-white/30">·</span>
                                <span>{job.location}</span>
                                {formatSalary(enrichedJob) && (
                                    <>
                                        <span className="text-white/30">·</span>
                                        <span className="text-emerald-400/90 font-medium">{formatSalary(enrichedJob)}</span>
                                    </>
                                )}
                            </div>

                            {/* Badges */}
                            {(postedLabel || enrichedJob.ats_type) && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {postedLabel && (
                                        <span className="px-[10px] py-1 rounded-full text-[11px] font-medium bg-white/8 border border-white/12 text-white/70">
                                            {postedLabel}
                                        </span>
                                    )}
                                    {enrichedJob.ats_type && (
                                        <span className="px-[10px] py-1 rounded-full text-[11px] font-medium bg-white/8 border border-white/12 text-white/70 uppercase">
                                            {enrichedJob.ats_type}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Job Description */}
                    {enrichedJob.description && (
                        <div className="border-t border-white/10 pt-8">
                            <JobDescription description={enrichedJob.description} />
                        </div>
                    )}
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
