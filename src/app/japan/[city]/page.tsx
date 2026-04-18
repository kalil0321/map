import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  filterJapanCityJobs,
  getJapanCityStats,
  JAPAN_CITIES,
  JAPAN_CITY_DISPLAY,
} from '@/utils/japan-utils';
import { extractBaseRole } from '@/utils/role-utils';
import { generateCompanySlug, generateRoleSlug } from '@/lib/slug-utils';
import { generateBreadcrumbSchema } from '@/lib/structured-data';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

// Japan city pages. Tokyo, Osaka, Kyoto, etc. Targets "{city} tech jobs",
// "AI jobs {city}", "{city} software engineer jobs". These are narrow but
// high-intent queries where Stapply is likely the only English-friendly
// aggregator ranking.

export const revalidate = 3600;

type Params = { city: string };

const BASE = 'https://map.stapply.ai';

export function generateStaticParams() {
  return JAPAN_CITIES.map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  const display = JAPAN_CITY_DISPLAY[city];
  if (!display) return { title: 'City Not Found | Stapply' };

  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const jobs = filterJapanCityJobs(allJobs, city);
  const pageUrl = `${BASE}/japan/${city}`;
  const title = `Tech Jobs in ${display.en} (${jobs.length}) — AI & Engineering | Stapply`;
  const description = `${jobs.length} open tech, AI, and engineering roles in ${display.en}, Japan. Refreshed daily from top companies. English-friendly and remote options included.`;

  return {
    title,
    description,
    openGraph: { title, description, url: pageUrl, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: pageUrl,
      languages: {
        en: pageUrl,
        ja: `${BASE}/ja/${city}-kyujin`,
        'x-default': pageUrl,
      },
    },
  };
}

export default async function JapanCityPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const display = JAPAN_CITY_DISPLAY[city];
  if (!display) notFound();

  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const jobs = filterJapanCityJobs(allJobs, city);
  if (jobs.length === 0) notFound();

  const pageUrl = `${BASE}/japan/${city}`;

  const companies = Array.from(
    jobs.reduce<Map<string, number>>((acc, job) => {
      acc.set(job.company, (acc.get(job.company) ?? 0) + 1);
      return acc;
    }, new Map()),
  ).sort((a, b) => b[1] - a[1]);

  const roles = Array.from(
    jobs.reduce<Map<string, number>>((acc, job) => {
      const base = extractBaseRole(job.title);
      acc.set(base, (acc.get(base) ?? 0) + 1);
      return acc;
    }, new Map()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const otherCities = getJapanCityStats(
    allJobs.filter((j) => !filterJapanCityJobs([j], city).length),
  )
    .filter((s) => s.slug !== city)
    .slice(0, 6);

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: BASE },
    { name: 'Japan', url: `${BASE}/japan` },
    { name: display.en, url: pageUrl },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Tech Jobs in ${display.en}`,
    description: `${jobs.length} open tech jobs in ${display.en}, Japan`,
    url: pageUrl,
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: jobs.length,
    },
  };

  const faqs = [
    {
      q: `How many tech jobs are open in ${display.en} right now?`,
      a: `There are ${jobs.length.toLocaleString()} open tech and AI roles in ${display.en} on Stapply Map from ${companies.length} companies. Listings update daily from each company's own careers page.`,
    },
    {
      q: `Which companies hire most in ${display.en}?`,
      a: `Top employers in ${display.en} on Stapply: ${companies
        .slice(0, 5)
        .map(([c]) => c)
        .join(', ')}.`,
    },
    {
      q: `Are there English-speaking roles in ${display.en}?`,
      a: `Yes. Most global tech companies hiring in ${display.en} — particularly AI labs and engineering roles — operate in English. Roles requiring Japanese are typically flagged in the job title.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'en',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbData)}
      </Script>
      <Script id="collection-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(collectionSchema)}
      </Script>
      <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqSchema)}
      </Script>
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        <nav className="flex items-center gap-2 text-[13px] text-white/50">
          <Link href="/japan" className="hover:text-white/70 transition-colors no-underline">
            Japan
          </Link>
          <span>/</span>
          <span className="text-white/70">{display.en}</span>
        </nav>

        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
            Tech Jobs in {display.en}
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed m-0 max-w-2xl">
            {jobs.length.toLocaleString()} open tech, AI, and engineering roles in {display.en} ({display.ja}), Japan. Aggregated from {companies.length} companies and refreshed daily.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {jobs.length.toLocaleString()} open roles
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {companies.length} companies
            </span>
            <Link
              href={`/ja/${city}-kyujin`}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 no-underline hover:bg-white/10"
            >
              {display.ja}の求人を見る →
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Open roles in {display.en}</h2>
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
            <AllJobsList jobs={jobs} />
          </Suspense>
        </section>

        {companies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Companies hiring in {display.en}
            </h2>
            <div className="flex flex-wrap gap-2">
              {companies.slice(0, 24).map(([company, count]) => (
                <Link
                  key={company}
                  href={`/jobs/${generateCompanySlug(company)}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {company} ({count})
                </Link>
              ))}
            </div>
          </section>
        )}

        {roles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Popular roles</h2>
            <div className="flex flex-wrap gap-2">
              {roles.map(([role, count]) => (
                <Link
                  key={role}
                  href={`/roles/${generateRoleSlug(role)}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {role} ({count})
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Frequently asked questions</h2>
          <dl className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <dt className="text-[15px] font-medium text-white mb-1">{item.q}</dt>
                <dd className="text-[14px] text-white/70 leading-relaxed m-0">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {otherCities.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Other Japan cities</h2>
            <div className="flex flex-wrap gap-2">
              {otherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/japan/${c.slug}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                >
                  {JAPAN_CITY_DISPLAY[c.slug].en} ({c.count})
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
