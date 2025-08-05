'use client'

import { useEffect, useRef, useState } from 'react'
import { Instagram } from 'lucide-react'

interface InstagramEmbedProps {
  postUrl: string
  className?: string
  compact?: boolean
  priority?: boolean
  lazy?: boolean
}

// Get Instagram post ID for iframe embed (faster than full widget)
const getInstagramIframeUrl = (url: string): string => {
  const embedId = getEmbedIdFromUrl(url)
  if (!embedId) return ''
  
  // Use Instagram's embed iframe (much faster than full widget)
  return `https://www.instagram.com/p/${embedId}/embed/captioned/`
}

const getEmbedIdFromUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null
  
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /\/p\/([A-Za-z0-9_-]+)/,
    /\/reel\/([A-Za-z0-9_-]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

export default function InstagramEmbed({ 
  postUrl, 
  className = '', 
  compact = false, 
  priority = false,
  lazy = false 
}: InstagramEmbedProps) {
  const embedRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [embedLoaded, setEmbedLoaded] = useState(false)

  const embedId = getEmbedIdFromUrl(postUrl)
  const iframeUrl = getInstagramIframeUrl(postUrl)
  
  // Clean URL for Instagram embed (remove query parameters)
  const getCleanInstagramUrl = (url: string) => {
    if (!url) return url
    const cleanUrl = url.split('?')[0]
    if (cleanUrl.includes('/p/') && !cleanUrl.endsWith('/')) {
      return cleanUrl + '/'
    }
    return cleanUrl
  }

  const cleanUrl = getCleanInstagramUrl(postUrl)

  // Load full embed for modal view
  useEffect(() => {
    if (compact || !embedId || !embedRef.current) return

    const loadInstagramEmbed = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
        setTimeout(() => setEmbedLoaded(true), 500)
      } else {
        const script = document.createElement('script')
        script.src = 'https://www.instagram.com/embed.js'
        script.async = true
        script.onload = () => {
          if (window.instgrm) {
            window.instgrm.Embeds.process()
            setTimeout(() => setEmbedLoaded(true), 500)
          }
        }
        document.body.appendChild(script)
      }
    }

    const timer = setTimeout(loadInstagramEmbed, 100)
    return () => clearTimeout(timer)
  }, [compact, embedId])

  if (!embedId) {
    return (
      <div className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Instagram className="w-8 h-8 mx-auto mb-2 text-pink-600" />
          <p className="text-xs text-gray-600">Instagram Post</p>
        </div>
      </div>
    )
  }

  // For compact view (search results), use lightweight iframe
  if (compact) {
    return (
      <div className={`relative overflow-hidden bg-black rounded-lg ${className}`} ref={embedRef}>
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            loading={priority ? 'eager' : 'lazy'}
            style={{
              minHeight: '300px',
              background: '#f8f9fa'
            }}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <div className="text-center">
              <Instagram className="w-8 h-8 mx-auto mb-2 text-pink-600" />
              <p className="text-xs text-gray-600">Instagram</p>
            </div>
          </div>
        )}
        
        {/* Simple loading indicator */}
        {!imageLoaded && iframeUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }

  // For modal view, show full embed with loading state
  return (
    <div className={`relative instagram-embed-container ${className}`} ref={embedRef}>
      {!embedLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading</p>
          </div>
        </div>
      )}
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={cleanUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: '0',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          margin: '0',
          padding: '0',
          width: '100%',
          minHeight: '400px'
        }}
      />
    </div>
  )
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void
      }
    }
  }
}