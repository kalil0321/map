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
import { generateCompanySlug } from '@/lib/slug-utils';
import { AllJobsList } from '@/components/all-jobs-list';
import { PageHeader } from '@/components/page-header';

// 日本語ハブページ。/japan の英語版と同じデータを日本語 UI で公開する。

export const revalidate = 3600;

const BASE = 'https://map.stapply.ai';

export const metadata: Metadata = {
  title: '日本のテック求人 — AI・機械学習・ソフトウェアエンジニア | Stapply',
};

export default async function JaHubPage() {
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
      q: '現在、日本ではどのくらいのテック求人がありますか？',
      a: `Stapply Map には現在、日本国内で ${japanJobs.length.toLocaleString()} 件のテック関連求人が掲載されています。AI、機械学習、ソフトウェアエンジニアリング、プロダクト、インフラなど、${companies.length} 社の企業からのポジションを網羅しています。`,
    },
    {
      q: '日本で採用している主な企業は？',
      a: `現在 Stapply で最も積極的に採用しているのは ${companies
        .slice(0, 6)
        .map(([c]) => c)
        .join('、')} などです。`,
    },
    {
      q: '海外在住でも日本のテック求人に応募できますか？',
      a: '多くの求人で海外からの応募が可能です。特にAIリサーチ、機械学習エンジニア、リモートポジションはグローバル採用を行っている場合が多いです。各求人ページから応募先の情報を確認できます。',
    },
    {
      q: '英語だけで応募できる求人はありますか？',
      a: 'はい。特に OpenAI、Anthropic、Google、Microsoft など海外本社のグローバル企業では、英語のみで勤務・応募できるポジションが多数あります。日本語要件は各求人の詳細ページに記載されています。',
    },
    {
      q: '英語版のページはありますか？',
      a: 'はい。/japan で英語版のページをご覧いただけます。同じデータを英語UIで表示しています。',
    },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]" lang="ja">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-8 md:pb-12 space-y-8 pt-1">
        <nav className="flex items-center gap-2 text-[13px] text-white/50">
          <Link href="/" className="hover:text-white/70 transition-colors no-underline">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-white/70">日本のテック求人</span>
        </nav>

        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.04em]">
            日本のテック求人
          </h1>
          <p className="text-white/70 text-[15px] leading-relaxed m-0 max-w-2xl">
            日本国内で公開されているテック・AI関連の求人 {japanJobs.length.toLocaleString()} 件を、{companies.length} 社の企業から毎日自動で集めています。東京・大阪・京都・横浜・福岡・リモートのポジションを一覧でチェックできます。
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {japanJobs.length.toLocaleString()} 件の求人
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {companies.length} 社
            </span>
            <Link
              href="/japan"
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 no-underline hover:bg-white/10"
            >
              English →
            </Link>
          </div>
        </section>

        {cityStats.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">都市から探す</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cityStats.map(({ slug, count }) => (
                <Link
                  key={slug}
                  href={`/ja/${slug}-kyujin`}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all no-underline"
                >
                  <div className="text-[15px] font-medium text-white">
                    {JAPAN_CITY_DISPLAY[slug].ja}
                  </div>
                  <div className="text-[13px] text-white/50 mt-0.5">
                    {count} 件の求人
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">日本の全求人</h2>
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
            <h2 className="text-xl font-semibold tracking-[-0.02em]">日本で採用中の企業</h2>
            <div className="flex flex-wrap gap-2">
              {companies.slice(0, 30).map(([company, count]) => (
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
