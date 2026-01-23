import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { getQualifyingInternshipCompanies, filterInternshipJobs } from '@/utils/internship-utils';
import { generateBreadcrumbSchema } from '@/lib/structured-data';
import { PageHeader } from '@/components/page-header';

export const revalidate = 3600; // Revalidate every hour

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

export const metadata: Metadata = {
  title: `Tech Internships ${nextYear} - AI & Software Engineering Internships`,
  description: `Discover ${nextYear} tech internships at top companies like Google, Amazon, Meta, Microsoft, NVIDIA, and more. Browse 2,800+ software engineering, AI, and data science internship opportunities worldwide.`,
  keywords: [
    `tech internships ${nextYear}`,
    `software engineering internship ${nextYear}`,
    `ai internship ${nextYear}`,
    `summer internship ${nextYear}`,
    `google internship`,
    `amazon internship`,
    `meta internship`,
    `microsoft internship`,
    `nvidia internship`,
    'new grad jobs',
    'entry level tech jobs',
    'intern opportunities',
    'college internships',
    'computer science internship',
    'machine learning internship',
    'data science internship',
  ],
  openGraph: {
    title: `Tech Internships ${nextYear} | Stapply`,
    description: `Browse 2,800+ internships at 39+ top tech companies including Google, Amazon, Meta, and more.`,
    url: 'https://map.stapply.ai/internships',
    type: 'website',
    images: [
      {
        url: 'https://map.stapply.ai/api/og/internships',
        width: 1200,
        height: 630,
        alt: `Tech Internships ${nextYear}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Tech Internships ${nextYear} | Stapply`,
    description: `Browse 2,800+ internships at 39+ top tech companies including Google, Amazon, Meta, and more.`,
    images: ['https://map.stapply.ai/api/og/internships'],
  },
  alternates: {
    canonical: 'https://map.stapply.ai/internships',
  },
};

export default async function InternshipsPage() {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const qualifyingCompanies = getQualifyingInternshipCompanies(allJobs, 4);
  const totalInternships = filterInternshipJobs(allJobs).length;

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://map.stapply.ai' },
    { name: 'Internships', url: 'https://map.stapply.ai/internships' },
  ]);

  // FAQ Schema for internship-related questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `When should I apply for ${nextYear} tech internships?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Most top tech companies open ${nextYear} summer internship applications in August-October of the previous year. Companies like Google, Amazon, Meta, and Microsoft often fill positions quickly, so early application is recommended. Check Stapply regularly for new postings.`,
        },
      },
      {
        '@type': 'Question',
        name: 'What are the top companies for software engineering internships?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The top companies for software engineering internships include Google, Amazon, Meta, Microsoft, NVIDIA, Apple, Palantir, Stripe, and Databricks. These companies offer competitive compensation, mentorship, and often convert interns to full-time roles.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need prior experience for a tech internship?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'While prior experience helps, many companies offer internships for students at all levels. Focus on demonstrating strong fundamentals in data structures, algorithms, and programming. Personal projects and coursework can substitute for professional experience.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the typical salary for a tech internship?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tech internship salaries vary widely. Top companies like Google, Meta, and NVIDIA typically pay $8,000-$12,000+ per month for software engineering interns. Startups and smaller companies may offer $4,000-$7,000 per month. Location and role also affect compensation.',
        },
      },
    ],
  };

  // CollectionPage schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Tech Internships ${nextYear}`,
    description: `Browse ${totalInternships.toLocaleString()} tech internships at ${qualifyingCompanies.length} top companies`,
    url: 'https://map.stapply.ai/internships',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: qualifyingCompanies.length,
      itemListElement: qualifyingCompanies.map((company, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Organization',
          name: company.company,
          url: `https://map.stapply.ai/internships/${company.companySlug}`,
        },
      })),
    },
  };

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbData)}
      </Script>
      <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqSchema)}
      </Script>
      <Script id="collection-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(collectionSchema)}
      </Script>
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        {/* Hero Section */}
        <section className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
            Tech Internships {nextYear}
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
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Updated daily
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

        {/* SEO Content Section */}
        <section className="space-y-6 pt-4 border-t border-white/10">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Finding Your {nextYear} Tech Internship
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-white/70">
              <p>
                Landing a tech internship at a top company can launch your career in software engineering,
                machine learning, data science, or product management. Here's what you need to know about
                the {nextYear} internship season:
              </p>
              <h3 className="text-white text-base font-medium mt-6 mb-2">When to Apply</h3>
              <p>
                Most major tech companies like Google, Amazon, Meta, and Microsoft open their summer
                internship applications between August and October. AI-focused companies like Anthropic,
                OpenAI, and Mistral often have rolling admissions. We recommend applying as early as
                possible, as positions fill quickly.
              </p>
              <h3 className="text-white text-base font-medium mt-6 mb-2">Popular Internship Types</h3>
              <ul className="text-white/60">
                <li><strong className="text-white/80">Software Engineering Intern</strong> - Build products, debug code, and ship features</li>
                <li><strong className="text-white/80">Machine Learning Intern</strong> - Train models, run experiments, and deploy ML systems</li>
                <li><strong className="text-white/80">Research Intern</strong> - Work on cutting-edge AI research with top scientists</li>
                <li><strong className="text-white/80">Product Management Intern</strong> - Define roadmaps and work with cross-functional teams</li>
                <li><strong className="text-white/80">Data Science Intern</strong> - Analyze data, build dashboards, and derive insights</li>
              </ul>
              <h3 className="text-white text-base font-medium mt-6 mb-2">New Graduate Programs</h3>
              <p>
                Many companies also offer new graduate positions for recent college graduates. These roles
                typically offer mentorship, training programs, and a path to more senior positions. Check
                each company's internship page for their new grad offerings.
              </p>
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Browse More</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/roles"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/70 hover:bg-white/8 hover:border-white/20 hover:text-white transition-all no-underline"
            >
              Browse by Role
            </Link>
            <Link
              href="/locations"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/70 hover:bg-white/8 hover:border-white/20 hover:text-white transition-all no-underline"
            >
              Browse by Location
            </Link>
            <Link
              href="/jobs"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/70 hover:bg-white/8 hover:border-white/20 hover:text-white transition-all no-underline"
            >
              All Jobs
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
