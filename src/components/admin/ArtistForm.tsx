'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, Languages, Tag, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { Artist, Studio, Style, ImageStyle, Motif, ImageMotif } from '@/types/database'
import InstagramUrlValidator from './InstagramUrlValidator'
import { getStylesForImage, updateImageStyles, updateArtistStylesFromImages, getAllStylesFromImages } from '@/lib/imageStyles'
import { getMotifIdsForImage, updateImageMotifs, getAllMotifsFromImages } from '@/lib/imageMotifs'
import { checkArtistDuplicate, DuplicateCheckResult } from '@/lib/artistValidation'

interface ArtistFormProps {
  artist?: Artist | null
  studios: Studio[]
  onSave: (artistData: Omit<Artist, 'id' | 'created_at' | 'view_count'>) => void
  onCancel: () => void
}

// This will be replaced by styles from the database

const locations = [...new Set([
  '東京', '大阪', '京都', '神奈川', '愛知', '福岡', '埼玉', '千葉', '宮城', '沖縄', '滋賀'
])]

// Parse follower input (e.g., "19.7K" -> 19700, "1.5M" -> 1500000)
const parseFollowerInput = (input: string | number): number => {
  if (typeof input === 'number') return input
  if (!input || typeof input !== 'string') return 0
  
  const cleanInput = input.toString().trim().toUpperCase()
  
  // If it's already a plain number
  if (/^\d+$/.test(cleanInput)) {
    return parseInt(cleanInput, 10)
  }
  
  // Parse K, M format
  const match = cleanInput.match(/^(\d+(?:\.\d+)?)\s*([KM])$/)
  if (match) {
    const number = parseFloat(match[1])
    const unit = match[2]
    
    if (unit === 'K') {
      return Math.round(number * 1000)
    } else if (unit === 'M') {
      return Math.round(number * 1000000)
    }
  }
  
  // Try to parse as regular number (fallback)
  const parsed = parseFloat(cleanInput)
  return isNaN(parsed) ? 0 : Math.round(parsed)
}

// Format number for display in input field
const formatFollowerInput = (count: number): string => {
  if (!count || count === 0) return ''
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace('.0', '') + 'M'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1).replace('.0', '') + 'K'
  }
  return count.toString()
}


