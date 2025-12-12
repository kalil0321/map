import Link from 'next/link';
import clsx from 'clsx';

interface SocialLinksProps {
    variant?: 'fixed' | 'inline';
    className?: string;
}

export function SocialLinks({ variant = 'fixed', className }: SocialLinksProps) {
    if (variant === 'fixed') {
        return (
            <div className={clsx(
                'fixed bottom-4 right-4 z-40',
                'flex items-center gap-2',
                className
            )}>
                <Link
                    href="https://github.com/kalil0321/map"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                        'flex items-center gap-1.5',
                        'px-3 py-1.5 rounded-full',
                        'bg-white/8 border border-white/12',
                        'text-[11px] font-medium text-white/70',
                        'no-underline transition-all duration-200',
                        'hover:bg-white/12 hover:border-white/20 hover:text-white'
                    )}
                    aria-label="Star on GitHub"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Star on GitHub
                </Link>
                <Link
                    href="https://x.com/stapply_ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                        'flex items-center gap-1.5',
                        'px-3 py-1.5 rounded-full',
                        'bg-white/8 border border-white/12',
                        'text-[11px] font-medium text-white/70',
                        'no-underline transition-all duration-200',
                        'hover:bg-white/12 hover:border-white/20 hover:text-white'
                    )}
                    aria-label="Follow on X"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Follow
                </Link>
                <Link
                    href="https://stapply.ai/waitlist"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                        'flex items-center gap-1.5',
                        'px-3 py-1.5 rounded-full',
                        'bg-blue-500/20 border border-blue-500/30',
                        'text-[11px] font-medium text-white',
                        'no-underline transition-all duration-200',
                        'hover:bg-blue-500/30 hover:border-blue-500/40'
                    )}
                    aria-label="Join waitlist"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Waitlist
                </Link>
            </div>
        );
    }

    return (
        <div className={clsx(
            'flex items-center gap-2',
            className
        )}>
            <Link
                href="https://github.com/kalil0321/map"
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    'flex items-center gap-1.5',
                    'px-3 py-1.5 rounded-full',
                    'bg-white/8 border border-white/12',
                    'text-[11px] font-medium text-white/70',
                    'no-underline transition-all duration-200',
                    'hover:bg-white/12 hover:border-white/20 hover:text-white'
                )}
                aria-label="Star on GitHub"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Star
            </Link>
            <Link
                href="https://x.com/stapply_ai"
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    'flex items-center gap-1.5',
                    'px-3 py-1.5 rounded-full',
                    'bg-white/8 border border-white/12',
                    'text-[11px] font-medium text-white/70',
                    'no-underline transition-all duration-200',
                    'hover:bg-white/12 hover:border-white/20 hover:text-white'
                )}
                aria-label="Follow on X"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Follow on X
            </Link>
            <Link
                href="https://stapply.ai/waitlist"
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    'flex items-center gap-1.5',
                    'px-3 py-1.5 rounded-full',
                    'bg-blue-500/20 border border-blue-500/30',
                    'text-[11px] font-medium text-white',
                    'no-underline transition-all duration-200',
                    'hover:bg-blue-500/30 hover:border-blue-500/40'
                )}
                aria-label="Join waitlist"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Waitlist
            </Link>
        </div>
    );
}

