import { Metadata } from 'next';
import Link from 'next/link';
import { generateCompanySlug } from '@/lib/slug-utils';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import Script from 'next/script';
import { PageHeader } from '@/components/page-header';
import { AppliedJobButton } from '@/components/applied-job-button';
import { formatSalary } from '@/utils/salary-format';
import { normalizeJobUrl } from '@/utils/url-utils';
import { fetchJobDetailsFromDb } from '@/utils/db-query';
import { formatJobDate } from '@/utils/date-format';
import { loadJobData } from '@/utils/job-data-loader';

import { JobDescriptionClientWrapper } from '@/components/job-description-wrapper';
import type { JobMarker } from '@/types';
import { StapplyLogo } from '@/components/logo';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ company: string; value: string }> }): Promise<Metadata> {
    const { company: companySlug, value } = await params;

    try {
        // Use shared data loader to avoid loading CSV twice
        const jobData = await loadJobData(companySlug, value);

        if (!jobData) {
            return {
                title: 'Job Not Found | Stapply',
                description: 'This job posting could not be found.',
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

        const { job } = jobData;

        const [salaryInfo, dbDetails] = await Promise.all([
            Promise.resolve(formatSalary(job)),
            fetchJobDetailsFromDb(job.ats_id, job.url),
        ]);

        const descriptionText = (dbDetails?.description ?? job.description ?? '').replace(/\s+/g, ' ').trim();
        const descriptionSnippet =
            descriptionText.length > 220 ? `${descriptionText.slice(0, 220).trimEnd()}...` : descriptionText;

        const isDataCenterRole =
            /\bdata center\b/i.test(job.title) ||
            /\bdata centre\b/i.test(job.title) ||
            /\bDCIM\b/i.test(job.title);

        const titleCore = isDataCenterRole
            ? `Data Center Job: ${job.title} at ${job.company} - ${job.location}`
            : `${job.title} at ${job.company} - ${job.location}`;

        const title = `${titleCore}${salaryInfo ? ` - ${salaryInfo}` : ''} | Stapply`;

        const baseDescription = salaryInfo
            ? `Apply for ${job.title} at ${job.company} in ${job.location}. ${salaryInfo}. Explore jobs at tech companies on Stapply's interactive job map.`
            : `Apply for ${job.title} at ${job.company} in ${job.location}. Explore jobs at tech companies on Stapply's interactive job map.`;
        const description = descriptionSnippet ? `${baseDescription} ${descriptionSnippet}` : baseDescription;
        const jobUrl = `https://map.stapply.ai/jobs/${companySlug}/${value}`;
        const ogImageUrl = `https://map.stapply.ai/api/og/job?company=${encodeURIComponent(companySlug)}&value=${encodeURIComponent(value)}`;

        return {
            title,
            description,
            keywords: [
                `${job.title} jobs`,
                `${job.company} jobs`,
                'tech jobs',
                'tech job alerts',
                'tech job notify',
                'all companies',
                'tech companies',
                'tech job search',
                `${job.location} tech jobs`,
            ],
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

export default async function JobPage({ params }: { params: Promise<{ company: string; value: string }> }) {
    const { company: companySlug, value } = await params;

    try {
        // Use shared data loader to avoid loading CSV twice
        const jobData = await loadJobData(companySlug, value);

        if (!jobData || !jobData.job.url) {
            return <JobNotFound />;
        }

        const { job } = jobData;
        const dbDetails = await fetchJobDetailsFromDb(job.ats_id, job.url);

        const enrichedJob: JobMarker = {
            ...job,
            description: dbDetails?.description ?? job.description ?? null,
            ats_type: dbDetails?.ats_type ?? job.ats_type ?? null,
            posted_at: job.posted_at ?? null,
        };

        const isDataCenterRole =
            /\bdata center\b/i.test(enrichedJob.title) ||
            /\bdata centre\b/i.test(enrichedJob.title) ||
            /\bDCIM\b/i.test(enrichedJob.title);

        const postedLabel =
            formatJobDate(enrichedJob) ??
            (enrichedJob.posted_at
                ? new Date(enrichedJob.posted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })
                : null);

        const jobUrl = `https://map.stapply.ai/jobs/${companySlug}/${value}`;
        const companyPageUrl = `https://map.stapply.ai/jobs/${companySlug}`;
        const structuredData = generateJobPostingSchema(enrichedJob, jobUrl);
        const breadcrumbData = generateBreadcrumbSchema([
            { name: 'Home', url: 'https://map.stapply.ai' },
            { name: enrichedJob.company, url: companyPageUrl },
            { name: enrichedJob.title, url: jobUrl },
        ]);

        return (
            <div className="h-screen bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif] overflow-y-auto">
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
                <main className="max-w-4xl flex flex-col mx-auto px-4 sm:px-5 pb-6 md:pb-8 pt-6 sm:pt-8 gap-6 sm:gap-8">
                    {/* Job Header */}
                    <div className="flex flex-col gap-6">
                        {/* Title and Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.03em] leading-tight flex-1">
                                {job.title}
                            </h1>
                            <div className="flex flex-row gap-2 items-center sm:items-end">
                                <Link
                                    href={normalizeJobUrl(job.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex justify-center items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-full border border-white/90 text-[12px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/90 hover:border-white shrink-0"
                                >
                                    Apply
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M7 17L17 7" />
                                        <path d="M7 7h10v10" />
                                    </svg>
                                </Link>
                                <AppliedJobButton
                                    atsId={job.ats_id}
                                    name={job.title}
                                    company={job.company}
                                    variant="button"
                                />
                                {/* <Link
                                    href="https://stapply.ai/waitlist"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex justify-center items-center gap-1.5 px-3 py-1.5 bg-white/8 text-white rounded-full border border-white/12 text-[12px] font-medium no-underline transition-[border-color,background-color] duration-200 hover:bg-white/12 hover:border-white/20"
                                >
                                    <StapplyLogo size={16} />
                                    Apply in 1 click
                                </Link> */}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-[15px] text-white/70">
                                <Link
                                    href={`/company/${generateCompanySlug(job.company)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/90 hover:text-white transition-colors no-underline font-medium uppercase"
                                >
                                    {job.company}
                                </Link>
                                <span className="text-white/30 hidden sm:inline">·</span>
                                <span className="w-full sm:w-auto">{job.location}</span>
                                {postedLabel && (
                                    <>
                                        <span className="text-white/30 hidden sm:inline">·</span>
                                        <span className="text-blue-400/90 font-medium">{postedLabel}</span>
                                    </>
                                )}
                                {formatSalary(enrichedJob) && (
                                    <>
                                        <span className="text-white/30 hidden sm:inline">·</span>
                                        <span className="text-emerald-400/90 font-medium">{formatSalary(enrichedJob)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-white/70 hidden">
                            {isDataCenterRole
                                ? `Explore this data center role at ${job.company} in ${job.location}, and discover more infrastructure and operations jobs on Stapply's interactive job map.`
                                : `Explore this ${job.title} role at ${job.company} in ${job.location}, and discover more jobs at tech companies on Stapply's interactive job map.`}
                        </p>
                    </div>

                    {/* Job Description */}
                    {enrichedJob.description && (
                        <div className="border-t border-white/10 pt-8">
                            <JobDescriptionClientWrapper description={enrichedJob.description} />
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
                            <p className="text-white/60 text-[14px] m-0">This job posting could not be found. It may have been deleted or is no longer available. Sorry :(</p>
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
