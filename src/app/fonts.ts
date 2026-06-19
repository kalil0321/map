import { Fredoka, Urbanist } from "next/font/google";

// Fredoka (400 only) — brand wordmark + header/footer chrome.
export const fredoka = Fredoka({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

// Urbanist — body text across the Stapply design system.
export const urbanist = Urbanist({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});
