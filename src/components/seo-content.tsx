'use client';

import Link from 'next/link';

const keywordRows = [
  { keyword: 'best websites to apply for jobs', intent: 'commercial', volume: '8,100', difficulty: '47', cpc: '$5.48', priority: 'High' },
  { keyword: 'part time job search near me', intent: 'navigational', volume: '673,000', difficulty: '30', cpc: '$1.33', priority: 'High' },
  { keyword: 'job search near me', intent: 'navigational', volume: '4,090,000', difficulty: '100', cpc: '$1.51', priority: 'Medium' },
  { keyword: 'best hiring platform', intent: 'commercial', volume: '320', difficulty: '50', cpc: '$97.90', priority: 'Medium' },
  { keyword: 'job application platform', intent: 'commercial', volume: '110', difficulty: '69', cpc: '$11.56', priority: 'Medium' },
  { keyword: 'hiring platform', intent: 'commercial', volume: '1,000', difficulty: '70', cpc: '$70.69', priority: 'Medium' },
  { keyword: 'job application', intent: 'navigational', volume: '450,000', difficulty: '77', cpc: '$2.80', priority: 'Low' },
  { keyword: 'job board', intent: 'commercial', volume: '40,500', difficulty: '99', cpc: '$4.20', priority: 'Low' },
  { keyword: 'apply for jobs online', intent: 'navigational', volume: '1,600', difficulty: '100', cpc: '$4.06', priority: 'Low' },
  { keyword: 'recruitment software', intent: 'navigational', volume: '5,400', difficulty: '99', cpc: '$58.98', priority: 'Low' },
];

interface SeoContentProps {
  totalJobs: number;
}

export function SeoContent({ totalJobs }: SeoContentProps) {
  return (
    <section id="job-application-platform" className="sr-only">
      <div className="space-y-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold">
            SEO Insights
          </p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            The job application platform built to win high-intent searches
          </h2>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed">
            Stapply Map is positioning itself among the <strong>best websites to apply for jobs</strong>.
            With thousands of curated AI and deep-tech openings ({totalJobs.toLocaleString()} and counting) and a fast-growing footprint in Japan,
            we help candidates searching things like “<strong>part time job search near me</strong>”, “<strong>apply for jobs online</strong>”,
            or “<strong>Tokyo AI jobs</strong>” land relevant roles faster. Recruiters visiting for “<strong>best hiring platform</strong>”,
            “<strong>Japan hiring platform</strong>”, and “<strong>recruitment software</strong>” queries discover how our talent graph converts
            passive visitors into qualified applicants.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Japan Spotlight</p>
          <h3 className="text-2xl font-semibold">Tokyo-to-Osaka coverage built-in</h3>
          <p className="text-slate-300 text-base leading-relaxed">
            Japan is now one of the largest traffic sources for Stapply Map. We emphasize bilingual listings,
            city-level filters for Tokyo, Osaka, Kyoto, Fukuoka, Sapporo, and remote-friendly Japanese startups,
            plus internal links to dedicated location hubs like{' '}
            <Link href="/locations/japan" className="text-blue-400 underline hover:text-blue-300">/locations/japan</Link>.
            Stapply Workspace also supports Japanese hiring teams who want a localized funnel without sacrificing global reach.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="px-3 py-1 rounded-full bg-white/10">Tokyo job search</span>
            <span className="px-3 py-1 rounded-full bg-white/10">Japan AI jobs</span>
            <span className="px-3 py-1 rounded-full bg-white/10">Osaka hiring</span>
            <span className="px-3 py-1 rounded-full bg-white/10">Remote Japan roles</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Stapply Map</p>
            <h3 className="text-xl font-semibold">The interactive job map</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Plot every opening on a globe, uncover “job search near me” insights instantly, and click straight into
              postings powered by our public Jobs API.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Stapply</p>
            <h3 className="text-xl font-semibold">Cloud + iOS app (coming soon)</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Job seekers manage saved roles, instant apply packets, and alerts from the web experience today—with
              the dedicated iOS app launching soon for rapid applications on the go.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Stapply Workspace</p>
            <h3 className="text-xl font-semibold">Hiring platform for teams</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Employers publish roles once, syndicate across the map, and collaborate on candidate review with ATS-style
              workflows, positioning Workspace as the modern hiring platform.
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-2xl font-semibold">Why candidates stay</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Local discovery for “job search near me” queries with globe-level filtering.</li>
              <li>AI assistant in the Stapply cloud experience that explains which roles are the best fit for your skill set (with Japan-specific insights).</li>
              <li>Saved searches, alerts, and instant apply flows (web + iOS soon) for remote, hybrid, and <strong>part time job search near me</strong> results.</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-2xl font-semibold">Why hiring teams list roles</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Stapply Workspace captures “<strong>job application platform</strong>” and “<strong>hiring platform</strong>” demand with branded talent pages.</li>
              <li>Structured data + API feeds power syndication to employer branding pages.</li>
              <li>Competitive insights help benchmark against other <strong>job boards</strong> and <strong>recruitment software</strong>, including localized reporting for Japan.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Priority keyword plan</h3>
          <p className="text-slate-300 text-base">
            We prioritize themes that balance volume, intent, and difficulty. These targets influence landing pages, product copy,
            and internal links across <Link href="/jobs" className="text-blue-400 underline hover:text-blue-300">our job directory</Link> and API.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-white/10 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Keyword</th>
                  <th className="px-4 py-3 font-medium">Intent</th>
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium">CPC</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {keywordRows.map((row) => (
                  <tr key={row.keyword} className="border-t border-white/10">
                    <td className="px-4 py-3 font-semibold text-white">{row.keyword}</td>
                    <td className="px-4 py-3">{row.intent}</td>
                    <td className="px-4 py-3">{row.volume}</td>
                    <td className="px-4 py-3">{row.difficulty}</td>
                    <td className="px-4 py-3">{row.cpc}</td>
                    <td className="px-4 py-3">{row.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-violet-500/30 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
          <h3 className="text-2xl font-semibold">Next SEO experiments</h3>
          <p className="text-slate-200">
            We are shipping comparison guides around “best websites to apply for jobs”, building geo-targeted pages for
            “job search near me”, and expanding our API so partners can syndicate curated roles directly inside their own hiring platforms.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="px-3 py-1 rounded-full bg-white/10">Comparison content</span>
            <span className="px-3 py-1 rounded-full bg-white/10">Geo landing pages</span>
            <span className="px-3 py-1 rounded-full bg-white/10">Employer enablement</span>
          </div>
          <Link
            href="/api/jobs"
            className="inline-flex w-fit items-center justify-center rounded-full bg-white text-black px-6 py-2 text-sm font-semibold tracking-wide hover:bg-blue-100 transition-colors"
          >
            Access the public jobs API
          </Link>
        </div>
      </div>
    </section>
  );
}
