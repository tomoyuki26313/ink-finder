'use client'

import { MapPin, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { useState, useEffect, memo, useRef } from 'react'
import { ArtistWithStudio, Style, Motif } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedField } from '@/lib/multilingual'
import { getStyleTranslation } from '@/lib/styleTranslations'
import { getPrefectureTranslation } from '@/lib/prefectureTranslations'
import { getAllStylesFromImages } from '@/lib/imageStyles'
import { getAllMotifsFromImages } from '@/lib/imageMotifs'
import InstagramEmbed from './InstagramEmbed'
import InstagramPreloader from './InstagramPreloader'

interface ArtistCardProps {
  artist: ArtistWithStudio
  onClick: () => void
  availableStyles?: Style[]
  availableMotifs?: Motif[]
  selectedStyles?: string[] // 選択されたスタイル名の配列
  selectedMotifs?: string[] // 選択されたモチーフ名の配列
  delay?: number // アニメーション遅延（ミリ秒）
}

// Format follower count (e.g., 1200 -> 1.2K, 1500000 -> 1.5M)
// For Japanese: use 万 (10,000) unit
const formatFollowerCount = (count: number, language: string): string => {
  if (language === 'ja') {
    if (count >= 10000) {
      return (count / 10000).toFixed(1).replace('.0', '') + '万'
    }
    return count.toString()
  } else {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace('.0', '') + 'M'
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'K'
    }
    return count.toString()
  }
}

