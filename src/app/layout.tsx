import type { Metadata } from "next";
import "./globals.css";
import { fredoka, urbanist } from "./fonts";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NuqsProvider } from '@/components/nuqs-provider';

const baseUrl = "https://map.stapply.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Stapply Map",
  robots: {
    index: false,
    follow: false,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${urbanist.variable}`}>
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
        <Analytics />
        <SpeedInsights />
        <NuqsProvider>
          {children}
        </NuqsProvider>
      </body>
    </html>
  );
}
