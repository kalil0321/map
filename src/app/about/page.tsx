import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'About Stapply',
  description: 'Stapply is the interactive job map that helps you discover and apply to jobs at tech companies worldwide, with deep coverage of Japan\'s AI hubs.',
  alternates: {
    canonical: 'https://map.stapply.ai/about',
  },
};

export default function AboutPage() {
  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-6 pt-1">
        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">
            About Stapply
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            We're building the best way to discover and apply to jobs at tech companies worldwide.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Our Mission</h2>
          <p className="text-white/60 leading-relaxed">
            Finding the right job shouldn't be overwhelming. Stapply makes job discovery intuitive by visualizing opportunities on an interactive globe, with particular focus on Japan's emerging AI ecosystem.
          </p>
          <p className="text-white/60 leading-relaxed">
            We aggregate openings from leading tech companies, startups, and AI labs—then present them in a way that helps you understand not just what's available, but where the opportunities are.
          </p>
        </section>

        <section className="space-y-8">
          <h2 className="text-xl font-medium text-white/90">Our Products</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-2 text-white/90">Stapply Map</h3>
              <p className="text-white/60 leading-relaxed mb-3">
                The interactive job map you're using right now. Explore thousands of tech jobs visualized on a globe, filter by company, role, or location, and discover opportunities you might have missed.
              </p>
              <Link
                href="/"
                className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1.5 no-underline text-sm"
              >
                Explore the map
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-white/90">Stapply</h3>
              <p className="text-white/60 leading-relaxed">
                Our cloud application (with iOS coming soon) helps you save jobs, set up alerts, and apply quickly. Think of it as your personal job search command center.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-white/90">Stapply Workspace</h3>
              <p className="text-white/60 leading-relaxed">
                For hiring teams, Workspace is the modern recruiting platform that helps you post jobs, manage candidates, and reach qualified applicants faster.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Why Japan?</h2>
          <p className="text-white/60 leading-relaxed">
            Japan is experiencing an AI renaissance, with Tokyo, Osaka, and Kyoto emerging as major tech hubs. We provide extensive coverage of Japanese tech companies, bilingual listings, and localized search features to help candidates and companies connect in this growing market.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white/90">Get in Touch</h2>
          <p className="text-white/60 leading-relaxed">
            Have questions or feedback? We'd love to hear from you.
          </p>
          <a
            href="https://x.com/stapply_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors no-underline text-sm"
          >
            Follow us on X
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </section>

        <section className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors no-underline text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to job map
          </Link>
        </section>
      </main>
    </div>
  );
}
