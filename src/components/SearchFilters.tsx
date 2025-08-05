'use client'

import { useState, useEffect, memo } from 'react'
import { Palette, MapPin, X } from 'lucide-react'
import { getLocations } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { getStyleTranslation } from '@/lib/styleTranslations'
import { getPrefectureTranslation } from '@/lib/prefectureTranslations'

interface SearchFiltersProps {
  selectedStyles: string[]
  setSelectedStyles: (styles: string[]) => void
  selectedLocation: string[]
  setSelectedLocation: (location: string[]) => void
  advancedFilters: {
    speaks_english?: boolean
    speaks_chinese?: boolean
    speaks_korean?: boolean
    has_female_artist?: boolean
    lgbtq_friendly?: boolean
    beginner_friendly?: boolean
    same_day_booking?: boolean
    private_room?: boolean
    parking_available?: boolean
    credit_card_accepted?: boolean
    digital_payment_accepted?: boolean
    late_night_hours?: boolean
    weekend_hours?: boolean
    custom_design_allowed?: boolean
    cover_up_available?: boolean
    jagua_tattoo?: boolean
  }
  setAdvancedFilters: (filters: any) => void
  artists?: any[] // Add artists prop for frequency calculation
  styles?: any[] // Add styles prop for ID to name conversion
}

// 主要な地域リスト（シンプル表記）
const japanRegions = [...new Set([
  '東京', '京都', '大阪', '宮城', '福岡', '愛知', '埼玉', '神奈川', '千葉', '沖縄', '滋賀'
])]

// 初期表示するスタイル
const priorityStyles = ['和彫り', 'アニメ', 'ファインライン', 'アブストラクト', 'リアリズム', 'ブラックワーク']

