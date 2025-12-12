'use client';

import { useSavedJobs } from '@/hooks/use-saved-jobs';
import clsx from 'clsx';

interface SaveJobButtonProps {
  atsId: string;
  variant?: 'icon' | 'button' | 'compact';
  className?: string;
}

export function SaveJobButton({ atsId, variant = 'compact', className }: SaveJobButtonProps) {
  const { isSaved, toggleSave } = useSavedJobs();
  const saved = isSaved(atsId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(atsId);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={clsx(
          'transition-colors duration-200',
          saved
            ? 'text-blue-400 hover:text-blue-300'
            : 'text-white/40 hover:text-white/70',
          className
        )}
        aria-label={saved ? 'Unsave job' : 'Save job'}
        title={saved ? 'Unsave job' : 'Save job'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium',
          'border transition-[border-color,background-color] duration-200 ease-in-out',
          saved
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/40'
            : 'bg-white/8 text-white border-white/12 hover:bg-white/12 hover:border-white/20',
          className
        )}
        aria-label={saved ? 'Unsave job' : 'Save job'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  // compact variant
  return (
    <button
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1 px-[10px] py-0.5 rounded-full text-[11px] md:text-[12px] font-medium',
        'border transition-[border-color,background-color] duration-200 ease-in-out',
        saved
          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/40'
          : 'bg-white/8 text-white border-white/12 hover:bg-white/12 hover:border-white/20',
        className
      )}
      aria-label={saved ? 'Unsave job' : 'Save job'}
    >
      <svg
        width="10"
        height="10"
        className="md:w-[11px] md:h-[11px]"
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
