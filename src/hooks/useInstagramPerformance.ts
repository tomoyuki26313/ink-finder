'use client'

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  embedScriptLoadTime?: number
  firstImageLoadTime?: number
  allImagesLoadTime?: number
  modalOpenToDisplayTime?: number
  preloadHitRate?: number
  totalPreloaded: number
  totalRequested: number
}

// Global performance tracking
const performanceData = new Map<string, number>()
const preloadTracking = {
  preloaded: new Set<string>(),
  requested: new Set<string>(),
  hits: 0,
  misses: 0
}

export function useInstagramPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalPreloaded: 0,
    totalRequested: 0
  })
  const startTimeRef = useRef<number>(0)

  // Mark when embed script starts loading
  const markEmbedScriptStart = () => {
    performanceData.set('embedScriptStart', performance.now())
  }

  // Mark when embed script is loaded
  const markEmbedScriptLoaded = () => {
    const start = performanceData.get('embedScriptStart')
    if (start) {
      const loadTime = performance.now() - start
      performanceData.set('embedScriptLoadTime', loadTime)
      console.log(`📊 Instagram Embed Script Load Time: ${loadTime.toFixed(2)}ms`)
    }
  }

  // Mark when an image is preloaded
  const markImagePreloaded = (url: string) => {
    preloadTracking.preloaded.add(url)
    console.log(`✅ Preloaded: ${url.substring(0, 50)}...`)
  }

  // Mark when an image is actually requested for display
  const markImageRequested = (url: string) => {
    preloadTracking.requested.add(url)
    
    if (preloadTracking.preloaded.has(url)) {
      preloadTracking.hits++
      console.log(`🎯 Cache HIT: ${url.substring(0, 50)}...`)
    } else {
      preloadTracking.misses++
      console.log(`❌ Cache MISS: ${url.substring(0, 50)}...`)
    }
    
    updateMetrics()
  }

  // Mark modal open time
  const markModalOpen = () => {
    startTimeRef.current = performance.now()
    console.log('🚀 Modal opened, starting timer...')
  }

  // Mark when first image is displayed in modal
  const markFirstImageDisplay = () => {
    if (startTimeRef.current) {
      const displayTime = performance.now() - startTimeRef.current
      console.log(`📸 First Image Display Time: ${displayTime.toFixed(2)}ms`)
      performanceData.set('firstImageDisplayTime', displayTime)
      updateMetrics()
    }
  }

  // Update metrics state
  const updateMetrics = () => {
    const hitRate = preloadTracking.requested.size > 0 
      ? (preloadTracking.hits / preloadTracking.requested.size) * 100 
      : 0

    setMetrics({
      embedScriptLoadTime: performanceData.get('embedScriptLoadTime'),
      firstImageLoadTime: performanceData.get('firstImageDisplayTime'),
      modalOpenToDisplayTime: performanceData.get('firstImageDisplayTime'),
      preloadHitRate: hitRate,
      totalPreloaded: preloadTracking.preloaded.size,
      totalRequested: preloadTracking.requested.size
    })
  }

  // Log performance summary
  const logPerformanceSummary = () => {
    console.group('📊 Instagram Performance Summary')
    console.log(`Embed Script Load: ${performanceData.get('embedScriptLoadTime')?.toFixed(2) || 'N/A'}ms`)
    console.log(`First Image Display: ${performanceData.get('firstImageDisplayTime')?.toFixed(2) || 'N/A'}ms`)
    console.log(`Preload Hit Rate: ${((preloadTracking.hits / Math.max(preloadTracking.requested.size, 1)) * 100).toFixed(1)}%`)
    console.log(`Total Preloaded: ${preloadTracking.preloaded.size}`)
    console.log(`Total Requested: ${preloadTracking.requested.size}`)
    console.log(`Cache Hits: ${preloadTracking.hits}`)
    console.log(`Cache Misses: ${preloadTracking.misses}`)
    console.groupEnd()
  }

  // Add performance observer for Instagram embeds
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('instagram.com')) {
          console.log(`⏱️ Instagram Resource: ${entry.name.substring(0, 50)}... - ${entry.duration.toFixed(2)}ms`)
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['resource', 'navigation', 'measure'] })
    } catch (e) {
      // Some browsers don't support all entry types
    }

    return () => observer.disconnect()
  }, [])

  return {
    metrics,
    markEmbedScriptStart,
    markEmbedScriptLoaded,
    markImagePreloaded,
    markImageRequested,
    markModalOpen,
    markFirstImageDisplay,
    logPerformanceSummary
  }
}

// Export global tracking functions for use in components
export const performanceTracking = {
  markImagePreloaded: (url: string) => {
    preloadTracking.preloaded.add(url)
  },
  markImageRequested: (url: string) => {
    preloadTracking.requested.add(url)
    if (preloadTracking.preloaded.has(url)) {
      preloadTracking.hits++
    } else {
      preloadTracking.misses++
    }
  },
  getMetrics: () => ({
    preloadHitRate: preloadTracking.requested.size > 0 
      ? (preloadTracking.hits / preloadTracking.requested.size) * 100 
      : 0,
    totalPreloaded: preloadTracking.preloaded.size,
    totalRequested: preloadTracking.requested.size,
    hits: preloadTracking.hits,
    misses: preloadTracking.misses
  })
}