const SearchFilters = memo(function SearchFilters({
  selectedStyles,
  setSelectedStyles,
  selectedLocation,
  setSelectedLocation,
  advancedFilters,
  setAdvancedFilters,
  artists = [],
  styles = []
}: SearchFiltersProps) {
  const { t, language } = useLanguage()
  const [showAllStyles, setShowAllStyles] = useState(false)

  // Calculate style frequency from artists data (unique artist count per style)
  const getStyleFrequency = () => {
    const styleCount: { [key: string]: Set<string> } = {}
    
    artists.forEach(artist => {
      const artistId = artist.id
      const uniqueStylesForArtist = new Set<string>()
      
      // Priority 1: Collect from style_ids
      if (artist.style_ids && Array.isArray(artist.style_ids)) {
        artist.style_ids.forEach((id: number) => {
          const styleObj = styles.find((s: any) => s.id === id)
          if (styleObj) {
            const styleName = language === 'ja' ? styleObj.style_name_ja : styleObj.style_name_en
            uniqueStylesForArtist.add(styleName)
          }
        })
      }
      
      // Priority 2: Collect from image_styles
      if (artist.image_styles && Array.isArray(artist.image_styles)) {
        artist.image_styles.forEach((imageStyle: any) => {
          if (imageStyle.style_ids && Array.isArray(imageStyle.style_ids)) {
            imageStyle.style_ids.forEach((id: number) => {
              const styleObj = styles.find((s: any) => s.id === id)
              if (styleObj) {
                const styleName = language === 'ja' ? styleObj.style_name_ja : styleObj.style_name_en
                uniqueStylesForArtist.add(styleName)
              }
            })
          }
        })
      }
      
      // Add this artist to each style they have (unique per artist)
      uniqueStylesForArtist.forEach(styleName => {
        if (!styleCount[styleName]) {
          styleCount[styleName] = new Set()
        }
        styleCount[styleName].add(artistId)
      })
    })
    
    // Convert Sets to counts
    const result: { [key: string]: number } = {}
    Object.entries(styleCount).forEach(([styleName, artistSet]) => {
      result[styleName] = artistSet.size
    })
    
    return result
  }

  // Calculate location frequency from artists data
  const getLocationFrequency = () => {
    const locationCount: { [key: string]: number } = {}
    
    artists.forEach(artist => {
      const rawLocation = artist.location || artist.studio?.location
      
      if (rawLocation) {
        // Normalize the location (same logic as getUniqueRegions)
        const regionMap: { [key: string]: string } = {
          '京都': '京都',
          '京都府': '京都',
          '大阪': '大阪',
          '大阪府': '大阪', 
          '東京': '東京',
          '東京都': '東京',
          '横浜': '神奈川',
          '福岡': '福岡',
          '福岡県': '福岡',
          '神奈川': '神奈川',
          '神奈川県': '神奈川',
          '愛知': '愛知',
          '愛知県': '愛知',
          '宮城': '宮城',
          '宮城県': '宮城',
          '沖縄': '沖縄',
          '沖縄県': '沖縄',
          '那覇': '沖縄',
          '埼玉': '埼玉',
          '埼玉県': '埼玉',
          '千葉': '千葉',
          '千葉県': '千葉',
          '滋賀': '滋賀',
          '滋賀県': '滋賀',
          '不明': '不明',
          'Tokyo': '東京',
          'Osaka': '大阪',
          'Kyoto': '京都',
          'Okinawa': '沖縄'
        }
        
        const normalizedLocation = regionMap[rawLocation] || rawLocation
        locationCount[normalizedLocation] = (locationCount[normalizedLocation] || 0) + 1
      }
    })
    return locationCount
  }

  // Sort styles by frequency (most popular first)
  const getSortedStyles = () => {
    const styleFrequency = getStyleFrequency()
    
    // Convert database styles to display format with frequency
    const stylesWithFreq = styles.map(style => {
      const displayName = language === 'ja' ? style.style_name_ja : style.style_name_en
      return {
        dbStyle: style,
        displayName,
        frequency: styleFrequency[displayName] || 0
      }
    })
    
    // Sort by frequency (descending) - most popular first, zero frequency last
    return stylesWithFreq.sort((a, b) => {
      // If both have 0 frequency, sort alphabetically
      if (a.frequency === 0 && b.frequency === 0) {
        return a.displayName.localeCompare(b.displayName)
      }
      // Otherwise sort by frequency (higher first)
      return b.frequency - a.frequency
    })
  }

  // Get unique regions from artist data and normalize them
  const getUniqueRegions = () => {
    const rawRegions = [...new Set(artists.map(artist => 
      artist.location || artist.studio?.location
    ))].filter(Boolean).filter(region => {
      // Filter out Instagram handles and invalid locations
      return !region.startsWith('@') && 
             !region.includes('instagram') && 
             region !== 'undefined' && 
             region !== 'null'
    })
    
    // Normalize mixed language regions
    const normalizedRegions = rawRegions.map(region => {
      const regionMap: { [key: string]: string } = {
        '京都': '京都',
        '京都府': '京都',
        '大阪': '大阪',
        '大阪府': '大阪', 
        '東京': '東京',
        '東京都': '東京',
        '横浜': '神奈川',
        '福岡': '福岡',
        '福岡県': '福岡',
        '神奈川': '神奈川',
        '神奈川県': '神奈川',
        '愛知': '愛知',
        '愛知県': '愛知',
        '宮城': '宮城',
        '宮城県': '宮城',
        '沖縄': '沖縄',
        '沖縄県': '沖縄',
        '那覇': '沖縄',
        '埼玉': '埼玉',
        '埼玉県': '埼玉',
        '千葉': '千葉',
        '千葉県': '千葉',
        '滋賀': '滋賀',
        '滋賀県': '滋賀',
        '不明': '不明',
        // Keep other locations as-is
        'Tokyo': '東京',
        'Osaka': '大阪',
        'Kyoto': '京都',
        'Okinawa': '沖縄'
      }
      return regionMap[region] || region
    })
    
    return [...new Set(normalizedRegions)]
  }

  // Calculate frequencies once
  const locationFrequency = getLocationFrequency()
  const uniqueRegions = getUniqueRegions()
  
  // Sort prefectures by frequency (most popular first)  
  const sortedPrefectures = uniqueRegions.sort((a, b) => (locationFrequency[b] || 0) - (locationFrequency[a] || 0))

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style))
    } else {
      setSelectedStyles([...selectedStyles, style])
    }
  }

  const toggleLocation = (location: string) => {
    if (selectedLocation.includes(location)) {
      setSelectedLocation(selectedLocation.filter(l => l !== location))
    } else {
      setSelectedLocation([...selectedLocation, location])
    }
  }


  const clearFilters = () => {
    setSelectedStyles([])
    setSelectedLocation([])
    setAdvancedFilters({})
  }

  const hasActiveFilters = selectedStyles.length > 0 || selectedLocation.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{t('filters')}</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            {t('clearAll')}
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-slate-700" />
            <h4 className="font-medium text-slate-700">{t('style')}</h4>
            {selectedStyles.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {selectedStyles.length} {t('selected')}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(showAllStyles ? getSortedStyles() : getSortedStyles().slice(0, 6))
                .map((styleInfo, index) => (
                  <button
                    key={`${styleInfo.dbStyle.id}-${index}`}
                    onClick={() => toggleStyle(styleInfo.displayName)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedStyles.includes(styleInfo.displayName)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {styleInfo.displayName}
                    {styleInfo.frequency > 0 && (
                      <span className="ml-1 text-xs opacity-75">({styleInfo.frequency})</span>
                    )}
                  </button>
                ))}
            </div>
            {styles.length > 6 && (
              <button
                onClick={() => setShowAllStyles(!showAllStyles)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {showAllStyles ? t('showLess') : `${t('showMore')} (${styles.length - 6})`}
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-slate-700" />
            <h4 className="font-medium text-slate-700">{t('location')}</h4>
            {selectedLocation.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {selectedLocation.length} {t('selected')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedPrefectures.map((prefecture, index) => (
              <button
                key={`${prefecture}-${index}`}
                onClick={() => toggleLocation(prefecture)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedLocation.includes(prefecture)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {getPrefectureTranslation(prefecture, language)}
                <span className="ml-1 text-xs opacity-75">({locationFrequency[prefecture] || 0})</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
})

export default SearchFilters