'use client';

import clsx from 'clsx';
import { useAppliedJobs } from '@/hooks/use-applied-jobs';

interface AppliedJobButtonProps {
  atsId: string;
  name?: string;
  company?: string;
  variant?: 'icon' | 'button' | 'compact';
  className?: string;
}

export function AppliedJobButton({
  atsId,
  name,
  company,
  variant = 'compact',
  className,
}: AppliedJobButtonProps) {
  const { isApplied, toggleApplied } = useAppliedJobs();
  const applied = isApplied(atsId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleApplied(atsId, name, company);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={clsx(
          'transition-colors duration-200',
          applied
            ? 'text-emerald-400 hover:text-emerald-300'
            : 'text-white/40 hover:text-white/70',
          className
        )}
        aria-label={applied ? 'Unmark applied' : 'Mark applied'}
        title={applied ? 'Unmark applied' : 'Mark applied'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
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
          applied
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/40'
            : 'bg-white/8 text-white border-white/12 hover:bg-white/12 hover:border-white/20',
          className
        )}
        aria-label={applied ? 'Unmark applied' : 'Mark applied'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        {applied ? 'Applied' : 'Mark Applied'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1 px-[10px] py-0.5 rounded-full text-[11px] md:text-[12px] font-medium',
        'border transition-[border-color,background-color] duration-200 ease-in-out',
        applied
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/40'
          : 'bg-white/8 text-white border-white/12 hover:bg-white/12 hover:border-white/20',
        className
      )}
      aria-label={applied ? 'Unmark applied' : 'Mark applied'}
    >
      <svg
        width="10"
        height="10"
        className="md:w-[11px] md:h-[11px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {applied ? 'Applied' : 'Mark Applied'}
    </button>
  );
}
