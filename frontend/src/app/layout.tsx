import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title:       "Pulse Market — Reactive Prediction Markets on Somnia",
  description:
    "The first prediction market where markets settle automatically the instant an on-chain event fires, powered by Somnia's native reactivity layer.",
  keywords:    ["prediction market", "Somnia", "blockchain", "reactive", "DeFi", "web3"],
  openGraph: {
    title:       "Pulse Market",
    description: "Reactive prediction markets that auto-settle via on-chain events",
    type:        "website",
    siteName:    "Pulse Market",
  },
  twitter: {
    card:    "summary_large_image",
    title:   "Pulse Market",
    description: "Reactive prediction markets on Somnia",
  },
};

export const viewport: Viewport = {
  themeColor:    "#04080f",
  width:         "device-width",
  initialScale:  1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-dark-500 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
