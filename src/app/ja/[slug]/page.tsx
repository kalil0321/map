import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import {
  filterJapanJobs,
  filterJapanCityJobs,
  JAPAN_CITIES,
  JAPAN_CITY_DISPLAY,
} from '@/utils/japan-utils';
import { extractBaseRole } from '@/utils/role-utils';
import { generateCompanySlug } from '@/lib/slug-utils';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

// 日本語の動的ページ。URL 規則: /ja/{slug}-kyujin
//   - slug がJapanese cityなら都市別の求人一覧
//   - slug が会社名なら日本の求人 + グローバルの求人一覧
//
// Company pages for OpenAI and Anthropic are intentionally blocked here.

export const revalidate = 3600;

type Params = { slug: string };

const SUFFIX = '-kyujin';
const BLOCKED_COMPANY_SLUGS = new Set(['openai', 'anthropic']);

function stripSuffix(slug: string): { base: string; hasSuffix: boolean } {
  if (slug.endsWith(SUFFIX)) {
    return { base: slug.slice(0, -SUFFIX.length), hasSuffix: true };
  }
  return { base: slug, hasSuffix: false };
}

export async function generateStaticParams(): Promise<Params[]> {
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const cityParams: Params[] = JAPAN_CITIES.map((c) => ({ slug: `${c}${SUFFIX}` }));

  // Companies with ≥1 Japan job.
  const japanJobs = filterJapanJobs(allJobs);
  const companies = new Set(japanJobs.map((j) => generateCompanySlug(j.company)));
  const companyParams: Params[] = Array.from(companies)
    .filter((c) => !BLOCKED_COMPANY_SLUGS.has(c))
    .map((c) => ({ slug: `${c}${SUFFIX}` }));

  return [...cityParams, ...companyParams];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { base } = stripSuffix(slug);
  if (BLOCKED_COMPANY_SLUGS.has(base)) return { title: 'Not Found | Stapply' };

  if (JAPAN_CITIES.includes(base)) {
    const display = JAPAN_CITY_DISPLAY[base];
    const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
    const jobs = filterJapanCityJobs(allJobs, base);
    const title = `${display.ja}のテック求人（${jobs.length}件）— AI・エンジニア | Stapply`;
    return {
      title,
    };
  }

  // Company
  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');
  const companyJobs = allJobs.filter((j) => generateCompanySlug(j.company) === base);
  if (companyJobs.length === 0) return { title: 'Not Found | Stapply' };
  const companyName = companyJobs[0].company;
  const japanCompanyJobs = companyJobs.filter((j) => filterJapanJobs([j]).length > 0);
  const title = `${companyName}の求人・採用情報（${japanCompanyJobs.length}件の日本求人）| Stapply`;

  return {
    title,
  };
}

