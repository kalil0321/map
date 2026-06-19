// Stapply mark — ported 1:1 from the landing/viewer (StapplyDocs glyph).
export const StapplyLogo = ({ size = 36 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label="Stapply logo - stacked documents icon"
    >
        <rect x="3" y="6" width="14" height="16" rx="2" fill="#60a5fa" opacity="0.3"></rect>
        <rect x="4" y="4" width="14" height="16" rx="2" fill="#3b82f6" opacity="0.85"></rect>
        <rect x="5" y="2" width="14" height="16" rx="2" fill="#2563eb" opacity="0.95"></rect>
        <rect x="7" y="4" width="10" height="3" rx="1" fill="white"></rect>
        <line x1="7" y1="9" x2="17" y2="9" strokeWidth="0.5" stroke="white" opacity="0.6"></line>
        <line x1="7" y1="11" x2="15" y2="11" strokeWidth="0.5" stroke="white" opacity="0.6"></line>
        <line x1="7" y1="13" x2="16" y2="13" strokeWidth="0.5" stroke="white" opacity="0.6"></line>
    </svg>
);

// Full lockup: mark + Fredoka wordmark — matches the landing/viewer header logo.
export const StapplyLockup = ({ size = 20 }: { size?: number }) => (
    <span className="inline-flex items-center gap-2">
        <StapplyLogo size={size} />
        <span
            className="text-lg font-normal tracking-tight text-[color:var(--ink)]"
            style={{ fontFamily: "var(--font-fredoka), ui-sans-serif, system-ui, sans-serif" }}
        >
            Stapply
        </span>
    </span>
);
