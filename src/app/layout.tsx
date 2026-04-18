import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NuqsProvider } from '@/components/nuqs-provider';

const baseUrl = "https://map.stapply.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Stapply Map - Explore Jobs at Tech Companies Worldwide",
    template: "%s | Stapply",
  },
  description: "Stapply Map visualizes every job on an interactive globe—with deep coverage of Japan's AI hubs—while Stapply (cloud + iOS coming soon) helps candidates apply fast and Stapply Workspace powers modern hiring.",
  authors: [{ name: "Stapply" }],
  creator: "Stapply",
  publisher: "Stapply",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Stapply Map",
    title: "Stapply Map - Explore Jobs at Tech Companies Worldwide",
    description: "Explore global roles with a focus on Japan’s AI scene via Stapply Map, manage applications with the Stapply cloud + iOS experience, and scale recruiting through Stapply Workspace.",
    images: [
      {
        url: "/opengraph-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Stapply Map - Explore Jobs at Tech Companies Worldwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stapply Map - Explore Jobs at Tech Companies Worldwide",
    description: "Stapply Map surfaces roles visually with dedicated Japan coverage, the Stapply cloud app lets job seekers apply fast (iOS soon), and Stapply Workspace powers modern hiring.",
    images: ["/opengraph-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icons/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icons/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

// Organization and Website structured data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Stapply",
  url: baseUrl,
  logo: `${baseUrl}/stapply_small.svg`,
  sameAs: [
    "https://x.com/stapply_ai",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stapply Map",
  url: baseUrl,
  description: "Discover jobs on Stapply Map (including extensive Japan listings), apply fast with the Stapply cloud + iOS experience, and collaborate via Stapply Workspace.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best website to apply for jobs online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stapply Map surfaces thousands of curated AI and tech openings, making it one of the best websites to apply for jobs online. Use the interactive map, job list, and AI assistant to identify the right role quickly.",
      },
    },
    {
      "@type": "Question",
      name: "Does Stapply provide a job application platform for employers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Stapply Workspace is the hiring platform for employers—teams submit openings once, highlight remote or on-site roles, and attract candidates already searching for \"best hiring platform\" or \"recruitment software\" alternatives.",
      },
    },
    {
      "@type": "Question",
      name: "Can I search for part-time jobs near me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Filter the dataset by location, company, or keywords like \"part time job search near me\" to find local or remote-friendly opportunities.",
      },
    },
    {
      "@type": "Question",
      name: "Does Stapply cover Japan-based tech roles?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Tokyo, Osaka, Kyoto, Fukuoka, and remote-friendly Japan roles are tagged across Stapply Map, with localized search filters plus Workspace tools for Japanese hiring teams.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Stapply Map, Stapply, and Stapply Workspace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stapply Map is the public interactive map showcasing every curated job, Stapply is the cloud + iOS (coming soon) experience that helps candidates save roles and apply fast, and Stapply Workspace is the employer platform for managing postings and applicants.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* put this in the <head> */}
        {process.env.NODE_ENV === "development" && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/@react-grab/cursor/dist/client.global.js"
              strategy="lazyOnload"
            />
            <Script
              src="//unpkg.com/@react-grab/claude-code/dist/client.global.js"
              strategy="lazyOnload"
            />
          </>
        )}
      </head>
      <body className="antialiased">
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(organizationSchema)}
        </Script>
        <Script
          id="website-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(websiteSchema)}
        </Script>
        <Script
          id="faq-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(faqSchema)}
        </Script>
        <Analytics />
        <SpeedInsights />
        <NuqsProvider>
          {children}
        </NuqsProvider>
      </body>
    </html>
  );
}
