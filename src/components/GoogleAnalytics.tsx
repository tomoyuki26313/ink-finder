'use client'

import Script from 'next/script'

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  
  if (!gaId || gaId === 'G-XXXXXXXXXX') {
    return null
  }

  // Disable Google Analytics on admin pages to avoid conflicts
  if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
    return null
  }
  
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}

// Event tracking helper
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Specific tracking functions for Ink Finder
export const trackArtistView = (artistName: string, artistId: string) => {
  trackEvent('view_artist', 'Artist', artistName)
}

export const trackSearch = (searchQuery: string, resultCount: number) => {
  trackEvent('search', 'Search', searchQuery, resultCount)
}

export const trackStyleFilter = (styleName: string) => {
  trackEvent('filter_style', 'Filter', styleName)
}

export const trackLocationFilter = (location: string) => {
  trackEvent('filter_location', 'Filter', location)
}

export const trackInstagramClick = (artistName: string) => {
  trackEvent('instagram_click', 'Social', artistName)
}

export const trackBookingClick = (artistName: string) => {
  trackEvent('booking_intent', 'Conversion', artistName)
}