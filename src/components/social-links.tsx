import Link from 'next/link';

interface SocialLinksProps {
    variant?: 'fixed' | 'inline';
    className?: string;
}

export function SocialLinks({ variant = 'fixed', className }: SocialLinksProps) {
    const baseClasses = variant === 'fixed'
        ? 'fixed bottom-1 right-2 z-40 text-xs text-white/60 hover:text-white transition-colors font-mono no-underline mix-blend-difference flex items-center gap-3'
        : 'flex items-center gap-3 text-[13px] text-white/60 hover:text-white transition-colors';

    if (variant === 'fixed') {
        return (
            <div className={className || baseClasses}>
                <Link
                    href="https://github.com/kalil0321/map"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline transition-colors duration-200 hover:text-white"
                    aria-label="View on GitHub"
                >
                    GitHub
                </Link>
                <Link
                    href="https://x.com/stapply_ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline transition-colors duration-200 hover:text-white"
                    aria-label="Follow on X"
                >
                    X
                </Link>
                <Link
                    href="https://stapply.ai/waitlist"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline transition-colors duration-200 hover:text-white"
                    aria-label="Join waitlist"
                >
                    Waitlist
                </Link>
            </div>
        );
    }

    return (
        <div className={className || baseClasses}>
            <Link
                href="https://github.com/kalil0321/map"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline transition-colors duration-200 hover:text-white flex items-center gap-1.5"
                aria-label="View on GitHub"
            >
                Star
            </Link>
            <Link
                href="https://x.com/stapply_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline transition-colors duration-200 hover:text-white flex items-center gap-1.5"
                aria-label="Follow on X"
            >
                Follow on X
            </Link>
            <Link
                href="https://stapply.ai/waitlist"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline transition-colors duration-200 hover:text-white"
                aria-label="Join waitlist"
            >
                Waitlist
            </Link>
        </div>
    );
}

