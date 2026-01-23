import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { getCompanyInternships, getCompanyDisplayName, getQualifyingInternshipCompanies } from '@/utils/internship-utils';
import { generateBreadcrumbSchema, generateJobPostingSchema } from '@/lib/structured-data';
import { slugify, generateJobSlug } from '@/lib/slug-utils';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

export const revalidate = 3600;

type Params = { company: string };

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { company: companySlug } = await params;

  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const companyName = getCompanyDisplayName(allJobs, companySlug);
    
    if (!companyName) {
      return {
        title: 'Internships Not Found | Stapply',
        description: 'This internship page could not be found.',
      };
    }

    const internships = getCompanyInternships(allJobs, companySlug);
    const locations = new Set(internships.map(j => j.location));
    
    const title = `${companyName} Internships ${nextYear} (${internships.length} Positions)`;
    const description = `Explore ${internships.length} internship and new graduate opportunities at ${companyName} across ${locations.size} locations. Apply now for summer ${nextYear} internships in software engineering, AI, and more.`;
    const pageUrl = `https://map.stapply.ai/internships/${companySlug}`;
    const ogImageUrl = `https://map.stapply.ai/api/og/internships?company=${encodeURIComponent(companySlug)}`;

    return {
      title,
      description,
      keywords: [
        `${companyName} internship`,
        `${companyName} internship ${nextYear}`,
        `${companyName} summer internship`,
        `${companyName} new grad`,
        `${companyName} software engineering intern`,
        `${companyName} careers`,
        `tech internship ${nextYear}`,
        'software engineering internship',
        'ai internship',
        'machine learning internship',
      ],
      openGraph: {
        title,
        description,
        url: pageUrl,
        type: 'website',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${companyName} Internships ${nextYear}`,
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
        canonical: pageUrl,
      },
    };
  } catch {
    return {
      title: 'Internships Not Found | Stapply',
      description: 'This internship page could not be found.',
    };
  }
}

// Generate static params for qualifying companies
export async function generateStaticParams() {
  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const qualifyingCompanies = getQualifyingInternshipCompanies(allJobs, 4);
    
    return qualifyingCompanies.map((company) => ({
      company: company.companySlug,
    }));
  } catch {
    return [];
  }
}

export default async function CompanyInternshipsPage({ params }: { params: Promise<Params> }) {
  const { company: companySlug } = await params;

  try {
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const companyName = getCompanyDisplayName(allJobs, companySlug);
    
    if (!companyName) {
      notFound();
    }

    const internships = getCompanyInternships(allJobs, companySlug);
    
    if (internships.length === 0) {
      notFound();
    }

    const locations = Array.from(new Set(internships.map(j => j.location)));
    const pageUrl = `https://map.stapply.ai/internships/${companySlug}`;

    // Breadcrumb schema
    const breadcrumbData = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://map.stapply.ai' },
      { name: 'Internships', url: 'https://map.stapply.ai/internships' },
      { name: companyName, url: pageUrl },
    ]);

    // CollectionPage with JobPosting items
    const jobPostings = internships.slice(0, 50).map((job) => {
      const jobSlug = generateJobSlug(job.title, job.id, job.company, job.ats_id, job.url);
      return {
        '@type': 'JobPosting',
        title: job.title,
        description: `${job.title} internship at ${job.company} in ${job.location}`,
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
        employmentType: 'INTERN',
        url: `https://map.stapply.ai/jobs/${jobSlug}`,
      };
    });

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${companyName} Internships ${nextYear}`,
      description: `Browse ${internships.length} internship openings at ${companyName}`,
      url: pageUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: internships.length,
        itemListElement: jobPostings.map((posting, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: posting,
        })),
      },
    };

    // Get other qualifying companies for internal linking
    const qualifyingCompanies = getQualifyingInternshipCompanies(allJobs, 4);
    const otherCompanies = qualifyingCompanies
      .filter((c) => c.companySlug !== companySlug)
      .slice(0, 6);

    return (
      <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
        <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(breadcrumbData)}
        </Script>
        <Script id="collection-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(collectionSchema)}
        </Script>
        <PageHeader />

        <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-6 pt-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-white/50">
            <Link href="/internships" className="hover:text-white/70 transition-colors no-underline">
              Internships
            </Link>
            <span>/</span>
            <span className="text-white/70">{companyName}</span>
          </nav>

          {/* Header */}
          <section className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">
              {companyName} Internships {nextYear}
            </h1>
            <p className="text-white/60 text-[14px]">
              Explore internship and new graduate opportunities at {companyName}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {internships.length} open position{internships.length === 1 ? '' : 's'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {locations.length} location{locations.length === 1 ? '' : 's'}
              </span>
              <Link
                href={`/jobs/${companySlug}`}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all no-underline text-white/60 hover:text-white/80"
              >
                View all {companyName} jobs →
              </Link>
            </div>
          </section>

          {/* Internship Listings */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">Open Internships</h2>
              <p className="text-white/60 text-[14px] m-0">
                {internships.length} internship & new grad opportunities
              </p>
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
              <AllJobsList jobs={internships} hideCompanyName={true} />
            </Suspense>
          </section>

          {/* Related Companies */}
          {otherCompanies.length > 0 && (
            <section className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold tracking-[-0.02em]">
                More Internship Opportunities
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCompanies.map((company) => (
                  <Link
                    key={company.companySlug}
                    href={`/internships/${company.companySlug}`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/70 hover:bg-white/8 hover:border-white/20 hover:text-white transition-all no-underline"
                  >
                    {company.company} ({company.count})
                  </Link>
                ))}
                <Link
                  href="/internships"
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/70 hover:bg-white/8 hover:border-white/20 hover:text-white transition-all no-underline"
                >
                  View all companies →
                </Link>
              </div>
            </section>
          )}
        </main>
      </div>
    );
  } catch {
    notFound();
  }
}
