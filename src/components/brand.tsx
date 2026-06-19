/* Icon-nav primitives — the map's primary nav, styled 1:1 with the
 * landing/viewer chrome (colored icon + ghost hover pill). lucide isn't a
 * dependency here, so the glyphs are inlined (the exact lucide paths). */

import Link from "next/link";
import { SITE } from "@/lib/site";

type SvgProps = React.SVGProps<SVGSVGElement>;

const cn = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(" ");

export function Building(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M10 8h4" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function Briefcase(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

export function MapIcon(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15" />
      <path d="M9 3.236v15" />
    </svg>
  );
}

// GitHub mark — lucide dropped brand glyphs, so inline the official path.
export function GithubIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.57 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.24-3.15-.13-.3-.54-1.52.11-3.17 0 0 1.01-.32 3.3 1.2.96-.26 1.98-.39 3-.4 1.02 0 2.04.14 3 .4 2.29-1.52 3.3-1.2 3.3-1.2.65 1.65.24 2.87.12 3.17.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.69.82.57A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
    </svg>
  );
}

export function Database(props: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

type NavItem = {
  label: string;
  href: string;
  internal: boolean;
  icon: (p: SvgProps) => React.ReactElement;
  iconClass: string;
  hoverClass: string;
};

const VIOLET_ITEM = {
  iconClass:
    "text-[color:var(--violet)] transition-colors group-hover:text-[color:var(--violet-deep)]",
  hoverClass:
    "hover:bg-[color:var(--violet-tint)] hover:text-[color:var(--violet-deep)]",
};
const BRAND_ITEM = {
  iconClass:
    "text-[color:var(--brand)] transition-colors group-hover:text-[color:var(--brand-deep)]",
  hoverClass:
    "hover:bg-[color:var(--brand-tint)] hover:text-[color:var(--brand-deep)]",
};
const INK_ITEM = {
  iconClass: "text-[color:var(--ink)]",
  hoverClass: "hover:bg-[color:var(--paper-3)] hover:text-[color:var(--ink)]",
};

/* The map's primary nav — internal pages (Companies / Jobs / Map) plus a
 * GitHub link to the map's own repo. Each item carries an accent from the
 * design-system palette, matching the family's colored icon-nav. */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Companies",
    href: "/companies",
    internal: true,
    icon: Building,
    iconClass:
      "text-[color:var(--violet)] transition-colors group-hover:text-[color:var(--violet-deep)]",
    hoverClass:
      "hover:bg-[color:var(--violet-tint)] hover:text-[color:var(--violet-deep)]",
  },
  {
    label: "Jobs",
    href: "/jobs",
    internal: true,
    icon: Briefcase,
    iconClass:
      "text-[color:var(--emerald)] transition-colors group-hover:text-[color:var(--emerald-deep)]",
    hoverClass:
      "hover:bg-[color:var(--emerald-tint)] hover:text-[color:var(--emerald-deep)]",
  },
  {
    label: "Map",
    href: "/",
    internal: true,
    icon: MapIcon,
    iconClass:
      "text-[color:var(--brand)] transition-colors group-hover:text-[color:var(--brand-deep)]",
    hoverClass:
      "hover:bg-[color:var(--brand-tint)] hover:text-[color:var(--brand-deep)]",
  },
  {
    label: "GitHub",
    href: SITE.githubMapUrl,
    internal: false,
    icon: GithubIcon,
    ...INK_ITEM,
  },
];

/* The footer's cross-product nav — Data (the viewer) · Map (this app) · GitHub. */
export const FOOTER_NAV_ITEMS: NavItem[] = [
  { label: "Data", href: SITE.dataUrl, internal: false, icon: Database, ...VIOLET_ITEM },
  { label: "Map", href: "/", internal: true, icon: MapIcon, ...BRAND_ITEM },
  { label: "GitHub", href: SITE.githubMapUrl, internal: false, icon: GithubIcon, ...INK_ITEM },
];

/* Shared anchor classes for an icon-nav link — 1:1 with the landing/viewer.
 * The `group` enables the group-hover icon color shift in each iconClass. */
export const NAV_LINK_CLASS =
  "group inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[14px] font-normal text-[color:var(--ink-soft)] transition-colors";

export function IconNavLinks({ items = NAV_ITEMS }: { items?: NavItem[] } = {}) {
  return (
    <>
      {items.map((item) => {
        const className = cn(NAV_LINK_CLASS, item.hoverClass);
        const inner = (
          <>
            <item.icon className={cn("size-4", item.iconClass)} />
            {item.label}
          </>
        );
        return item.internal ? (
          <Link key={item.label} href={item.href} className={className}>
            {inner}
          </Link>
        ) : (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {inner}
          </a>
        );
      })}
    </>
  );
}