export default async function JaSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { base, hasSuffix } = stripSuffix(slug);
  if (!hasSuffix) notFound();
  if (BLOCKED_COMPANY_SLUGS.has(base)) notFound();

  const allJobs = await loadJobsWithCoordinatesServer('/ai.csv');

  // City branch
  if (JAPAN_CITIES.includes(base)) {
    const display = JAPAN_CITY_DISPLAY[base];
    const jobs = filterJapanCityJobs(allJobs, base);
    if (jobs.length === 0) notFound();

    const companies = Array.from(
      jobs.reduce<Map<string, number>>((acc, job) => {
        acc.set(job.company, (acc.get(job.company) ?? 0) + 1);
        return acc;
      }, new Map()),
    ).sort((a, b) => b[1] - a[1]);

    const roles = Array.from(
      jobs.reduce<Map<string, number>>((acc, job) => {
        const b = extractBaseRole(job.title);
        acc.set(b, (acc.get(b) ?? 0) + 1);
        return acc;
      }, new Map()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const faqs = [
      {
        q: `${display.ja}で現在募集中のテック求人はどのくらいありますか？`,
        a: `Stapply Map では、${display.ja}（${display.en}）で ${jobs.length.toLocaleString()} 件のテック・AI関連求人を掲載しています。${companies.length} 社の企業が採用中で、毎日最新情報に更新されています。`,
      },
      {
        q: `${display.ja}で採用中の主な企業は？`,
        a: `${display.ja}で特に積極的に採用しているのは ${companies
          .slice(0, 5)
          .map(([c]) => c)
          .join('、')} などです。`,
      },
      {
        q: `${display.ja}で英語のみで応募できる求人はありますか？`,
        a: `はい。OpenAI、Anthropic、Google、Microsoft などのグローバル企業が ${display.ja} で募集する AI・エンジニアリング職の多くは英語で応募・勤務が可能です。日本語必須の求人は求人タイトルに記載されています。`,
      },
    ];

    return (
      <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]" lang="ja">
        <PageHeader />

        <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
          <nav className="flex items-center gap-2 text-[13px] text-white/50">
            <Link href="/ja" className="hover:text-white/70 transition-colors no-underline">
              日本の求人
            </Link>
            <span>/</span>
            <span className="text-white/70">{display.ja}</span>
          </nav>

          <section className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
              {display.ja}のテック求人
            </h1>
            <p className="text-white/70 text-[15px] leading-relaxed m-0 max-w-2xl">
              {display.ja}（{display.en}）で募集中のテック・AI関連求人を {jobs.length.toLocaleString()} 件、{companies.length} 社から毎日更新しています。
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                {jobs.length.toLocaleString()} 件の求人
              </span>
              <Link
                href={`/japan/${base}`}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 no-underline hover:bg-white/10"
              >
                English →
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">公開求人一覧</h2>
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
                {display.ja}で採用中の企業
              </h2>
              <div className="flex flex-wrap gap-2">
                {companies.slice(0, 24).map(([company, count]) => (
                  <Link
                    key={company}
                    href={`/ja/${generateCompanySlug(company)}-kyujin`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80 hover:bg-white/10 no-underline"
                  >
                    {company}（{count}）
                  </Link>
                ))}
              </div>
            </section>
          )}

          {roles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">人気の職種</h2>
              <div className="flex flex-wrap gap-2">
                {roles.map(([role, count]) => (
                  <span
                    key={role}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/80"
                  >
                    {role}（{count}）
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">よくある質問</h2>
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

  // Company branch
  const companyJobs = allJobs.filter((j) => generateCompanySlug(j.company) === base);
  if (companyJobs.length === 0) notFound();
  const companyName = companyJobs[0].company;
  const japanCompanyJobs = companyJobs.filter((j) => filterJapanJobs([j]).length > 0);

  const faqs = [
    {
      q: `${companyName}は日本で採用していますか？`,
      a:
        japanCompanyJobs.length > 0
          ? `はい。${companyName} は日本で現在 ${japanCompanyJobs.length} 件のポジションを募集中です。詳細と応募方法はこのページの求人リストから確認できます。`
          : `${companyName} は現在、日本拠点で直接募集中のポジションはありませんが、リモートでの応募が可能な求人が ${companyJobs.length} 件あります。`,
    },
    {
      q: `${companyName}の求人は英語で応募できますか？`,
      a: `${companyName} の多くのポジションは英語で応募・勤務が可能です。求人ごとの要件は詳細ページで確認してください。`,
    },
    {
      q: `${companyName} の求人情報はどのくらいの頻度で更新されますか？`,
      a: '毎日、各企業の採用ページから自動で最新情報を取得しています。掲載から45日を超えた求人は自動的に除外されます。',
    },
  ];

  const jobsToShow = japanCompanyJobs.length > 0 ? japanCompanyJobs : companyJobs;

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]" lang="ja">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        <nav className="flex items-center gap-2 text-[13px] text-white/50">
          <Link href="/ja" className="hover:text-white/70 transition-colors no-underline">
            日本の求人
          </Link>
          <span>/</span>
          <span className="text-white/70">{companyName}</span>
        </nav>

        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
            {companyName}の求人・採用情報
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed m-0 max-w-2xl">
            {japanCompanyJobs.length > 0
              ? `${companyName} は日本国内で現在 ${japanCompanyJobs.length} 件のポジションを募集中です。`
              : `${companyName} は現在、日本勤務の求人は募集していませんが、リモートやグローバルのポジションが ${companyJobs.length} 件公開されています。`}
            毎日更新。
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              日本：{japanCompanyJobs.length} 件
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              全体：{companyJobs.length} 件
            </span>
            <Link
              href={`/jobs/${base}`}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 no-underline hover:bg-white/10"
            >
              English →
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            {japanCompanyJobs.length > 0 ? '日本の求人' : 'グローバル求人'}
          </h2>
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
            <AllJobsList jobs={jobsToShow} hideCompanyName={true} />
          </Suspense>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">よくある質問</h2>
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
