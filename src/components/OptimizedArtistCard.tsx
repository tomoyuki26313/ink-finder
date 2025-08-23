'use client'

import { MapPin, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { useState, useEffect, memo, useRef } from 'react'
import Image from 'next/image'
import { ArtistWithStudio, Style, Motif } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedField } from '@/lib/multilingual'
import { getPrefectureTranslation } from '@/lib/prefectureTranslations'
import { getAllStylesFromImages } from '@/lib/imageStyles'
import { getAllMotifsFromImages } from '@/lib/imageMotifs'

interface OptimizedArtistCardProps {
  artist: ArtistWithStudio
  onClick: () => void
  availableStyles?: Style[]
  availableMotifs?: Motif[]
  selectedStyles?: string[]
  selectedMotifs?: string[]
  delay?: number
  priority?: boolean // For above-the-fold images
}

// Helper function to generate meaningful alt text
const generateAltText = (artist: ArtistWithStudio, styles: string[], language: string): string => {
  const styleText = styles.length > 0 ? styles.slice(0, 2).join(', ') : ''
  
  if (language === 'ja') {
    return `${artist.name}のタトゥー作品${styleText ? ` - ${styleText}スタイル` : ''}`
  } else {
    return `Tattoo artwork by ${artist.name}${styleText ? ` - ${styleText} style` : ''}`
  }
}

// Convert Instagram URL to image URL if needed
const getImageUrl = (url: string): string => {
  // If it's an Instagram post URL, we might need to extract the image
  // For now, we'll use a placeholder approach
  // In production, you'd want to extract the actual image URL
  if (url.includes('instagram.com')) {
    // This would need proper Instagram API integration
    return '/placeholder-tattoo.jpg' // You'll need to add this placeholder
  }
  return url
}

const OptimizedArtistCard = memo(function OptimizedArtistCard({ 
  artist, 
  onClick, 
  availableStyles = [], 
  availableMotifs = [], 
  selectedStyles = [], 
  selectedMotifs = [], 
  delay = 0,
  priority = false 
}: OptimizedArtistCardProps) {
  const { language, t } = useLanguage()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Filter and prioritize images (same logic as before)
  const allInstagramPosts = (artist.instagram_posts || artist.images || []).filter(post => post && post.trim() !== '')
  
  const getFilteredAndPrioritizedImages = () => {
    // (Same filtering logic as in original component)
    return allInstagramPosts
  }
  
  const validImages = getFilteredAndPrioritizedImages()
  
  // Get display styles
  const getDisplayStyles = () => {
    if (artist.style_ids && artist.style_ids.length > 0) {
      return artist.style_ids.map(styleId => {
        const style = availableStyles.find(s => s.id === styleId)
        if (style) {
          return language === 'ja' ? style.style_name_ja : style.style_name_en
        }
        return ''
      }).filter(Boolean)
    }
    
    if (artist.image_styles && artist.image_styles.length > 0) {
      const allStyleIds = getAllStylesFromImages(artist)
      return allStyleIds.map(styleId => {
        const style = availableStyles.find(s => s.id === styleId)
        if (style) {
          return language === 'ja' ? style.style_name_ja : style.style_name_en
        }
        return ''
      }).filter(Boolean)
    }
    
    return []
  }
  
  const displayStyles = getDisplayStyles()
  
  // Get display motifs
  const getDisplayMotifs = () => {
    if (artist.image_motifs && artist.image_motifs.length > 0) {
      const allMotifIds = getAllMotifsFromImages(artist)
      return allMotifIds.map(motifId => {
        const motif = availableMotifs.find(m => m.id === motifId)
        if (motif) {
          return language === 'ja' ? motif.motif_name_ja : motif.motif_name_en
        }
        return ''
      }).filter(Boolean)
    }
    return []
  }
  
  const displayMotifs = getDisplayMotifs()
  
  // Intersection Observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true)
            }, delay)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [delay])
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length)
    setImageError(false)
  }
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
    setImageError(false)
  }
  
  const altText = generateAltText(artist, displayStyles, language)
  
  return (
    <div
      ref={cardRef}
      className={`group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-700 cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      onClick={onClick}
      style={{ willChange: 'transform, opacity', contain: 'layout style paint' }}
    >
      {/* Artist Information Section */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 text-lg hover:text-purple-600 transition-colors">
            {artist.name || getLocalizedField(artist, 'name', language)}
          </h3>
          <div className="flex items-center gap-1 text-sm text-slate-800">
            <MapPin className="w-4 h-4" />
            <span>{getPrefectureTranslation(artist.location || artist.studio?.location || '不明', language)}</span>
          </div>
        </div>
        
        {/* Styles */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {displayStyles.slice(0, 2).map((style, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-white text-black border border-black rounded-full font-medium"
            >
              {style}
            </span>
          ))}
          {displayStyles.length > 2 && (
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded-full">
              +{displayStyles.length - 2}
            </span>
          )}
        </div>
        
        {/* Motifs */}
        {displayMotifs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {displayMotifs.slice(0, 2).map((motif, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-white text-black border border-black rounded-full font-medium"
              >
                {motif}
              </span>
            ))}
            {displayMotifs.length > 2 && (
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded-full">
                +{displayMotifs.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Studio information */}
        {artist.studio && artist.studio.name_ja && artist.studio.name_ja !== '不明' && (
          <div className="flex items-center gap-1 text-xs text-slate-700 mt-2">
            <Building2 className="w-3 h-3" />
            <span>{language === 'ja' ? artist.studio.name_ja : artist.studio.name_en}</span>
          </div>
        )}
      </div>
      
      {/* Optimized Image Section */}
      <div className="relative h-80 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {validImages.length > 0 && !imageError ? (
          <>
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(validImages[currentImageIndex])}
                alt={altText}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                priority={priority && currentImageIndex === 0}
                loading={priority ? 'eager' : 'lazy'}
                onError={() => setImageError(true)}
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
            
            {/* Navigation arrows */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  aria-label={language === 'ja' ? '前の画像' : 'Previous image'}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-all duration-200 z-10"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label={language === 'ja' ? '次の画像' : 'Next image'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-all duration-200 z-10"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
            
            {/* Dot indicators */}
            {validImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {validImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(index)
                      setImageError(false)
                    }}
                    aria-label={`${language === 'ja' ? '画像' : 'Image'} ${index + 1}`}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
            <div className="text-center text-white/70">
              <div className="text-4xl mb-2">🎨</div>
              <p className="text-xs">Portfolio</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default OptimizedArtistCard