export default function ArtistForm({ artist, studios, onSave, onCancel }: ArtistFormProps) {
  
  const [translating, setTranslating] = useState(false)
  const [imageUrlValidations, setImageUrlValidations] = useState<boolean[]>([true, true, true])
  const [lastArtistId, setLastArtistId] = useState<string | undefined>(artist?.id)
  const [availableStyles, setAvailableStyles] = useState<Style[]>([])
  const [availableMotifs, setAvailableMotifs] = useState<Motif[]>([])
  const [imageStyles, setImageStyles] = useState<ImageStyle[]>([])
  const [imageMotifs, setImageMotifs] = useState<ImageMotif[]>([])
  const [showImageStyleModal, setShowImageStyleModal] = useState<number | null>(null)
  const [followerInputValue, setFollowerInputValue] = useState<string>('')
  
  // Duplicate check state
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult>({ isDuplicate: false })
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [duplicateCheckTimeout, setDuplicateCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Create initial form data
  const createFormData = (currentArtist: Artist | null | undefined) => {
    if (currentArtist) {
      const existingImages = currentArtist.images || currentArtist.instagram_posts || []
      const safeImages = Array.isArray(existingImages) ? existingImages : []
      
      // Handle both old format (name/bio) and new format (name_ja/name_en)
      const artistData = currentArtist as any
      
      return {
        name_ja: artistData.name_ja || artistData.name || '',
        name_en: artistData.name_en || artistData.name || '',
        bio_ja: artistData.bio_ja || artistData.bio || '',
        bio_en: artistData.bio_en || artistData.bio || '',
        location: artistData.location || '東京',
        studio_id: artistData.studio_id || null,  // Don't auto-select first studio
        instagram_handle: artistData.instagram_handle || '',
        instagram_follower_count: artistData.instagram_follower_count || 0,
        images: [...safeImages, '', '', ''].slice(0, 3),
        // Artist-specific features
        female_artist: artistData.female_artist || false,
        beginner_friendly: artistData.beginner_friendly || false,
        custom_design_allowed: artistData.custom_design_allowed || false,
        cover_up_available: artistData.cover_up_available || false
      }
    }
    
    // Default values for new artist
    return {
      name_ja: '',
      name_en: '',
      bio_ja: '',
      bio_en: '',
      location: locations[0] || '東京',
      studio_id: null,  // Default to no studio selected
      instagram_handle: '',
      instagram_follower_count: 0,
      images: ['', '', ''], // Start with 3 empty slots, can expand to 10
      // Artist-specific features
      female_artist: false,
      beginner_friendly: false,
      custom_design_allowed: false,
      cover_up_available: false
    }
  }
  
  const [formData, setFormData] = useState(() => createFormData(artist))
  
  // Initialize follower input value on first load
  useEffect(() => {
    const initialValue = formData.instagram_follower_count
    if (initialValue && initialValue > 0) {
      setFollowerInputValue(formatFollowerInput(initialValue))
    } else {
      setFollowerInputValue('')
    }
  }, [])
  
  // Load styles and motifs from database
  useEffect(() => {
    const loadStylesAndMotifs = async () => {
      try {
        const { fetchStyles } = await import('@/lib/api/styles')
        const { fetchMotifs } = await import('@/lib/api/motifs')
        
        const [styles, motifs] = await Promise.all([
          fetchStyles(),
          fetchMotifs()
        ])
        
        setAvailableStyles(styles)
        setAvailableMotifs(motifs)
        
        // Load image styles and motifs if they exist
        if (artist) {
          if (artist.image_styles) {
            setImageStyles(artist.image_styles)
          }
          if (artist.image_motifs) {
            setImageMotifs(artist.image_motifs)
          }
        }
      } catch (error) {
        console.error('Error loading styles and motifs:', error)
      }
    }
    loadStylesAndMotifs()
  }, [artist])

  useEffect(() => {
    // Only reset form when artist ID changes (not on every render)
    if (artist?.id !== lastArtistId) {
      const newFormData = createFormData(artist)
      setFormData(newFormData)
      setLastArtistId(artist?.id)
      // Initialize follower input value with formatted display
      const followerCount = newFormData.instagram_follower_count
      if (followerCount && followerCount > 0) {
        setFollowerInputValue(formatFollowerInput(followerCount))
      } else {
        setFollowerInputValue('')
      }
    }
  }, [artist?.id, lastArtistId])

  // Debounced duplicate check function
  const performDuplicateCheck = useCallback(async (instagramHandle: string) => {
    if (!instagramHandle.trim()) {
      setDuplicateCheck({ isDuplicate: false })
      return
    }
    
    setIsCheckingDuplicate(true)
    
    try {
      const result = await checkArtistDuplicate(instagramHandle, artist?.id)
      setDuplicateCheck(result)
    } catch (error) {
      console.error('Duplicate check error:', error)
      setDuplicateCheck({ 
        isDuplicate: false, 
        message: '重複チェック中にエラーが発生しました。' 
      })
    } finally {
      setIsCheckingDuplicate(false)
    }
  }, [artist?.id])

  // Handle Instagram handle input change with debounced duplicate check
  const handleInstagramHandleChange = (value: string) => {
    setFormData(prev => ({ ...prev, instagram_handle: value }))
    
    // Clear previous timeout
    if (duplicateCheckTimeout) {
      clearTimeout(duplicateCheckTimeout)
    }
    
    // Reset duplicate check state immediately
    setDuplicateCheck({ isDuplicate: false })
    
    // Set new timeout for duplicate check (1 second delay)
    const timeout = setTimeout(() => {
      performDuplicateCheck(value)
    }, 1000)
    
    setDuplicateCheckTimeout(timeout)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (duplicateCheckTimeout) {
        clearTimeout(duplicateCheckTimeout)
      }
    }
  }, [duplicateCheckTimeout])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name_ja.trim() && !formData.name_en.trim()) {
      alert('Please enter at least one artist name (Japanese or English)')
      return
    }

    // Check if all Instagram URLs are valid
    const hasInvalidUrls = imageUrlValidations.some((isValid, index) => {
      const url = formData.images[index]
      return url && url.trim() !== '' && !isValid
    })

    if (hasInvalidUrls) {
      alert('Please fix invalid Instagram URLs before saving')
      return
    }

    // Check for duplicate Instagram handle
    if (duplicateCheck.isDuplicate) {
      alert(duplicateCheck.message || 'このアーティストは既に登録されています。')
      return
    }
    
    
    const cleanedData = {
      ...formData,
      images: formData.images.filter(img => img.trim() !== ''),
      image_styles: imageStyles.filter(imgStyle => 
        formData.images.some(img => img.trim() !== '' && img === imgStyle.image_url)
      ),
      image_motifs: imageMotifs.filter(imgMotif => 
        formData.images.some(img => img.trim() !== '' && img === imgMotif.image_url)
      )
    }
    
    console.log('🔍 ArtistForm: Saving data with motifs:', {
      imageMotifs,
      filteredImageMotifs: cleanedData.image_motifs,
      formImages: formData.images
    })

    onSave(cleanedData)
  }

  // Remove studio selection as current structure doesn't use separate studios


  const getImageStyleIds = (imageUrl: string): number[] => {
    const imageStyle = imageStyles.find(img => img.image_url === imageUrl)
    return imageStyle?.style_ids || []
  }

  const updateImageStylesForImage = (imageUrl: string, styleIds: number[]) => {
    setImageStyles(prev => {
      const existingIndex = prev.findIndex(img => img.image_url === imageUrl)
      const newImageStyle: ImageStyle = {
        image_url: imageUrl,
        style_ids: styleIds
      }
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newImageStyle
        return updated
      } else {
        return [...prev, newImageStyle]
      }
    })
  }

  const toggleImageStyleSelection = (imageUrl: string, styleId: number) => {
    const currentStyleIds = getImageStyleIds(imageUrl)
    const newStyleIds = currentStyleIds.includes(styleId)
      ? currentStyleIds.filter(id => id !== styleId)
      : [...currentStyleIds, styleId]
    
    updateImageStylesForImage(imageUrl, newStyleIds)
  }

  // Motif helper functions
  const getImageMotifIds = (imageUrl: string): number[] => {
    const imageMotif = imageMotifs.find(img => img.image_url === imageUrl)
    return imageMotif?.motif_ids || []
  }

  const updateImageMotifsForImage = (imageUrl: string, motifIds: number[]) => {
    setImageMotifs(prev => {
      const existingIndex = prev.findIndex(img => img.image_url === imageUrl)
      const newImageMotif: ImageMotif = {
        image_url: imageUrl,
        motif_ids: motifIds
      }
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newImageMotif
        return updated
      } else {
        return [...prev, newImageMotif]
      }
    })
  }

  const toggleImageMotifSelection = (imageUrl: string, motifId: number) => {
    const currentMotifIds = getImageMotifIds(imageUrl)
    const newMotifIds = currentMotifIds.includes(motifId)
      ? currentMotifIds.filter(id => id !== motifId)
      : [...currentMotifIds, motifId]
    
    console.log('🎨 Motif selection changed:', { imageUrl, motifId, currentMotifIds, newMotifIds })
    updateImageMotifsForImage(imageUrl, newMotifIds)
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData(prev => ({ ...prev, images: newImages }))
  }

  // Move image up/down handlers
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.images.length) return

    const newImages = [...formData.images]
    const movedImage = newImages[fromIndex]
    
    // Remove from old position and insert at new position
    newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // Also reorder validation states
    const newValidations = [...imageUrlValidations]
    const movedValidation = newValidations[fromIndex]
    newValidations.splice(fromIndex, 1)
    newValidations.splice(toIndex, 0, movedValidation)
    setImageUrlValidations(newValidations)
    
    // Update image styles references if they exist
    const updatedImageStyles = imageStyles.map(style => {
      const oldIndex = formData.images.findIndex(img => img === style.image_url)
      if (oldIndex !== -1 && newImages[oldIndex]) {
        return { ...style, image_url: newImages[oldIndex] }
      }
      return style
    })
    setImageStyles(updatedImageStyles)
    
    setFormData(prev => ({ ...prev, images: newImages }))
  }

  const moveImageUp = (index: number) => {
    if (index > 0) {
      moveImage(index, index - 1)
    }
  }

  const moveImageDown = (index: number) => {
    if (index < formData.images.length - 1) {
      moveImage(index, index + 1)
    }
  }

  // Add new empty image field (max 10)
  const addImageField = () => {
    if (formData.images.length < 10) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ''] }))
    }
  }

  // Remove image field
  const removeImageField = (index: number) => {
    if (formData.images.length > 1) { // Keep at least 1 field
      const newImages = formData.images.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, images: newImages }))
      
      // Also remove associated styles and motifs
      const updatedImageStyles = { ...imageStyles }
      const updatedImageMotifs = { ...imageMotifs }
      const imageUrl = formData.images[index]
      if (imageUrl) {
        delete updatedImageStyles[imageUrl]
        delete updatedImageMotifs[imageUrl]
      }
      setImageStyles(updatedImageStyles)
      setImageMotifs(updatedImageMotifs)
    }
  }

  const handleValidationChange = (index: number, isValid: boolean) => {
    const newValidations = [...imageUrlValidations]
    newValidations[index] = isValid
    setImageUrlValidations(newValidations)
  }

  const translateText = async (text: string, context: 'name' | 'bio' = 'bio') => {
    if (!text.trim()) return ''
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text, 
          fromLanguage: 'ja',
          toLanguage: 'en',
          context
        })
      })
      
      if (!response.ok) throw new Error('Translation failed')
      
      const data = await response.json()
      return data.translatedText || text
    } catch (error) {
      console.error('Translation error:', error)
      return text
    }
  }

  const handleTranslateName = async () => {
    if (!formData.name_ja.trim()) return
    
    setTranslating(true)
    try {
      const translatedName = await translateText(formData.name_ja, 'name')
      setFormData(prev => ({ ...prev, name_en: translatedName }))
    } finally {
      setTranslating(false)
    }
  }

  const handleTranslateBio = async () => {
    if (!formData.bio_ja.trim()) return
    
    setTranslating(true)
    try {
      const translatedBio = await translateText(formData.bio_ja)
      setFormData(prev => ({ ...prev, bio_en: translatedBio }))
    } finally {
      setTranslating(false)
    }
  }


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {artist ? 'Edit Artist' : 'Add New Artist'}
        </h2>
        <button onClick={onCancel} className="text-gray-600 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location and Studio Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {locations.map((location, index) => (
                <option key={`${location}-${index}`} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Studio (Optional)
            </label>
            <select
              value={formData.studio_id || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                studio_id: e.target.value === '' ? null : e.target.value 
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択しない / No Studio Selected</option>
              {studios.length === 0 ? (
                <option value="" disabled>No studios available</option>
              ) : (
                studios.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.name_en} ({studio.name_ja}) - {studio.location}
                  </option>
                ))
              )}
            </select>
            {studios.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Please create a studio first before adding artists.
              </p>
            )}
            {(formData.studio_id === '' || formData.studio_id === null) && studios.length > 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠️ This artist will not be associated with any studio.
              </p>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist Name (Japanese) *
              </label>
              <input
                type="text"
                value={formData.name_ja}
                onChange={(e) => setFormData(prev => ({ ...prev, name_ja: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
                placeholder="e.g., 田中ゆき, 山本健二"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist Name (English) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
                  placeholder="e.g., Yuki Tanaka, Kenji Yamamoto"
                />
                <button
                  type="button"
                  onClick={handleTranslateName}
                  disabled={!formData.name_ja.trim() || translating}
                  className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  title="Translate from Japanese"
                >
                  <Languages className="w-4 h-4" />
                  {translating ? 'AI翻訳中...' : 'AI翻訳'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist Bio (Japanese)
              </label>
              <textarea
                rows={3}
                value={formData.bio_ja}
                onChange={(e) => setFormData(prev => ({ ...prev, bio_ja: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
                placeholder="アーティストの経歴や専門分野について..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artist Bio (English)
              </label>
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={formData.bio_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio_en: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
                  placeholder="Artist biography and specialties..."
                />
                <button
                  type="button"
                  onClick={handleTranslateBio}
                  disabled={!formData.bio_ja.trim() || translating}
                  className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  title="Translate from Japanese"
                >
                  <Languages className="w-4 h-4" />
                  {translating ? 'AI翻訳中...' : 'AI翻訳（日本語→英語）'}
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
            <input
              type="text"
              placeholder="username (without @)"
              value={formData.instagram_handle}
              onChange={(e) => {
                let value = e.target.value
                // Remove @ if user types it
                if (value.startsWith('@')) {
                  value = value.substring(1)
                }
                handleInstagramHandleChange(value)
              }}
              className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:border-blue-500 placeholder:text-gray-700 ${
                duplicateCheck.isDuplicate 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            
            {/* Duplicate check status */}
            {formData.instagram_handle && (
              <div className="mt-1 text-sm">
                {isCheckingDuplicate && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                    重複チェック中...
                  </div>
                )}
                {duplicateCheck.isDuplicate && (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {duplicateCheck.message}
                  </div>
                )}
                {!isCheckingDuplicate && !duplicateCheck.isDuplicate && formData.instagram_handle.trim() && (
                  <div className="text-green-600">
                    ✓ このアカウントは利用可能です
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instagram Follower Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram Follower Count
            <span className="text-xs text-gray-700 ml-2">(Supports: 19.7K, 1.5M, etc.)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="19.7K, 1.5M, or 5000"
              value={followerInputValue}
              onChange={(e) => {
                const value = e.target.value
                setFollowerInputValue(value)
                const numericValue = parseFollowerInput(value)
                setFormData(prev => ({ 
                  ...prev, 
                  instagram_follower_count: numericValue 
                }))
              }}
              onBlur={(e) => {
                // Re-format the value when losing focus for cleaner display
                const value = e.target.value
                const numericValue = parseFollowerInput(value)
                if (numericValue > 0) {
                  const formattedValue = formatFollowerInput(numericValue)
                  setFollowerInputValue(formattedValue)
                }
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
            />
            {formData.instagram_handle && formData.instagram_handle.trim() && (
              <button
                type="button"
                onClick={() => {
                  const handle = formData.instagram_handle.replace('@', '').trim()
                  if (handle) {
                    window.open(`https://instagram.com/${handle}`, '_blank')
                  }
                }}
                className="px-4 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors whitespace-nowrap"
              >
                Check Instagram
              </button>
            )}
          </div>
          <p className="text-xs text-gray-700 mt-1">
            Click "Check Instagram" to manually verify the current follower count and update this field.
          </p>
        </div>

        {/* Instagram Posts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Post URLs</label>
          <p className="text-sm text-gray-600 mb-3">
            Add Instagram post URLs (e.g., https://www.instagram.com/p/ABC123/) for legal embedding.
          </p>
          <div className="space-y-6">
            {formData.images.map((postUrl, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-lg p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => moveImageUp(index)}
                      disabled={index === 0}
                      className={`p-2 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation ${
                        index === 0 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                      title="Move up"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImageDown(index)}
                      disabled={index === formData.images.length - 1}
                      className={`p-2 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation ${
                        index === formData.images.length - 1
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                      title="Move down"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    {/* Delete button */}
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100"
                        title="Remove this image"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image {index + 1} URL
                      </label>
                      <input
                    type="url"
                    placeholder={`https://www.instagram.com/p/ABC123${index + 1}/`}
                    value={postUrl}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 ${
                      postUrl && !imageUrlValidations[index] 
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                      />
                      <InstagramUrlValidator
                        url={postUrl}
                        onValidationChange={(isValid) => handleValidationChange(index, isValid)}
                      />
                    </div>
                    
                    {/* Style tags for this image */}
                    {postUrl && postUrl.trim() !== '' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Tag className="inline w-4 h-4 mr-1" />
                          Styles for this image
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-100 rounded">
                          {availableStyles.map(style => {
                            const imageStyleIds = getImageStyleIds(postUrl)
                            const isSelected = imageStyleIds.includes(style.id)
                            
                            return (
                              <label
                                key={style.id}
                                className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleImageStyleSelection(postUrl, style.id)}
                                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{style.style_name_ja}</div>
                                  <div className="text-xs text-gray-700">{style.style_name_en}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                        <div className="mt-1 text-xs text-gray-700">
                          Selected: {getImageStyleIds(postUrl).length} style{getImageStyleIds(postUrl).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    {/* Motif tags for this image */}
                    {postUrl && postUrl.trim() !== '' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Tag className="inline w-4 h-4 mr-1" />
                          Motifs for this image
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-100 rounded bg-blue-50">
                          {availableMotifs.map(motif => {
                            const imageMotifIds = getImageMotifIds(postUrl)
                            const isSelected = imageMotifIds.includes(motif.id)
                            
                            return (
                              <label
                                key={motif.id}
                                className="flex items-center gap-1 cursor-pointer hover:bg-blue-100 p-1 rounded text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleImageMotifSelection(postUrl, motif.id)}
                                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{motif.motif_name_ja}</div>
                                  <div className="text-xs text-gray-700">{motif.motif_name_en}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                        <div className="mt-1 text-xs text-gray-700">
                          Selected: {getImageMotifIds(postUrl).length} motif{getImageMotifIds(postUrl).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add Instagram Post button */}
          {formData.images.length < 10 && (
            <button
              type="button"
              onClick={addImageField}
              className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Instagram Post ({formData.images.length}/10)
            </button>
          )}
          
          {formData.images.length >= 10 && (
            <p className="mt-4 text-sm text-gray-500">Maximum of 10 Instagram posts reached</p>
          )}
          
          <div className="mt-2 text-xs text-gray-700">
            <strong>How to get Instagram post URL:</strong> Go to the Instagram post → Click "..." → "Copy link"
          </div>
        </div>


        {/* Artist Features */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Artist Features</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center text-gray-900">
              <input
                type="checkbox"
                checked={formData.female_artist}
                onChange={(e) => setFormData(prev => ({ ...prev, female_artist: e.target.checked }))}
                className="mr-2"
              />
              Female Artist
            </label>
            <label className="flex items-center text-gray-900">
              <input
                type="checkbox"
                checked={formData.beginner_friendly}
                onChange={(e) => setFormData(prev => ({ ...prev, beginner_friendly: e.target.checked }))}
                className="mr-2"
              />
              Beginner Friendly
            </label>
            <label className="flex items-center text-gray-900">
              <input
                type="checkbox"
                checked={formData.custom_design_allowed}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_design_allowed: e.target.checked }))}
                className="mr-2"
              />
              Custom Design Allowed
            </label>
            <label className="flex items-center text-gray-900">
              <input
                type="checkbox"
                checked={formData.cover_up_available}
                onChange={(e) => setFormData(prev => ({ ...prev, cover_up_available: e.target.checked }))}
                className="mr-2"
              />
              Cover-up Available
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {artist ? 'Update Artist' : 'Add Artist'}
          </button>
        </div>
      </form>
    </div>
  )
}