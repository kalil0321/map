import { Metadata } from 'next';
import Link from 'next/link';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { getQualifyingInternshipCompanies, filterInternshipJobs } from '@/utils/internship-utils';
import { PageHeader } from '@/components/page-header';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: `Tech Internships - AI & Software Engineering Internships`,
};

export default async function InternshipsPage() {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const qualifyingCompanies = getQualifyingInternshipCompanies(allJobs, 4);
  const totalInternships = filterInternshipJobs(allJobs).length;

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        {/* Hero Section */}
        <section className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
            Tech Internships
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed max-w-2xl">
            Discover {totalInternships.toLocaleString()} internship and new graduate opportunities at{' '}
            {qualifyingCompanies.length} top tech companies. From AI research to software engineering,
            find your next career opportunity.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {totalInternships.toLocaleString()} open positions
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {qualifyingCompanies.length} companies
            </span>
          </div>
        </section>

        {/* Company Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Companies Hiring Interns</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {qualifyingCompanies.map((company) => (
              <Link
                key={company.companySlug}
                href={`/internships/${company.companySlug}`}
                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 no-underline"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-white group-hover:text-white/90 truncate">
                      {company.company}
                    </h3>
                    <p className="text-[13px] text-white/50 mt-0.5">
                      {company.count} internship{company.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-white/30 group-hover:text-white/50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-[12px] text-white/40 mt-2 truncate">
                  {company.locations.slice(0, 3).join(', ')}
                  {company.locations.length > 3 && ` +${company.locations.length - 3} more`}
                </p>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
