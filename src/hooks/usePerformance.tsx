'use client'

import { useEffect, useCallback, useRef } from 'react'

// Web Vitals tracking
export function useWebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(console.log)
        onFID(console.log)
        onFCP(console.log)
        onLCP(console.log)
        onTTFB(console.log)
      })
    }
  }, [])
}

// Debounced function hook
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedFunc = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        func(...args)
      }, delay)
    },
    [func, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedFunc as T
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const scrollTop = useRef(0)
  
  const startIndex = Math.floor(scrollTop.current / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length - 1
  )
  
  const visibleItems = items.slice(
    Math.max(0, startIndex - overscan),
    endIndex + 1
  )
  
  const offsetY = Math.max(0, startIndex - overscan) * itemHeight
  const totalHeight = items.length * itemHeight
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollTop.current = e.currentTarget.scrollTop
  }, [])
  
  return {
    scrollElementRef,
    visibleItems,
    offsetY,
    totalHeight,
    handleScroll,
    startIndex: Math.max(0, startIndex - overscan),
    endIndex
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  }
  
  const observerRef = useRef<IntersectionObserver>()
  
  useEffect(() => {
    if (!elementRef.current) return
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Element is in view
          elementRef.current?.dispatchEvent(
            new CustomEvent('intersect', { detail: entry })
          )
        }
      })
    }, defaultOptions)
    
    observerRef.current.observe(elementRef.current)
    
    return () => {
      observerRef.current?.disconnect()
    }
  }, [elementRef, defaultOptions])
  
  return observerRef
}

// Resource prefetching
export function usePrefetch() {
  const prefetchLink = useCallback((href: string, type: 'dns-prefetch' | 'prefetch' | 'preload' = 'prefetch') => {
    if (typeof window === 'undefined') return
    
    const existing = document.querySelector(`link[href="${href}"]`)
    if (existing) return
    
    const link = document.createElement('link')
    link.rel = type
    link.href = href
    
    if (type === 'dns-prefetch') {
      link.href = new URL(href).origin
    }
    
    document.head.appendChild(link)
  }, [])
  
  const prefetchImage = useCallback((src: string) => {
    if (typeof window === 'undefined') return
    
    const img = new window.Image()
    img.src = src
  }, [])
  
  return { prefetchLink, prefetchImage }
}

// Performance monitoring
export function usePerformanceMonitor() {
  const markStart = useCallback((name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`)
    }
  }, [])
  
  const markEnd = useCallback((name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
  }, [])
  
  const measureDuration = useCallback((name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const entries = performance.getEntriesByName(name, 'measure')
      return entries[entries.length - 1]?.duration || 0
    }
    return 0
  }, [])
  
  return { markStart, markEnd, measureDuration }
}