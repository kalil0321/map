import Link from 'next/link';
import { PageHeader } from './page-header';
import { Footer } from './footer';

interface Action {
  label: string;
  href: string;
}

/* Shared not-found / error layout — on-system (PageHeader + dotted icon card +
 * footer). Used by the 404 page and the inline company/job not-found states. */
export function NotFoundPage({
  code,
  title,
  message,
  actions,
}: {
  code?: string;
  title: string;
  message: string;
  actions: Action[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      <PageHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border-2 border-dotted border-[var(--line-strong)] bg-[var(--paper-3)] text-[var(--ink-mute)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          {code && (
            <p className="lab-header text-[56px] font-normal leading-none tracking-tight text-[var(--ink-faint)]">
              {code}
            </p>
          )}

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] text-[var(--ink-mute)]">{message}</p>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {actions.map((a, i) => (
              <Link
                key={a.href}
                href={a.href}
                className={
                  i === 0
                    ? 'inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--ink)] px-4 py-2 text-[13px] font-medium text-[var(--bg)] no-underline transition-opacity hover:opacity-90'
                    : 'inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--paper-3)] px-4 py-2 text-[13px] font-medium text-[var(--ink-soft)] no-underline transition-colors hover:text-[var(--ink)]'
                }
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
