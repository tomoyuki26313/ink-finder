import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton, Roboto } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
});

const roboto = Roboto({
  weight: ['300'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Ink Finder - Discover Japanese Tattoo Artists & Studios',
  description: 'Find authentic Japanese tattoo artists and studios. Browse portfolios, read reviews, and book appointments with verified irezumi masters and contemporary tattoo artists across Japan.',
  keywords: [
    'tattoo artists Japan',
    'Japanese tattoo',
    'irezumi',
    'tattoo studios Japan',
    'traditional Japanese tattoo',
    'tattoo booking Japan',
    'Japanese tattoo masters',
    'tattoo portfolio',
    'tattoo directory Japan'
  ],
  authors: [{ name: 'Ink Finder' }],
  creator: 'Ink Finder',
  publisher: 'Ink Finder',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ja_JP',
    url: 'https://www.ink-finder.com',
    siteName: 'Ink Finder',
    title: 'Ink Finder - Discover Japanese Tattoo Artists & Studios',
    description: 'Find authentic Japanese tattoo artists and studios. Browse portfolios, read reviews, and book appointments with verified irezumi masters and contemporary tattoo artists across Japan.',
    images: [
      {
        url: 'https://www.ink-finder.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ink Finder - Japanese Tattoo Artists Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ink Finder - Discover Japanese Tattoo Artists & Studios',
    description: 'Find authentic Japanese tattoo artists and studios. Browse portfolios, read reviews, and book appointments with verified irezumi masters and contemporary tattoo artists across Japan.',
    images: ['https://www.ink-finder.com/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.ink-finder.com',
    languages: {
      'en-US': 'https://www.ink-finder.com/en',
      'ja-JP': 'https://www.ink-finder.com/ja',
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://www.ink-finder.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ink Finder",
              "description": "Find authentic Japanese tattoo artists and studios. Browse portfolios, read reviews, and book appointments with verified irezumi masters and contemporary tattoo artists across Japan.",
              "url": "https://www.ink-finder.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.ink-finder.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Ink Finder",
                "url": "https://www.ink-finder.com"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${roboto.variable} antialiased`}
      >
        <GoogleAnalytics />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}