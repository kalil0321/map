import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { loadJobsWithCoordinatesServer } from '@/utils/data-processor-server';
import { PageHeader } from '@/components/page-header';
import { AllJobsList } from '@/components/all-jobs-list';

export const metadata: Metadata = {
  title: 'OpenAI 求人・採用情報 | Stapply',
  description:
    'OpenAI の最新求人・採用情報を一覧でチェック。日本から応募できるポジションやリモート勤務の AI 関連求人を Stapply で探索しましょう。',
  keywords: [
    'openai 求人',
    'openai 採用',
    'openai jobs',
    'ai 求人',
    '機械学習 求人',
    'ml エンジニア 求人',
  ],
  openGraph: {
    title: 'OpenAI 求人・採用情報 | Stapply',
    description:
      'OpenAI の最新求人・採用情報を一覧でチェック。日本から応募できるポジションやリモート勤務の AI 関連求人を Stapply で探索しましょう。',
    type: 'website',
    url: 'https://map.stapply.ai/ja/openai-kyujin',
  },
  twitter: {
    card: 'summary',
    title: 'OpenAI 求人・採用情報 | Stapply',
    description:
      'OpenAI の最新求人・採用情報を一覧でチェック。日本から応募できるポジションやリモート勤務の AI 関連求人を Stapply で探索しましょう。',
  },
  alternates: {
    canonical: 'https://map.stapply.ai/ja/openai-kyujin',
    languages: {
      ja: 'https://map.stapply.ai/ja/openai-kyujin',
    },
  },
};

export default async function OpenAIJobsJaPage() {
  const jobs = await loadJobsWithCoordinatesServer('/ai.csv');

  const filtered = jobs.filter((job) => {
    const company = job.company.trim().toLowerCase();
    const location = job.location.toLowerCase();

    const isOpenAI = company.includes('openai');
    const isJapanLocation =
      location.includes('japan') ||
      location.includes('tokyo') ||
      location.includes('日本') ||
      location.includes('東京');

    return isOpenAI && isJapanLocation;
  });

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-6 md:pb-8 space-y-6 pt-1">
        <section className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em]">
            OpenAI の求人一覧（日本・リモート）
          </h1>
          <p className="text-white/60 text-[14px] m-0 max-w-2xl">
            日本から応募しやすい OpenAI のポジションを集めました。機械学習エンジニア、リサーチ、
            プロダクトなどの AI 関連求人を Stapply のジョブマップから探せます。
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {filtered.length.toLocaleString()} 件の求人
            </span>
            <Link
              href="/jobs"
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 no-underline hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              すべての求人を見る
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em] mb-1">OpenAI の公開求人</h2>
          <p className="text-white/60 text-[14px] m-0">
            日本から応募できる OpenAI の求人を一覧表示しています。
          </p>

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
            <AllJobsList jobs={filtered} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}



