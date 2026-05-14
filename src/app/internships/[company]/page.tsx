import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { getCompanyInternships, getCompanyDisplayName, getQualifyingInternshipCompanies } from '@/utils/internship-utils';
import { slugify } from '@/lib/slug-utils';
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
      };
    }

    const internships = getCompanyInternships(allJobs, companySlug);
    const title = `${companyName} Internships ${nextYear} (${internships.length} Positions)`;

    return {
      title,
    };
  } catch {
    return {
      title: 'Internships Not Found | Stapply',
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

    // Get other qualifying companies for internal linking
    const qualifyingCompanies = getQualifyingInternshipCompanies(allJobs, 4);
    const otherCompanies = qualifyingCompanies
      .filter((c) => c.companySlug !== companySlug)
      .slice(0, 6);

    return (
      <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
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
