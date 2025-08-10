'use client'

import { useCallback, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  hasAnalyticsConsent,
  trackEvent,
  type AnalyticsEvent 
} from '@/lib/analytics'
import { 
  getLanguageAnalytics,
  trackLanguageSwitchPattern,
  trackArtistInteractionByLanguage,
  trackFeatureUsageByLanguage
} from '@/lib/languageAnalytics'

// Hook for tracking scroll depth and time on page
export function useScrollAndTimeTracking() {
  const { language } = useLanguage()
  const pathname = usePathname()
  const scrollDepthRef = useRef<Set<number>>(new Set())
  const startTimeRef = useRef<number>(Date.now())
  const maxScrollRef = useRef<number>(0)

  useEffect(() => {
    if (!hasAnalyticsConsent()) return

    startTimeRef.current = Date.now()
    scrollDepthRef.current = new Set()
    maxScrollRef.current = 0

    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      
      maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent)

      // Track scroll milestones
      const milestones = [25, 50, 75, 90, 100]
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !scrollDepthRef.current.has(milestone)) {
          scrollDepthRef.current.add(milestone)
          trackEvent({
            action: 'scroll_depth',
            category: 'Engagement',
            label: `${milestone}%`,
            value: milestone,
            language
          })
        }
      })
    }

    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000)
      
      if (timeOnPage > 10) { // Only track if user spent more than 10 seconds
        trackEvent({
          action: 'time_on_page',
          category: 'Engagement',
          label: pathname,
          value: timeOnPage,
          language
        })

        trackEvent({
          action: 'max_scroll_depth',
          category: 'Engagement',
          label: pathname,
          value: maxScrollRef.current,
          language
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname, language])
}

// Hook for tracking artist-related interactions
export function useArtistTracking() {
  const { language } = useLanguage()

  const trackArtistView = useCallback((artistId: string, artistName: string, source?: string) => {
    if (!hasAnalyticsConsent()) return

    trackArtistInteractionByLanguage(artistId, artistName, language, 'view', {
      source: source || 'unknown'
    })
  }, [language])

  const trackArtistContact = useCallback((artistId: string, artistName: string, contactMethod: string) => {
    if (!hasAnalyticsConsent()) return

    trackArtistInteractionByLanguage(artistId, artistName, language, 'contact', {
      contact_method: contactMethod
    })
  }, [language])

  const trackArtistPortfolio = useCallback((artistId: string, artistName: string, imageIndex?: number) => {
    if (!hasAnalyticsConsent()) return

    trackArtistInteractionByLanguage(artistId, artistName, language, 'portfolio', {
      image_index: imageIndex
    })
  }, [language])

  const trackArtistBooking = useCallback((artistId: string, artistName: string, bookingType: string) => {
    if (!hasAnalyticsConsent()) return

    trackArtistInteractionByLanguage(artistId, artistName, language, 'booking', {
      booking_type: bookingType
    })
  }, [language])

  return {
    trackArtistView,
    trackArtistContact,
    trackArtistPortfolio,
    trackArtistBooking
  }
}

// Hook for tracking search and filter interactions
export function useSearchTracking() {
  const { language } = useLanguage()
  const languageAnalytics = getLanguageAnalytics(language)

  const trackSearch = useCallback((query: string, resultsCount: number, searchType?: string) => {
    if (!hasAnalyticsConsent()) return

    languageAnalytics.trackLanguageSearch(query, resultsCount)
    
    trackEvent({
      action: 'search_performed',
      category: 'Search',
      label: query,
      value: resultsCount,
      language,
      search_type: searchType || 'general'
    })
  }, [language, languageAnalytics])

  const trackFilter = useCallback((filterType: string, filterValue: string, resultsCount: number) => {
    if (!hasAnalyticsConsent()) return

    trackEvent({
      action: 'filter_applied',
      category: 'Search',
      label: `${filterType}:${filterValue}`,
      value: resultsCount,
      language
    })
  }, [language])

  const trackFilterRemove = useCallback((filterType: string, filterValue: string) => {
    if (!hasAnalyticsConsent()) return

    trackEvent({
      action: 'filter_removed',
      category: 'Search',
      label: `${filterType}:${filterValue}`,
      language
    })
  }, [language])

  const trackSearchRefinement = useCallback((originalQuery: string, refinedQuery: string) => {
    if (!hasAnalyticsConsent()) return

    trackEvent({
      action: 'search_refined',
      category: 'Search',
      label: `${originalQuery}>${refinedQuery}`,
      language
    })
  }, [language])

  return {
    trackSearch,
    trackFilter,
    trackFilterRemove,
    trackSearchRefinement
  }
}

