'use client';

import Link from 'next/link';
import { StapplyLockup } from './logo';
import { IconNavLinks } from './brand';

interface PageHeaderProps {
    rightAction?: React.ReactNode;
    /** Show the icon-nav (Companies / Jobs / Map / GitHub) on the right. Default true. */
    showNav?: boolean;
}

/* Page chrome — 1:1 with the landing/viewer HeaderIconNav, in the design
 * system's dark palette. The logo links home. */
export function PageHeader({ rightAction, showNav = true }: PageHeaderProps) {
    return (
        <header className="lab-header sticky top-0 z-50 bg-[color:var(--shell)]/90 backdrop-blur-md px-6 py-3.5 border-b-2 border-dotted border-[color:var(--line-strong)]">
            <div className="flex items-center justify-between gap-6">
                <Link
                    href="/"
                    aria-label="Stapply home"
                    className="inline-flex items-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand)]"
                >
                    <StapplyLockup size={20} />
                </Link>
                <div className="flex items-center gap-1">
                    {rightAction && <div className="mr-2">{rightAction}</div>}
                    {showNav && (
                        <nav className="hidden md:flex items-center gap-1">
                            <IconNavLinks />
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
}
