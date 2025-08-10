'use client'

import { X, MapPin, Instagram, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ArtistWithStudio, Style } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedField } from '@/lib/multilingual'
import { getStyleTranslation } from '@/lib/styleTranslations'
import { getPrefectureTranslation } from '@/lib/prefectureTranslations'
import { getAllStylesFromImages } from '@/lib/imageStyles'
import InstagramEmbed from './InstagramEmbed'

interface ArtistModalProps {
  artist: ArtistWithStudio
  onClose: () => void
  availableStyles?: Style[]
}

export default function ArtistModal({ artist, onClose, availableStyles = [] }: ArtistModalProps) {
  const { t, language } = useLanguage()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [styles, setStyles] = useState<Style[]>(availableStyles)

  // Load styles if not provided
  useEffect(() => {
    if (availableStyles.length === 0) {
      const loadStyles = async () => {
        try {
          const { fetchStyles } = await import('@/lib/api/styles')
          const fetchedStyles = await fetchStyles()
          setStyles(fetchedStyles)
        } catch (error) {
          console.error('Error loading styles:', error)
        }
      }
      loadStyles()
    }
  }, [availableStyles])

  // Handle both instagram_posts and images arrays, with fallback to empty array
  const postImages = artist.instagram_posts || artist.images || []
  
  // Get display styles with proper priority: style_ids > image_styles > legacy styles
  const getDisplayStyles = () => {
    // Priority 1: Use style_ids if available
    if (artist.style_ids && artist.style_ids.length > 0) {
      return artist.style_ids.map(styleId => {
        const style = styles.find(s => s.id === styleId)
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
        const style = styles.find(s => s.id === styleId)
        if (style) {
          return language === 'ja' ? style.style_name_ja : style.style_name_en
        }
        return `Style ${styleId}` // Fallback if style not found
      }).filter(Boolean)
    }
    
    // Priority 3: Legacy styles field
    return artist.styles || []
  }
  
  const displayStyles = getDisplayStyles()
  
  // Filter for valid Instagram URLs only
  const isValidInstagramUrl = (url: string) => {
    if (!url || !url.trim()) return false
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /\/p\/([A-Za-z0-9_-]+)/,
      /\/reel\/([A-Za-z0-9_-]+)/
    ]
    return patterns.some(pattern => pattern.test(url))
  }
  
  const validImages = postImages.filter(img => img && img.trim() !== '' && isValidInstagramUrl(img))

  // Navigation handlers for carousel
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle Escape key to close modal and process Instagram embeds
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    
    // Force Instagram embeds to process when modal opens
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.instgrm) {
        window.instgrm.Embeds.process()
      }
    }, 500)
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      clearTimeout(timer)
    }
  }, [onClose, currentImageIndex])

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200"
            title={t('close')}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="grid md:grid-cols-2 h-full">
            <div className="relative h-[450px] md:h-[650px] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
              {validImages.length > 0 ? (
                <>
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 overflow-y-auto p-4">
                      <div className="w-full max-w-md mx-auto">
                        <InstagramEmbed 
                          key={validImages[currentImageIndex]} 
                          postUrl={validImages[currentImageIndex]} 
                          className="w-full"
                          priority={true}
                          compact={false}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  {validImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6 text-slate-700" />
                      </button>
                      
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6 text-slate-700" />
                      </button>
                      
                      {/* Page indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {validImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              index === currentImageIndex
                                ? 'bg-slate-700 w-6'
                                : 'bg-slate-400 hover:bg-slate-500'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📸</div>
                    <p className="text-sm">No Instagram posts available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[90vh] md:max-h-[650px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{getLocalizedField(artist, 'name', language)}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{getPrefectureTranslation(artist.location || artist.studio?.location || '不明', language)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Artist Bio */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">{t('about')}</h3>
                  <p className="text-slate-600 leading-relaxed">{getLocalizedField(artist, 'bio', language)}</p>
                </div>

                {/* Styles */}
                {displayStyles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">{t('styles')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayStyles.map((style, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}


                {/* Artist Features */}
                {(artist.female_artist || artist.beginner_friendly || artist.custom_design_allowed) && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Artist Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {artist.female_artist && (
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                          Female Artist
                        </span>
                      )}
                      {artist.beginner_friendly && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          Beginner Friendly
                        </span>
                      )}
                      {artist.custom_design_allowed && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Custom Design OK
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <a
                    href={`https://instagram.com/${artist.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Instagram className="w-5 h-5" />
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}