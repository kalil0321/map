'use client';

import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { CommandMenu } from '@/components/command-menu';

interface StatsOverlayProps {
  totalJobs: number;
  displayedJobs: number;
  totalLocations: number;
  popupOpen?: boolean;
  onOpenFilters?: () => void;
  onOpenJobList?: () => void;
  onOpenAlert?: () => void;
  hasActiveFilters?: boolean;
}

export function StatsOverlay({ totalJobs, displayedJobs, totalLocations, popupOpen = false, onOpenFilters, onOpenJobList, onOpenAlert, hasActiveFilters = false }: StatsOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dragging logic
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Hide on mobile when popup is open to prevent overlap
  const shouldHide = isMobile && popupOpen;

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          left: isMobile ? undefined : `${position.x}px`,
          top: isMobile ? undefined : `${position.y}px`,
        }}
        className={clsx(
          'stats-overlay',
          'absolute z-1',
          'bg-black/50 backdrop-blur-2xl',
          'border border-white/10 rounded-2xl',
          'text-white font-[system-ui,-apple-system,BlinkMacSystemFont,"Inter",sans-serif]',
          'transition-opacity duration-200 ease-in-out',
          'px-5 py-4 min-w-[200px]',
          'shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
          'max-md:top-3 max-md:left-3 max-md:px-4 max-md:py-3 max-md:min-w-[160px]',
          {
            'opacity-0 pointer-events-none': shouldHide,
            'opacity-100 pointer-events-auto': !shouldHide,
            'cursor-move': !isMobile,
            'select-none': isDragging,
          }
        )}
        onMouseDown={!isMobile ? handleMouseDown : undefined}
      >
        <div className="flex flex-col gap-3 text-[13px] tracking-[0.01em]">
          <div className="flex items-center gap-2">
            <div className="stats-number text-[32px] md:text-[32px] max-md:text-2xl font-light text-white leading-none tabular-nums">
              {displayedJobs.toLocaleString()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCommandMenuOpen(true);
              }}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded-md',
                'text-white/60 hover:text-white/90 hover:bg-white/10',
                'transition-all duration-200 flex-shrink-0',
                'text-[11px] font-medium tracking-wide'
              )}
              aria-label="Open navigation menu"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>

          <div className="flex gap-4 text-xs text-white/60">
            <div>
              <div className="tabular-nums">
                {totalLocations.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/40">
                locations
              </div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="tabular-nums">
                {totalJobs.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/40">
                total
              </div>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        {(onOpenFilters || onOpenJobList || onOpenAlert) && (
          <div className="mt-3 pt-3 border-t border-white/8 flex flex-col gap-2">
            <div className="flex gap-2">
              {onOpenFilters && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFilters();
                  }}
                  className={clsx(
                    'text-white no-underline flex-1',
                    'bg-white/8 px-[10px] py-1 rounded-full',
                    'border border-white/12',
                    'text-[11px] lg:text-[12px] inline-flex items-center justify-center gap-1.5',
                    'transition-[border-color,background-color] duration-200 ease-in-out',
                    'hover:bg-white/12 hover:border-white/20',
                    'cursor-pointer relative'
                  )}
                >
                  Filter
                  {hasActiveFilters && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )}
              {onOpenJobList && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenJobList();
                  }}
                  className={clsx(
                    'text-white no-underline flex-1',
                    'bg-white/8 px-[10px] py-1 rounded-full',
                    'border border-white/12',
                    'text-[11px] lg:text-[12px] inline-flex items-center justify-center gap-1.5',
                    'transition-[border-color,background-color] duration-200 ease-in-out',
                    'hover:bg-white/12 hover:border-white/20',
                    'cursor-pointer'
                  )}
                >
                  All Jobs
                </button>
              )}
            </div>
            <Link
              href="https://github.com/kalil0321/map"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                'text-white no-underline w-full',
                'bg-blue-500/20 px-[10px] py-1 rounded-full',
                'border border-blue-500/30',
                'text-[11px] lg:text-[12px] inline-flex items-center justify-center gap-1.5',
                'transition-[border-color,background-color] duration-200 ease-in-out',
                'hover:bg-blue-500/30 hover:border-blue-500/40',
                'cursor-pointer'
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </Link>
          </div>
        )}
        {/* Social Links */}
        <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between gap-3 text-[11px] text-white/50">
          <Link
            href="https://x.com/stapply_ai"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="no-underline transition-colors duration-200 hover:text-white/80 flex items-center gap-1"
            aria-label="Follow on X"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow on X
          </Link>
          <Link
            href="https://stapply.ai/waitlist"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="no-underline transition-colors duration-200 hover:text-white/80 flex items-center gap-1"
            aria-label="Join waitlist"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Waitlist
          </Link>
        </div>
      </div>
      {/* Command Menu - rendered outside the stats overlay */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
      />
    </>
  );
}
