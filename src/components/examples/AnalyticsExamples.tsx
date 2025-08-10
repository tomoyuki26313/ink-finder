'use client'

import React, { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  useAnalytics, 
  usePageTracking, 
  useInteractionTracking,
  useFormTracking 
} from '@/hooks/useAnalytics'
import {
  useScrollAndTimeTracking,
  useArtistTracking,
  useSearchTracking,
  useLanguageSwitchTracking,
  useFeatureTracking,
  useErrorAndPerformanceTracking,
  useEngagementTracking
} from '@/hooks/useCustomEvents'

// Example: Basic page with analytics tracking
export function AnalyticsPageExample() {
  const { language } = useLanguage()
  
  // Basic page tracking
  usePageTracking('home', { page_type: 'landing' })
  
  // Scroll and time tracking
  useScrollAndTimeTracking()
  
  // Interaction tracking
  const { trackClick } = useInteractionTracking()
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Example Page</h1>
      
      <button 
        onClick={() => trackClick('hero_cta', 'button')}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Track This Click
      </button>
      
      <div className="mt-8 space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-gray-700">
            This is content paragraph {i + 1}. Scroll down to trigger scroll depth tracking.
          </p>
        ))}
      </div>
    </div>
  )
}

// Example: Artist profile page with detailed tracking
export function ArtistProfileExample({ artistId, artistName }: { artistId: string, artistName: string }) {
  const { trackArtistView, trackArtistContact, trackArtistBooking } = useArtistTracking()
  const { trackClick } = useInteractionTracking()
  
  // Track artist view on component mount
  useEffect(() => {
    trackArtistView(artistId, artistName, 'direct_link')
  }, [artistId, artistName, trackArtistView])
  
  const handleContactClick = (method: string) => {
    trackArtistContact(artistId, artistName, method)
    trackClick(`contact_${method}`, 'button')
  }
  
  const handleBookingClick = () => {
    trackArtistBooking(artistId, artistName, 'website')
    trackClick('booking_button', 'button')
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{artistName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Portfolio</h2>
          {/* Portfolio images would go here */}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Contact & Booking</h2>
          
          <button 
            onClick={() => handleContactClick('instagram')}
            className="block w-full bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
          >
            Contact via Instagram
          </button>
          
          <button 
            onClick={() => handleContactClick('email')}
            className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send Email
          </button>
          
          <button 
            onClick={handleBookingClick}
            className="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  )
}

// Example: Search page with filter tracking
export function SearchPageExample() {
  const [query, setQuery] = React.useState('')
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [results, setResults] = React.useState<any[]>([])
  
  const { trackSearch, trackFilter, trackFilterRemove } = useSearchTracking()
  
  const handleSearch = (searchQuery: string) => {
    // Simulate search results
    const mockResults = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
      id: i,
      name: `Result ${i + 1}`
    }))
    
    setResults(mockResults)
    trackSearch(searchQuery, mockResults.length, 'artist_search')
  }
  
  const handleFilterChange = (filterType: string, filterValue: string) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (filterValue) {
        newFilters[filterType] = filterValue
        trackFilter(filterType, filterValue, results.length)
      } else {
        delete newFilters[filterType]
        trackFilterRemove(filterType, prev[filterType])
      }
      
      return newFilters
    })
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search Artists</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="Search for tattoo artists..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button 
          onClick={() => handleSearch(query)}
          className="mt-2 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>
      
      <div className="mb-6 flex gap-4">
        <select 
          onChange={(e) => handleFilterChange('style', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">All Styles</option>
          <option value="traditional">Traditional</option>
          <option value="realistic">Realistic</option>
          <option value="japanese">Japanese</option>
        </select>
        
        <select 
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">All Locations</option>
          <option value="tokyo">Tokyo</option>
          <option value="osaka">Osaka</option>
          <option value="kyoto">Kyoto</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map(result => (
          <div key={result.id} className="border border-gray-200 rounded p-4">
            <h3 className="font-semibold">{result.name}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}

// Example: Language switcher with tracking
export function LanguageSwitcherExample() {
  const { language, setLanguage } = useLanguage()
  const { trackLanguageSwitch } = useLanguageSwitchTracking()
  
  const handleLanguageSwitch = (newLanguage: 'en' | 'ja') => {
    if (newLanguage !== language) {
      trackLanguageSwitch(language, newLanguage, 'toggle')
      setLanguage(newLanguage)
    }
  }
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLanguageSwitch('en')}
        className={`px-3 py-1 rounded ${
          language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageSwitch('ja')}
        className={`px-3 py-1 rounded ${
          language === 'ja' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        日本語
      </button>
    </div>
  )
}

// Example: Contact form with form tracking
export function ContactFormExample() {
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  
  const { trackFormStart, trackFormSubmit, trackFieldError } = useFormTracking('contact_form')
  const { trackError } = useErrorAndPerformanceTracking()
  
  const handleFieldFocus = () => {
    trackFormStart()
  }
  
  const handleFieldError = (fieldName: string, errorMessage: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }))
    trackFieldError(fieldName, 'validation_error')
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      trackFormSubmit(true)
      setFormData({ name: '', email: '', message: '' })
      setErrors({})
    } catch (error) {
      trackFormSubmit(false)
      trackError('form_submission', 'Failed to submit contact form')
    }
  }
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Contact Form</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            onFocus={handleFieldFocus}
            onBlur={() => {
              if (!formData.name.trim()) {
                handleFieldError('name', 'Name is required')
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <input
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            onBlur={() => {
              if (!formData.email.includes('@')) {
                handleFieldError('email', 'Valid email is required')
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <textarea
            placeholder="Your Message"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send Message
        </button>
      </form>
    </div>
  )
}

// Example: Performance monitoring component
export function PerformanceExample() {
  const { trackPerformance, trackLoadTime } = useErrorAndPerformanceTracking()
  
  useEffect(() => {
    // Track page load time
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          trackLoadTime(navigation.loadEventEnd - navigation.fetchStart)
        }
      })
      
      // Track Core Web Vitals if available
      if ('web-vitals' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(metric => trackPerformance('CLS', metric.value))
          getFID(metric => trackPerformance('FID', metric.value))
          getFCP(metric => trackPerformance('FCP', metric.value))
          getLCP(metric => trackPerformance('LCP', metric.value))
          getTTFB(metric => trackPerformance('TTFB', metric.value))
        })
      }
    }
  }, [trackPerformance, trackLoadTime])
  
  return null // This component only tracks performance, doesn't render anything
}