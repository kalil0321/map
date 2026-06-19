'use client';

import clsx from 'clsx';

interface SearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* Shared search bar — 1:1 with the data app (viewer): pill radius, 2px dotted
 * border, raised surface, brand focus, leading magnifier in a 40px box, and a
 * clear button. (bg uses --paper-3 — the dark theme's raised surface, the
 * equivalent of the viewer's light --paper.) */
export function SearchField({
  value,
  onChange,
  placeholder,
  onKeyDown,
  autoFocus,
  className,
  disabled,
}: SearchFieldProps) {
  return (
    <div
      className={clsx(
        'relative flex items-center rounded-[var(--radius-pill)] border-2 border-dotted border-[var(--line-strong)] bg-[var(--paper-3)] transition-colors focus-within:border-[var(--brand)]',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none flex h-10 w-10 items-center justify-center text-[var(--ink-mute)]">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none disabled:cursor-not-allowed"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="flex h-10 w-10 items-center justify-center text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]"
        >
          ×
        </button>
      )}
    </div>
  );
}
