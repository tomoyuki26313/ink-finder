'use client'

import { useEffect, useRef, useCallback } from 'react'

interface InstagramPreloaderProps {
  instagramUrls: string[]
  aggressive?: boolean
}

// Cache for preloaded content
const preloadCache = new Map<string, Promise<any>>()
const imageCache = new Map<string, HTMLImageElement>()

export default function InstagramPreloader({ instagramUrls, aggressive = true }: InstagramPreloaderProps) {
  const preloadedScripts = useRef(new Set<string>())
  const preloadQueue = useRef<string[]>([])

  // Extract Instagram post IDs from URLs
  const extractInstagramId = useCallback((url: string): string | null => {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }, [])

  // Aggressive image prefetching
  const prefetchInstagramImages = useCallback(async (urls: string[]) => {
    if (!aggressive) return

    const prefetchPromises = urls.map(async (url) => {
      const postId = extractInstagramId(url)
      if (!postId || imageCache.has(postId)) return

      try {
        // Try to fetch potential Instagram image URLs
        const potentialImageUrls = [
          `https://scontent.cdninstagram.com/v/t51.2885-15/${postId}_n.jpg`,
          `https://scontent.xx.fbcdn.net/v/t51.2885-15/${postId}_n.jpg`,
        ]

        for (const imgUrl of potentialImageUrls) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = imgUrl
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              imageCache.set(postId, img)
              resolve(img)
            }
            img.onerror = () => reject()
            
            // Timeout after 2 seconds
            setTimeout(reject, 2000)
          }).catch(() => {}) // Ignore errors for aggressive mode
        }
      } catch (error) {
        // Ignore errors in aggressive mode
      }
    })

    await Promise.allSettled(prefetchPromises)
  }, [aggressive, extractInstagramId])

  // Preload Instagram embed script aggressively
  const preloadEmbedScript = useCallback(() => {
    if (typeof window === 'undefined') return Promise.resolve()

    const scriptUrl = 'https://www.instagram.com/embed.js'
    
    if (preloadCache.has(scriptUrl)) {
      return preloadCache.get(scriptUrl)!
    }

    const promise = new Promise<void>((resolve, reject) => {
      // Check if script is already loaded
      if (window.instgrm) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = scriptUrl
      script.async = true
      script.crossOrigin = 'anonymous'
      
      script.onload = () => {
        resolve()
      }
      script.onerror = () => {
        preloadCache.delete(scriptUrl)
        reject(new Error('Failed to load Instagram script'))
      }

      // Aggressive: No timeout, keep trying
      document.head.appendChild(script)
    })

    preloadCache.set(scriptUrl, promise)
    return promise
  }, [])

  // Aggressive oembed data prefetching
  const prefetchOembedData = useCallback(async (urls: string[]) => {
    if (!aggressive) return

    const oembedPromises = urls.slice(0, 10).map(async (url) => { // Limit to first 10 for performance
      try {
        const oembedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN || ''}`
        
        if (!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN) {
          // Fallback to public oembed (may not work due to CORS)
          const publicOembedUrl = `https://www.instagram.com/p/oembed/?url=${encodeURIComponent(url)}`
          
          const response = await fetch(publicOembedUrl, {
            mode: 'no-cors', // Aggressive: try anyway
            cache: 'force-cache'
          })
          
          return response
        }

        const response = await fetch(oembedUrl, {
          cache: 'force-cache'
        })
        
        if (response.ok) {
          const data = await response.json()
          // Cache the oembed data
          preloadCache.set(`oembed-${url}`, Promise.resolve(data))
          return data
        }
      } catch (error) {
        // Ignore errors in aggressive mode
      }
    })

    await Promise.allSettled(oembedPromises)
  }, [aggressive])

  // Early Instagram embed processing
  const triggerEarlyEmbedProcessing = useCallback(() => {
    if (typeof window === 'undefined') return

    // Process multiple times for reliability
    const processIntervals = [100, 300, 500, 1000, 2000, 5000]
    
    processIntervals.forEach(interval => {
      setTimeout(() => {
        if (window.instgrm && window.instgrm.Embeds) {
          try {
            window.instgrm.Embeds.process()
          } catch (error) {
            // Ignore errors
          }
        }
      }, interval)
    })
  }, [])

  // Main aggressive preloading effect
  useEffect(() => {
    if (!aggressive || instagramUrls.length === 0) return

    const runAggressivePreloading = async () => {
      try {
        // 1. Preload embed script immediately
        preloadEmbedScript()

        // 2. Start aggressive image prefetching
        prefetchInstagramImages(instagramUrls)

        // 3. Prefetch oembed data
        prefetchOembedData(instagramUrls)

        // 4. Trigger early embed processing
        setTimeout(() => {
          triggerEarlyEmbedProcessing()
        }, 500)

        // 5. Warmup additional Instagram resources
        const additionalResources = [
          'https://www.instagram.com/static/bundles/metro/ConsumerLibCommons.js',
          'https://www.instagram.com/static/bundles/metro/ConsumerAsyncCommons.js'
        ]

        additionalResources.forEach(url => {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.href = url
          link.crossOrigin = 'anonymous'
          document.head.appendChild(link)
        })

      } catch (error) {
        console.warn('Aggressive Instagram preloading failed:', error)
      }
    }

    // Start immediately and also on user interaction
    runAggressivePreloading()

    // Additional preloading on first user interaction
    const handleFirstInteraction = () => {
      runAggressivePreloading()
      
      // Remove listeners after first use
      window.removeEventListener('scroll', handleFirstInteraction)
      window.removeEventListener('mouseenter', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }

    window.addEventListener('scroll', handleFirstInteraction, { passive: true, once: true })
    window.addEventListener('mouseenter', handleFirstInteraction, { passive: true, once: true })
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true, once: true })

    return () => {
      window.removeEventListener('scroll', handleFirstInteraction)
      window.removeEventListener('mouseenter', handleFirstInteraction) 
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [instagramUrls, aggressive, preloadEmbedScript, prefetchInstagramImages, prefetchOembedData, triggerEarlyEmbedProcessing])

  return null // This component doesn't render anything
}

// Hook for aggressive Instagram preloading
export function useAggressiveInstagramPreload(instagramUrls: string[]) {
  useEffect(() => {
    // Preload on component mount
    if (instagramUrls.length > 0) {
      // Start background preloading immediately
      const preloader = document.createElement('div')
      preloader.style.display = 'none'
      document.body.appendChild(preloader)
      
      // Cleanup
      return () => {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader)
        }
      }
    }
  }, [instagramUrls])
}