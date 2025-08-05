'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface InstagramImageProps {
  postUrl: string
  className?: string
  alt?: string
}

export default function InstagramImage({ postUrl, className = '', alt = 'Instagram post' }: InstagramImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Extract post ID from URL
  const getPostId = (url: string) => {
    const match = url.match(/\/p\/([^\/]+)/)
    return match ? match[1] : null
  }

  const postId = getPostId(postUrl)

  useEffect(() => {
    if (!postId) {
      setError(true)
      setLoading(false)
      return
    }

    const fetchInstagramImage = async () => {
      try {
        // Try to use Instagram's oEmbed API
        const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(postUrl)}`
        
        const response = await fetch(oembedUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.thumbnail_url) {
            setImageUrl(data.thumbnail_url)
            setLoading(false)
            return
          }
        }
        
        // Fallback: Try to construct image URL (this may not always work)
        // Instagram sometimes allows direct access to media
        const possibleImageUrl = `https://www.instagram.com/p/${postId}/media/?size=m`
        
        // Test if the URL is accessible
        const img = new Image()
        img.onload = () => {
          setImageUrl(possibleImageUrl)
          setLoading(false)
        }
        img.onerror = () => {
          // Final fallback to a themed placeholder
          setImageUrl(`https://via.placeholder.com/400x400/6366f1/ffffff?text=Instagram+Post`)
          setLoading(false)
        }
        img.src = possibleImageUrl
        
      } catch (err) {
        console.error('Error fetching Instagram image:', err)
        // Use a themed placeholder on error
        setImageUrl(`https://via.placeholder.com/400x400/6366f1/ffffff?text=Instagram+Post`)
        setLoading(false)
      }
    }

    fetchInstagramImage()
  }, [postId, postUrl])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <div className="animate-pulse text-gray-700">Loading...</div>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 ${className}`}>
        <div className="text-4xl mb-2">📸</div>
        <p className="text-xs text-gray-600 text-center px-2">
          Instagram Post
        </p>
        <a 
          href={postUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-1 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
          View
        </a>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
      
      {/* Instagram indicator */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-pink-600"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
          <path d="m7 13 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      
      {/* Click overlay for external link */}
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all duration-200 opacity-0 hover:opacity-100"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
          <ExternalLink className="w-4 h-4 text-gray-700" />
        </div>
      </a>
    </div>
  )
}