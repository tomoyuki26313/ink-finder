// Structured Data Component for SEO
// Implements Schema.org JSON-LD

import Script from 'next/script'
import { structuredData } from '@/lib/seo-config'

interface StructuredDataProps {
  type: 'website' | 'organization' | 'artist' | 'blogPost' | 'breadcrumb'
  data?: any
  locale: 'ja' | 'en'
}

export function StructuredData({ type, data, locale }: StructuredDataProps) {
  let jsonLd: any
  
  switch (type) {
    case 'website':
      jsonLd = structuredData.website(locale)
      break
    case 'organization':
      jsonLd = structuredData.organization
      break
    case 'artist':
      if (data) {
        jsonLd = structuredData.artist(data, locale)
      }
      break
    case 'blogPost':
      if (data) {
        jsonLd = structuredData.blogPost(data, locale)
      }
      break
    case 'breadcrumb':
      if (data) {
        jsonLd = structuredData.breadcrumb(data)
      }
      break
    default:
      return null
  }
  
  if (!jsonLd) return null
  
  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
      }}
      strategy="afterInteractive"
    />
  )
}

// FAQ Schema Component
export function FAQSchema({ faqs, locale }: { faqs: Array<{question: string, answer: string}>, locale: 'ja' | 'en' }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
  
  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
      }}
      strategy="afterInteractive"
    />
  )
}

// Local Business Schema for Tattoo Studios
export function TattooStudioSchema({ studio, locale }: { studio: any, locale: 'ja' | 'en' }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: studio.name,
    description: studio.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: studio.address,
      addressLocality: studio.city,
      addressRegion: studio.prefecture,
      postalCode: studio.postalCode,
      addressCountry: 'JP'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: studio.latitude,
      longitude: studio.longitude
    },
    url: studio.website,
    telephone: studio.phone,
    priceRange: studio.priceRange || '¥¥¥',
    openingHoursSpecification: studio.hours?.map((hour: any) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hour.day,
      opens: hour.opens,
      closes: hour.closes
    })),
    image: studio.images,
    sameAs: [
      studio.instagram && `https://www.instagram.com/${studio.instagram}`,
      studio.facebook && `https://www.facebook.com/${studio.facebook}`,
      studio.twitter && `https://twitter.com/${studio.twitter}`
    ].filter(Boolean)
  }
  
  return (
    <Script
      id={`studio-schema-${studio.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
      }}
      strategy="afterInteractive"
    />
  )
}

// Event Schema for Tattoo Conventions
export function TattooEventSchema({ event, locale }: { event: any, locale: 'ja' | 'en' }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      '@type': 'Place',
      name: event.venueName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.address,
        addressLocality: event.city,
        addressCountry: 'JP'
      }
    },
    image: event.image,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
      url: event.organizerUrl
    },
    offers: event.ticketPrice && {
      '@type': 'Offer',
      price: event.ticketPrice,
      priceCurrency: 'JPY',
      url: event.ticketUrl,
      availability: 'https://schema.org/InStock',
      validFrom: event.ticketSaleStart
    }
  }
  
  return (
    <Script
      id={`event-schema-${event.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
      }}
      strategy="afterInteractive"
    />
  )
}