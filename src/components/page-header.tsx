import Link from 'next/link';
import { StapplyLogo } from './logo';
import { SocialLinks } from './social-links';

interface PageHeaderProps {
    rightAction?: React.ReactNode;
    showSocialLinks?: boolean;
}

export function PageHeader({ rightAction, showSocialLinks }: PageHeaderProps) {
    return (
        <header className="bg-black/30 backdrop-blur-2xl sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-white/60 hover:text-white transition-colors shrink-0"
                >
                    <StapplyLogo size={32} />
                </Link>
                <div className="flex items-center gap-4 shrink-0">
                    {rightAction && (
                        <div>
                            {rightAction}
                        </div>
                    )}
                    {showSocialLinks && <SocialLinks variant="inline" />}
                </div>
            </div>
        </header>
    );
}

