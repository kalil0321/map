import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';

const baseUrl = "https://map.stapply.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Stapply Job Map - Explore Jobs at Tech Companies Worldwide",
    template: "%s | Stapply",
  },
  description: "Interactive map visualizer for exploring job opportunities worldwide. Search, filter, and discover jobs from top tech companies.",
  keywords: [
    "AI jobs",
    "tech jobs",
    "job search",
    "job map",
    "remote jobs",
    "software engineering jobs",
    "machine learning jobs",
    "data science jobs",
    "startup jobs",
    "openai jobs",
    "anthropic jobs",
    "mistral ai jobs",
    "deepmind jobs",
    "cohere jobs",
    "hugging face jobs",
    "google jobs",
    "microsoft jobs",
    "apple jobs",
    "amazon jobs",
    "facebook jobs",
    "twitter jobs",
    "job search",
    "stapply jobs",
    "stapply job map",
    "stapply job search",
    "stapply job filter",
    "stapply job discover",
    "stapply job explore",
    "stapply job map",
    "stapply job search",
    "stapply job filter",
    "stapply job discover",
    "stapply job explore",
    "sentry",
    "cloudflare",
    "deepmind",
    "cohere",
    "tech careers",
  ],
  authors: [{ name: "Stapply" }],
  creator: "Stapply",
  publisher: "Stapply",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Stapply Job Map",
    title: "Stapply Job Map - Explore Jobs at Tech Companies Worldwide",
    description: "Interactive map visualizer for exploring job opportunities worldwide. Search, filter, and discover jobs from top tech companies.",
    images: [
      {
        url: "/opengraph-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Stapply Job Map - Explore Jobs at Tech Companies Worldwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stapply Job Map - Explore Jobs at Tech Companies Worldwide",
    description: "Interactive map visualizer for exploring job opportunities worldwide",
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
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
    // Add social media links when available
    // "https://twitter.com/stapply",
    // "https://linkedin.com/company/stapply",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stapply Job Map",
  url: baseUrl,
  description: "Interactive map visualizer for exploring job opportunities from tech companies worldwide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
        <Analytics />
        {children}
      </body>
    </html>
  );
}
