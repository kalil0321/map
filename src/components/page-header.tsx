'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StapplyLogo } from './logo';
import { SocialLinks } from './social-links';
import { CommandMenu } from './command-menu';

interface PageHeaderProps {
    rightAction?: React.ReactNode;
    showSocialLinks?: boolean;
}

export function PageHeader({ rightAction, showSocialLinks = true }: PageHeaderProps) {
    const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

    return (
        <>
            <header className="bg-black/30 backdrop-blur-2xl sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
                    <button
                        onClick={() => setIsCommandMenuOpen(true)}
                        className="text-white/60 hover:text-white transition-colors shrink-0 cursor-pointer bg-transparent border-none p-0"
                        aria-label="Open command menu"
                    >
                        <StapplyLogo size={32} />
                    </button>
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
            <CommandMenu
                isOpen={isCommandMenuOpen}
                onClose={() => setIsCommandMenuOpen(false)}
            />
        </>
    );
}

