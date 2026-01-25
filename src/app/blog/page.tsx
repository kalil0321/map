import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Stapply Blog - Job Search Tips, Tech Career Advice & Hiring Insights',
  description: 'Expert advice on job searching, applying to tech companies, and navigating the modern job market. Learn about AI careers, remote work, and opportunities in Japan.',
  alternates: {
    canonical: 'https://map.stapply.ai/blog',
  },
};

export default function BlogPage() {
  const posts = [
    {
      slug: 'best-websites-to-apply-for-jobs',
      title: 'Best Websites to Apply for Jobs in 2026: Complete Comparison',
      description: 'A comprehensive comparison of the best job search websites, including LinkedIn, Indeed, Glassdoor, and Stapply. Find out which platform is right for your tech career.',
      date: 'January 25, 2026',
      category: 'Job Search',
    },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <PageHeader />
      <main className="max-w-4xl mx-auto px-5 pb-4 md:pb-6 space-y-10 pt-1">
        <section className="space-y-3 pb-8 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">
            Blog
          </h1>
        </section>

        <section className="space-y-10">
          {posts.map((post, index) => (
            <article key={post.slug} className={`space-y-3 ${index < posts.length - 1 ? 'pb-8 border-b border-white/10' : ''}`}>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <span>{post.category}</span>
                <span>·</span>
                <span>{post.date}</span>
              </div>

              <h2 className="text-xl font-medium text-white/90">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-white/90 hover:text-white transition-colors no-underline"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="text-white/60 leading-relaxed">{post.description}</p>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors no-underline text-sm"
              >
                Read article
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </article>
          ))}
        </section>


      </main>
    </div>
  );
}
