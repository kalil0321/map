'use client';

import clsx from 'clsx';

interface UnavailableJobCardProps {
  atsId: string;
  onRemove: (atsId: string) => void;
}

export function UnavailableJobCard({ atsId, onRemove }: UnavailableJobCardProps) {
  return (
    <div className="pr-4 pt-2.5 pb-2.5 opacity-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-[14px] md:text-[16px] font-medium text-white/50 mb-1 leading-normal">
            Job ID: {atsId}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] md:text-[13px] font-medium rounded-full px-[6px] py-0.5 border bg-red-500/10 text-red-400/80 border-red-500/20">
              No longer available
            </span>
          </div>

          <button
            onClick={() => onRemove(atsId)}
            className="inline-flex items-center gap-1 px-[10px] py-0.5 bg-white/8 text-white rounded-full text-[11px] md:text-[12px] font-medium border border-white/12 transition-[border-color,background-color] duration-200 ease-in-out hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
