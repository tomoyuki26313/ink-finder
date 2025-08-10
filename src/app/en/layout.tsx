import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ink Finder - Discover Japanese Tattoo Artists & Studios',
  description: 'Find authentic Japanese tattoo artists and studios. Browse portfolios, read reviews, and book appointments with verified irezumi masters and contemporary tattoo artists across Japan.',
  openGraph: {
    locale: 'en_US',
  },
}

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}