// Hook for tracking language switching behavior
export function useLanguageSwitchTracking() {
  const { language } = useLanguage()
  const pathname = usePathname()

  const trackLanguageSwitch = useCallback((
    fromLanguage: string, 
    toLanguage: string, 
    method: 'toggle' | 'url' | 'auto-detect' = 'toggle'
  ) => {
    if (!hasAnalyticsConsent()) return

    const pageType = pathname.includes('/admin') ? 'admin' : 
                    pathname === '/' || pathname.match(/^\/(en|ja)\/?$/) ? 'home' : 
                    'content'

    trackLanguageSwitchPattern(fromLanguage, toLanguage, pageType, method)
    
    trackEvent({
      action: 'language_switch',
      category: 'Language',
      label: `${fromLanguage}_to_${toLanguage}`,
      language: toLanguage,
      switch_method: method,
      page_type: pageType
    })
  }, [pathname])

  return { trackLanguageSwitch }
}

// Hook for tracking feature usage
export function useFeatureTracking() {
  const { language } = useLanguage()

  const trackFeatureAccess = useCallback((featureName: string, metadata?: Record<string, any>) => {
    if (!hasAnalyticsConsent()) return

    trackFeatureUsageByLanguage(featureName, language, 'accessed', metadata)
  }, [language])

  const trackFeatureUse = useCallback((featureName: string, metadata?: Record<string, any>) => {
    if (!hasAnalyticsConsent()) return

    trackFeatureUsageByLanguage(featureName, language, 'used', metadata)
  }, [language])

  const trackFeatureComplete = useCallback((featureName: string, metadata?: Record<string, any>) => {
    if (!hasAnalyticsConsent()) return

    trackFeatureUsageByLanguage(featureName, language, 'completed', metadata)
  }, [language])

  return {
    trackFeatureAccess,
    trackFeatureUse,
    trackFeatureComplete
  }
}

// Hook for tracking errors and performance
export function useErrorAndPerformanceTracking() {
  const { language } = useLanguage()
  const pathname = usePathname()

  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    if (!hasAnalyticsConsent()) return

    trackEvent({
      action: 'error_occurred',
      category: 'Error',
      label: `${errorType}:${errorMessage}`,
      language,
      page_path: pathname,
      ...context
    })
  }, [language, pathname])

  const trackPerformance = useCallback((metric: string, value: number, threshold?: number) => {
    if (!hasAnalyticsConsent()) return

    const isSlowPerformance = threshold ? value > threshold : false
    
    trackEvent({
      action: 'performance_metric',
      category: 'Performance',
      label: metric,
      value: Math.round(value),
      language,
      is_slow: isSlowPerformance
    })

    if (isSlowPerformance) {
      trackEvent({
        action: 'slow_performance',
        category: 'Performance',
        label: `${metric}_slow`,
        value: Math.round(value),
        language
      })
    }
  }, [language])

  const trackLoadTime = useCallback((loadTime: number) => {
    trackPerformance('page_load_time', loadTime, 3000) // 3 second threshold
  }, [trackPerformance])

  return {
    trackError,
    trackPerformance,
    trackLoadTime
  }
}

// Hook for tracking user engagement patterns
export function useEngagementTracking() {
  const { language } = useLanguage()
  const pathname = usePathname()
  const sessionStartRef = useRef<number>(Date.now())
  const interactionCountRef = useRef<number>(0)

  useEffect(() => {
    sessionStartRef.current = Date.now()
    interactionCountRef.current = 0
  }, [pathname])

  const trackInteraction = useCallback((interactionType: string, target?: string) => {
    if (!hasAnalyticsConsent()) return

    interactionCountRef.current += 1
    
    trackEvent({
      action: 'user_interaction',
      category: 'Engagement',
      label: target ? `${interactionType}:${target}` : interactionType,
      value: interactionCountRef.current,
      language
    })
  }, [language])

  const trackSessionQuality = useCallback(() => {
    if (!hasAnalyticsConsent()) return

    const sessionDuration = Date.now() - sessionStartRef.current
    const interactionCount = interactionCountRef.current
    
    let qualityScore = 0
    if (sessionDuration > 30000 && interactionCount > 2) qualityScore = 3 // High
    else if (sessionDuration > 10000 && interactionCount > 1) qualityScore = 2 // Medium
    else if (sessionDuration > 5000 || interactionCount > 0) qualityScore = 1 // Low
    
    trackEvent({
      action: 'session_quality',
      category: 'Engagement',
      label: `score_${qualityScore}`,
      value: qualityScore,
      language,
      session_duration: Math.round(sessionDuration / 1000),
      interaction_count: interactionCount
    })
  }, [language])

  // Track session quality on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionQuality()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [trackSessionQuality])

  return {
    trackInteraction,
    trackSessionQuality
  }
}