const ArtistCard = memo(function ArtistCard({ artist, onClick, availableStyles = [], availableMotifs = [], selectedStyles = [], selectedMotifs = [], delay = 0 }: ArtistCardProps) {
  const { language, t } = useLanguage()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [shouldPreload, setShouldPreload] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Filter out empty Instagram posts - handle both old and new structure
  const allInstagramPosts = (artist.instagram_posts || artist.images || []).filter(post => post && post.trim() !== '')
  
  // Style and Motif-based image filtering and prioritization
  const getFilteredAndPrioritizedImages = () => {
    const hasStyleFilters = selectedStyles.length > 0 && artist.image_styles
    const hasMotifFilters = selectedMotifs.length > 0 && artist.image_motifs
    
    if (!hasStyleFilters && !hasMotifFilters) {
      return allInstagramPosts
    }

    // Convert selected style names to IDs (with character normalization)
    const normalizeStyleName = (name: string) => {
      return name.replace(/[＆]/g, '&') // Convert full-width ampersand to regular
    }
    
    const selectedStyleIds = hasStyleFilters ? selectedStyles.map(styleName => {
      const normalizedSelected = normalizeStyleName(styleName)
      const style = availableStyles.find(s => {
        const dbStyleName = language === 'ja' ? s.style_name_ja : s.style_name_en
        const normalizedDbStyle = normalizeStyleName(dbStyleName)
        return normalizedDbStyle === normalizedSelected
      })
      return style?.id
    }).filter(Boolean) as number[] : []

    // Convert selected motif names to IDs
    const selectedMotifIds = hasMotifFilters ? selectedMotifs.map(motifName => {
      const motif = availableMotifs.find(m => {
        const dbMotifName = language === 'ja' ? m.motif_name_ja : m.motif_name_en
        return dbMotifName === motifName
      })
      return motif?.id
    }).filter(Boolean) as number[] : []

    if (!selectedStyleIds.length && !selectedMotifIds.length) {
      return allInstagramPosts
    }

    // Find images that contain the selected styles or motifs
    const prioritizedImages: { url: string; priority: number; matchCount: number; styleMatches: number; motifMatches: number }[] = []
    const nonMatchingImages: string[] = []

    allInstagramPosts.forEach((imageUrl, originalIndex) => {
      const imageStyle = artist.image_styles?.find(style => style.image_url === imageUrl)
      const imageMotif = artist.image_motifs?.find(motif => motif.image_url === imageUrl)
      
      // Count style matches
      const matchingStyles = imageStyle?.style_ids?.filter(id => selectedStyleIds.includes(id)) || []
      const styleMatchCount = matchingStyles.length
      
      // Count motif matches
      const matchingMotifs = imageMotif?.motif_ids?.filter(id => selectedMotifIds.includes(id)) || []
      const motifMatchCount = matchingMotifs.length
      
      // Total match count (styles + motifs)
      const totalMatchCount = styleMatchCount + motifMatchCount
      
      // Check if image matches any filter criteria
      const hasStyleMatch = !hasStyleFilters || styleMatchCount > 0
      const hasMotifMatch = !hasMotifFilters || motifMatchCount > 0
      
      if (hasStyleMatch && hasMotifMatch && totalMatchCount > 0) {
        const imageData = {
          url: imageUrl,
          priority: originalIndex, // Lower index = higher priority (Image 1, Image 2, Image 3...)
          matchCount: totalMatchCount,
          styleMatches: styleMatchCount,
          motifMatches: motifMatchCount
        }
        prioritizedImages.push(imageData)
      } else {
        nonMatchingImages.push(imageUrl)
      }
    })

    // Sort by total match count (more matches first), then by original order (priority)
    prioritizedImages.sort((a, b) => {
      if (a.matchCount !== b.matchCount) {
        return b.matchCount - a.matchCount // More matches first
      }
      return a.priority - b.priority // Original order for same match count
    })

    const finalOrder = [...prioritizedImages.map(img => img.url), ...nonMatchingImages]

    // Return prioritized images first, then non-matching images
    return finalOrder
  }

  const validInstagramPosts = getFilteredAndPrioritizedImages()
  const firstImageUrl = validInstagramPosts[0]
  
  // Force reset to first image whenever filtered posts change
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [firstImageUrl, validInstagramPosts.length])
  
  // Also reset when selected styles or motifs change (for immediate feedback)  
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedStyles])
  
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedMotifs])
  
  // Force reset on component mount and when validInstagramPosts changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [JSON.stringify(validInstagramPosts)])
  
  // Get display styles with proper priority: style_ids > image_styles > legacy styles
  const getDisplayStyles = () => {
    // Priority 1: Use style_ids if available
    if (artist.style_ids && artist.style_ids.length > 0) {
      return artist.style_ids.map(styleId => {
        const style = availableStyles.find(s => s.id === styleId)
        if (style) {
          return language === 'ja' ? style.style_name_ja : style.style_name_en
        }
        return `Style ${styleId}` // Fallback if style not found
      }).filter(Boolean)
    }
    
    // Priority 2: Use image_styles if available
    if (artist.image_styles && artist.image_styles.length > 0) {
      const allStyleIds = getAllStylesFromImages(artist)
      return allStyleIds.map(styleId => {
        const style = availableStyles.find(s => s.id === styleId)
        if (style) {
          return language === 'ja' ? style.style_name_ja : style.style_name_en
        }
        return `Style ${styleId}` // Fallback if style not found
      }).filter(Boolean)
    }
    
    // No styles found
    return []
  }
  
  const displayStyles = getDisplayStyles()
  
  // Get display motifs with proper priority: image_motifs
  const getDisplayMotifs = () => {
    if (artist.image_motifs && artist.image_motifs.length > 0) {
      const allMotifIds = getAllMotifsFromImages(artist)
      return allMotifIds.map(motifId => {
        const motif = availableMotifs.find(m => m.id === motifId)
        if (motif) {
          return language === 'ja' ? motif.motif_name_ja : motif.motif_name_en
        }
        return `Motif ${motifId}` // Fallback if motif not found
      }).filter(Boolean)
    }
    return []
  }
  
  const displayMotifs = getDisplayMotifs()

  // Note: Instagram preloading removed due to X-Frame-Options restrictions

  // Aggressive Intersection Observer for preloading and animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Immediately start preloading (aggressive)
            setShouldPreload(true)
            
            // Apply delay before showing the card
            setTimeout(() => {
              setIsVisible(true)
            }, delay)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.05, // More aggressive threshold
        rootMargin: '200px' // Much larger margin for early preloading
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

  // Aggressive hover preloading
  const handleMouseEnter = () => {
    setIsHovered(true)
    setShouldPreload(true)
    
    // Pre-process Instagram embeds on hover
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.instgrm) {
        window.instgrm.Embeds.process()
      }
    }, 50)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % validInstagramPosts.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + validInstagramPosts.length) % validInstagramPosts.length)
  }

  return (
    <>
      {/* Aggressive Instagram Preloader */}
      {shouldPreload && (
        <InstagramPreloader 
          instagramUrls={validInstagramPosts} 
          aggressive={true} 
        />
      )}
      
      <div
        ref={cardRef}
        className={`group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ willChange: 'transform, opacity', contain: 'layout style paint' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      {/* Artist Information Section - Moved to Top */}
      <div className="p-5">
        {/* Name and Location on same line */}
        <div className="flex items-center justify-between mb-2">
          <h3 
            className="font-semibold text-slate-900 text-lg cursor-pointer hover:text-purple-600 transition-colors"
            onClick={onClick}
          >
            {artist.name || getLocalizedField(artist, 'name', language)}
          </h3>
          <div className="flex items-center gap-1 text-sm text-slate-800">
            <MapPin className="w-4 h-4" />
            <span>{getPrefectureTranslation(artist.location || artist.studio?.location || '不明', language)}</span>
          </div>
        </div>
        
        {/* Styles below the name */}
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
        
        {/* Motifs below styles */}
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
        
        {/* Studio information if available */}
        {(() => {
          if (!artist.studio) return null
          const studioName = language === 'ja' ? artist.studio.name_ja : artist.studio.name_en
          if (!studioName) return null
          if (studioName === '不明' || studioName === 'Unknown') return null
          if (studioName === '1' || studioName === 'Studio 1') return null
          if (studioName.toLowerCase() === 'studio' || studioName.toLowerCase() === 'no studio') return null
          
          return (
            <div className="flex items-center gap-1 text-xs text-slate-700 mt-2">
              <Building2 className="w-3 h-3" />
              <span>{studioName}</span>
            </div>
          )
        })()}
      </div>

      {/* Instagram Image Section - Moved to Bottom */}
      <div className="relative h-96 md:h-80 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {validInstagramPosts.length > 0 ? (
          <div className="w-full h-full relative overflow-hidden">
            <div className="absolute inset-0" style={{ transform: 'scale(1.3) translateY(-10%)' }}>
              <InstagramEmbed 
                key={validInstagramPosts[currentImageIndex]}
                postUrl={validInstagramPosts[currentImageIndex]} 
                className="w-full h-full"
                compact={true}
                priority={currentImageIndex === 0}
              />
            </div>
            {/* Transparent overlay to intercept clicks and open modal instead of Instagram */}
            <div 
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={onClick}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-20" />
            
            {/* Navigation arrows - only show if multiple posts */}
            {validInstagramPosts.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-all duration-200 z-30"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-all duration-200 z-30"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
            
            {/* Dot indicators - only show if multiple posts */}
            {validInstagramPosts.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                {validInstagramPosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(index)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
            
          </div>
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
    </>
  )
})

export default ArtistCard