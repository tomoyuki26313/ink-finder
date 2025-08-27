'use client'

import { useEffect, useRef, useState } from 'react'
import { Instagram } from 'lucide-react'

interface InstagramEmbedProps {
  postUrl: string
  className?: string
  compact?: boolean
  priority?: boolean
  fullHeight?: boolean // Add option to show full height
  style?: React.CSSProperties
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

// Remove iframe URL generation as Instagram blocks iframe embedding

export default function InstagramEmbed({ 
  postUrl, 
  className = '', 
  compact = false, 
  priority = false,
  fullHeight = false,
  style = {}
}: InstagramEmbedProps) {
  const embedRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  const embedId = getEmbedIdFromUrl(postUrl)

  useEffect(() => {
    let isComponentMounted = true

    const processEmbed = () => {
      if (!isComponentMounted || !embedRef.current) return

      // Check if Instagram embed script is available
      if (typeof window !== 'undefined' && window.instgrm) {
        try {
          window.instgrm.Embeds.process()
          if (isComponentMounted) {
            setLoaded(true)
          }
        } catch (error) {
          console.warn('Instagram embed processing failed:', error)
        }
      }
    }

    // Load Instagram embed script if not already loaded
    if (typeof window !== 'undefined' && !window.instgrm) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://www.instagram.com/embed.js'
      script.onload = () => {
        // Process embeds multiple times to ensure proper rendering
        setTimeout(processEmbed, 100)
        setTimeout(processEmbed, 500)
        setTimeout(processEmbed, 1000)
      }
      document.body.appendChild(script)
    } else {
      // Script already loaded, process multiple times for reliability
      setTimeout(processEmbed, 100)
      setTimeout(processEmbed, 500)
      setTimeout(processEmbed, 1000)
    }

    return () => {
      isComponentMounted = false
    }
  }, [postUrl])

  if (!embedId) {
    return (
      <div className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Instagram className="w-8 h-8 mx-auto mb-2 text-pink-600" />
          <p className="text-xs text-gray-800">Instagram Post</p>
        </div>
      </div>
    )
  }

  // All views now use Instagram's official blockquote format
  return (
    <div className={`relative instagram-embed-container ${className}`} ref={embedRef} style={style}>
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={postUrl.endsWith('/') ? postUrl : postUrl + '/'}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: '0',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          margin: '0',
          padding: '0',
          width: '100%',
          height: fullHeight ? 'auto' : (compact ? '500px' : '500px'),
          maxHeight: fullHeight ? 'none' : (compact ? '500px' : '500px'),
          minHeight: fullHeight ? '600px' : (compact ? '500px' : '500px'),
          overflow: fullHeight ? 'visible' : 'hidden',
          overflowX: fullHeight ? 'visible' : 'hidden',
          overflowY: fullHeight ? 'visible' : 'hidden',
          zIndex: 1,
          position: 'relative'
        }}
      >
        {/* Fallback content */}
        <div className="p-4 text-center">
          <Instagram className="w-8 h-8 mx-auto mb-2 text-pink-600" />
          <p className="text-sm text-gray-800">Loading Instagram post...</p>
        </div>
      </blockquote>
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