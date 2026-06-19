import Link from 'next/link';
import { StapplyLockup } from './logo';
import { IconNavLinks, FOOTER_NAV_ITEMS } from './brand';

/* Minimal footer — mirrors the landing/viewer FooterMinimal (no theme
 * switcher; the map is dark-only). Use inside a flex-col page container so
 * mt-auto pins it to the bottom on short pages. */
export function Footer() {
    return (
        <footer className="lab-header mt-auto border-t-2 border-dotted border-[color:var(--line-strong)] bg-[color:var(--shell)] px-6 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        aria-label="Stapply home"
                        className="inline-flex items-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand)]"
                    >
                        <StapplyLockup size={20} />
                    </Link>
                    <span className="mx-1.5 hidden h-4 w-px bg-[color:var(--line-strong)] sm:block" />
                    <nav className="hidden items-center gap-1 sm:flex">
                        <IconNavLinks items={FOOTER_NAV_ITEMS} />
                    </nav>
                </div>
                <span className="text-[13px] text-[color:var(--ink-soft)]">2026 © Stapply</span>
            </div>
        </footer>
    );
}
