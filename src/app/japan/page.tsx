import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  filterJapanJobs,
  getJapanCityStats,
  JAPAN_CITY_DISPLAY,
} from '@/utils/japan-utils';
import { extractBaseRole } from '@/utils/role-utils';
import { generateCompanySlug, generateRoleSlug } from '@/lib/slug-utils';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

export const revalidate = 3600;

const BASE = 'https://map.stapply.ai';

export const metadata: Metadata = {
  title: 'Tech Jobs in Japan — AI, Engineering, and Startups | Stapply',
};

export default async function JapanHubPage() {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const japanJobs = filterJapanJobs(allJobs);

  const cityStats = getJapanCityStats(japanJobs);
  const companies = Array.from(
    japanJobs.reduce<Map<string, number>>((acc, job) => {
      acc.set(job.company, (acc.get(job.company) ?? 0) + 1);
      return acc;
    }, new Map()),
  ).sort((a, b) => b[1] - a[1]);

  const roles = Array.from(
    japanJobs.reduce<Map<string, number>>((acc, job) => {
      const base = extractBaseRole(job.title);
      acc.set(base, (acc.get(base) ?? 0) + 1);
      return acc;
    }, new Map()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16);

  const faqs = [
    {
      q: 'How many tech jobs in Japan are currently available?',
      a: `There are ${japanJobs.length.toLocaleString()} open tech roles in Japan on Stapply Map from ${companies.length} companies. Listings include AI, machine learning, software engineering, product, and infrastructure positions across Tokyo, Osaka, Kyoto, Yokohama, Fukuoka, and remote.`,
    },
    {
      q: 'Which companies hire the most in Japan?',
      a: `The most active employers in Japan on Stapply right now are ${companies
        .slice(0, 6)
        .map(([c]) => c)
        .join(', ')}.`,
    },
    {
      q: 'Can I apply to Japan tech jobs from outside Japan?',
      a: 'Many listings accept international candidates, particularly for AI research, ML engineering, and remote positions. Each job page links directly to the employer\'s application form — the exact eligibility depends on the role and visa requirements.',
    },
    {
      q: 'Are there English-speaking tech jobs in Japan?',
      a: 'Yes. A significant share of tech roles in Japan — especially at global AI labs and US-headquartered companies — operate in English. Roles that require Japanese are typically labeled in the title or description.',
    },
    {
      q: 'Is this page also available in Japanese?',
      a: 'Yes. Stapply maintains a Japanese-language mirror at /ja covering the same underlying job data with Japanese city and role vocabulary.',
    },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        <nav className="flex items-center gap-2 text-[13px] text-white/50">
          <Link href="/" className="hover:text-white/70 transition-colors no-underline">
            Home
          </Link>
          <span>/</span>
          <span className="text-white/70">Japan</span>
        </nav>

        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
            Tech Jobs in Japan
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed m-0 max-w-2xl">
            {japanJobs.length.toLocaleString()} open tech, AI, and engineering roles across Japan from {companies.length} companies — Tokyo, Osaka, Kyoto, Yokohama, Fukuoka, and remote. Refreshed daily directly from each employer's careers site.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {japanJobs.length.toLocaleString()} open roles
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {companies.length} companies
            </span>
            <Link
              href="/ja"
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 no-underline hover:bg-white/10"
            >
              日本語版 →
            </Link>
          </div>
        </section>

        {cityStats.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Browse by city</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cityStats.map(({ slug, count }) => (
                <Link
                  key={slug}
                  href={`/japan/${slug}`}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all no-underline"
                >
                  <div className="text-[15px] font-medium text-white">
                    {JAPAN_CITY_DISPLAY[slug].en}
                  </div>
                  <div className="text-[13px] text-white/50 mt-0.5">
                    {count} open role{count === 1 ? '' : 's'}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">All open roles in Japan</h2>
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
            <AllJobsList jobs={japanJobs} />
          </Suspense>
        </section>

        {companies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Top companies hiring in Japan</h2>
            <div className="flex flex-wrap gap-2">
              {companies.slice(0, 30).map(([company, count]) => (
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

      </main>
    </div>
  );
}
