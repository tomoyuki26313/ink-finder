'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, MapPin, Palette } from 'lucide-react'
import Link from 'next/link'
import ArtistCard from '@/components/ArtistCard'
import ArtistModal from '@/components/ArtistModal'
import LanguageToggle from '@/components/LanguageToggle'
import { Artist, Studio, ArtistWithStudio, Style } from '@/types/database'
import { getStoredArtists, subscribeToArtistUpdates } from '@/lib/dataStore'
import { fetchArtistsWithStudios } from '@/lib/api'
import { fetchStyles } from '@/lib/api/styles'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedField } from '@/lib/multilingual'

export default function LocalPage() {
  const { t, language } = useLanguage()
  const [artistsWithStudios, setArtistsWithStudios] = useState<ArtistWithStudio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithStudio | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [showMoreRegions, setShowMoreRegions] = useState(false)
  const [showMoreStyles, setShowMoreStyles] = useState(false)
  const [availableStyles, setAvailableStyles] = useState<Style[]>([])

  useEffect(() => {
    loadLocalArtists()
    loadStyles()
    
    const unsubscribe = subscribeToArtistUpdates(() => {
      loadLocalArtists()
    })
    
    return unsubscribe
  }, [])

  const loadStyles = async () => {
    try {
      const styles = await fetchStyles()
      console.log('Loaded styles in local page:', styles)
      setAvailableStyles(styles)
    } catch (error) {
      console.error('Error loading styles:', error)
    }
  }

  const loadLocalArtists = async () => {
    setLoading(true)
    
    try {
      // Get local storage data
      const storedArtists = getStoredArtists()
      const storedStudios = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
        : []
      const studios = storedStudios
      
      const localArtistsWithStudios = storedArtists.map(artist => {
        const studio = studios.find(s => s.id === artist.studio_id)
        if (!studio) {
          console.warn(`Studio not found for artist ${artist.name_en}`)
          return {
            ...artist,
            studio: {
              id: 'unknown',
              name_ja: '不明',
              name_en: 'Unknown',
              bio_ja: '',
              bio_en: '',
              location: '東京都',
              address_ja: '',
              address_en: '',
              instagram_handle: '',
              instagram_posts: [],
              booking_url: '',
              view_count: 0,
              created_at: new Date().toISOString()
            },
            isLocal: true
          } as ArtistWithStudio & { isLocal: boolean }
        }
        return { ...artist, studio, isLocal: true } as ArtistWithStudio & { isLocal: boolean }
      })
      
      // Also get Supabase data if available
      let supabaseArtists: ArtistWithStudio[] = []
      if (isSupabaseConfigured) {
        try {
          supabaseArtists = await fetchArtistsWithStudios()
          console.log('Loaded Supabase artists:', supabaseArtists.length)
        } catch (error) {
          console.error('Error loading Supabase artists:', error)
        }
      }
      
      // Combine both data sources, avoiding duplicates
      const localIds = new Set(localArtistsWithStudios.map(a => a.id))
      const combinedArtists = [
        ...localArtistsWithStudios,
        ...supabaseArtists.filter(a => !localIds.has(a.id))
      ]
      
      console.log('Total artists loaded:', combinedArtists.length)
      console.log('First artist data in local page:', combinedArtists[0])
      setArtistsWithStudios(combinedArtists)
    } catch (error) {
      console.error('Error loading local artists:', error)
      setArtistsWithStudios([])
    } finally {
      setLoading(false)
    }
  }

  const handleArtistClick = (artist: ArtistWithStudio) => {
    setSelectedArtist(artist)
    
    setArtistsWithStudios(prevArtists => 
      prevArtists.map(a => 
        a.id === artist.id 
          ? { ...a, view_count: a.view_count + 1 }
          : a
      )
    )
  }

  // Translate region names based on language
  const getRegionDisplayName = (region: string) => {
    if (!region) return ''
    
    if (language === 'ja') {
      // Translate English to Japanese, keep Japanese as is
      const regionMap: { [key: string]: string } = {
        'Tokyo': '東京都',
        'Osaka': '大阪府',
        'Kyoto': '京都府',
        'Yokohama': '神奈川県',
        'Kanagawa': '神奈川県',
        'Nagoya': '愛知県',
        'Aichi': '愛知県',
        'Fukuoka': '福岡県',
        'Sendai': '宮城県',
        'Unknown': '不明'
      }
      return regionMap[region] || region
    } else {
      // Translate Japanese to English, keep English as is
      const regionMap: { [key: string]: string } = {
        '東京都': 'Tokyo',
        '東京': 'Tokyo',
        '大阪府': 'Osaka',
        '大阪': 'Osaka', 
        '京都府': 'Kyoto',
        '京都': 'Kyoto',
        '神奈川県': 'Kanagawa',
        '神奈川': 'Kanagawa',
        '愛知県': 'Aichi',
        '愛知': 'Aichi',
        '福岡県': 'Fukuoka',
        '福岡': 'Fukuoka',
        '宮城県': 'Sendai',
        '宮城': 'Sendai',
        '不明': 'Unknown',
        // Keep English as-is
        'Tokyo': 'Tokyo',
        'Osaka': 'Osaka',
        'Kyoto': 'Kyoto',
        'Kanagawa': 'Kanagawa',
        'Aichi': 'Aichi',
        'Fukuoka': 'Fukuoka',
        'Sendai': 'Sendai'
      }
      return regionMap[region] || region
    }
  }

  // Get style display name from database styles
  const getStyleDisplayName = (styleName: string | number) => {
    if (!styleName) return ''
    
    // Handle style IDs (convert to names)
    if (typeof styleName === 'number') {
      const dbStyle = availableStyles.find(style => style.id === styleName)
      return dbStyle ? (language === 'ja' ? dbStyle.style_name_ja : dbStyle.style_name_en) : `Style ${styleName}`
    }
    
    // Handle string style names
    if (typeof styleName !== 'string') return ''
    
    // First, try to find exact match in database styles
    const dbStyle = availableStyles.find(style => 
      style.style_name_ja === styleName || 
      style.style_name_en === styleName
    )
    
    if (dbStyle) {
      return language === 'ja' ? dbStyle.style_name_ja : dbStyle.style_name_en
    }
    
    // Fallback to legacy translation logic for compatibility
    if (language === 'ja') {
      // English to Japanese translation (legacy styles)
      const styleMap: { [key: string]: string } = {
        'abstract': 'アブストラクト',
        'american traditional': 'アメリカントラディショナル',
        'black and grey': 'ブラック&グレー',
        'bold line': 'ボールドライン',
        'botanical': 'ボタニカル',
        'dotwork': 'ドットワーク',
        'geometric': 'ジオメトリック',
        'japanese traditional': '和彫り',
        'mandala': 'マンダラ',
        'minimalist': 'ミニマル',
        'neo-japanese': 'ネオジャパニーズ',
        'old school': 'オールドスクール',
        'portrait': 'ポートレート',
        'sacred geometry': 'セイクリッドジオメトリー',
        'watercolor': '水彩',
        'traditional': 'トラディショナル',
        'realism': 'リアリズム',
        'realistic': 'リアリスティック',
        'blackwork': 'ブラックワーク',
        'fine line': 'ファインライン',
        'fineline': 'ファインライン',
        'floral': 'フローラル',
        'nature': 'ネイチャー',
        'colorful': 'カラフル',
        'single needle': 'シングルニードル',
        'dragon': '龍'
      }
      return styleMap[styleName.toLowerCase()] || styleName
    } else {
      // Japanese to English translation  
      const styleMap: { [key: string]: string } = {
        'アメリカントラディショナル': 'American Traditional',
        'イレズミ': 'Japanese Traditional',
        'オールドスクール': 'Old School',
        'カラフル': 'Colorful',
        'シングルニードル': 'Single Needle',
        'ジオメトリック': 'Geometric',
        'トラディショナル': 'Traditional',
        'ドットワーク': 'Dotwork',
        'ネイチャー': 'Nature',
        'ネオジャパニーズ': 'Neo-Japanese',
        'ファインライン': 'Fine Line',
        'フローラル': 'Floral',
        'ブラック&グレー': 'Black and Grey',
        'ブラックワーク': 'Blackwork',
        'ボタニカル': 'Botanical',
        'ポートレート': 'Portrait',
        'ミニマル': 'Minimalist',
        'リアリスティック': 'Realistic',
        'リアリズム': 'Realism',
        '伝統': 'Traditional',
        '和彫り': 'Japanese Traditional',
        '水彩': 'Watercolor',
        '龍': 'Dragon'
      }
      return styleMap[styleName] || styleName
    }
  }

  // Get unique regions and styles for filter options
  const rawRegions = [...new Set(artistsWithStudios.map(artist => 
    artist.location || artist.studio?.location || artist.address_ja || artist.address_en || '不明'
  ))].filter(Boolean).filter(region => {
    // Filter out Instagram handles and invalid locations
    return !region.startsWith('@') && 
           !region.includes('instagram') && 
           region !== 'undefined' && 
           region !== 'null'
  })
  

  // Get styles from database for filter options
  const filterStyleOptions = availableStyles.map(style => ({
    value: style.style_name_ja, // Use Japanese name as value for consistency
    label: language === 'ja' ? style.style_name_ja : style.style_name_en
  })).sort((a, b) => a.label.localeCompare(b.label))

  // Convert all regions and styles to the current language for display
  // First normalize regions to remove duplicates (similar to styles)
  const normalizedRegions = rawRegions.map(region => {
    // Normalize mixed language regions
    const regionMap: { [key: string]: string } = {
      '京都': 'Kyoto',
      '京都府': 'Kyoto',
      '大阪': 'Osaka',
      '大阪府': 'Osaka', 
      '東京': 'Tokyo',
      '東京都': 'Tokyo',
      '横浜': 'Yokohama',
      '福岡': 'Fukuoka',
      '福岡県': 'Fukuoka',
      '神奈川': 'Kanagawa',
      '神奈川県': 'Kanagawa',
      '愛知': 'Aichi',
      '愛知県': 'Aichi',
      '宮城': 'Sendai',
      '宮城県': 'Sendai',
      '不明': 'Unknown',
      // Keep English as-is
      'Tokyo': 'Tokyo',
      'Osaka': 'Osaka',
      'Kyoto': 'Kyoto',
      'Yokohama': 'Yokohama',
      'Fukuoka': 'Fukuoka',
      'Barcelona': 'Barcelona',
      'Los Angeles': 'Los Angeles',
      'Mumbai': 'Mumbai',
      'Seoul': 'Seoul',
      'Vancouver': 'Vancouver'
    }
    return regionMap[region] || region
  })
  
  const uniqueNormalizedRegions = [...new Set(normalizedRegions)]
  
  const availableRegions = uniqueNormalizedRegions.map(region => getRegionDisplayName(region)).sort()
  
  // Create display list for regions
  const displayRegions = uniqueNormalizedRegions.map(region => getRegionDisplayName(region)).sort()

  // Count frequency of regions and styles for Top 5 display
  const getRegionCounts = () => {
    const counts: { [key: string]: number } = {}
    artistsWithStudios.forEach(artist => {
      const artistLocation = artist.location || artist.studio?.location || artist.address_ja || artist.address_en || '不明'
      
      // Normalize the location first (same as the regions array)
      const regionMap: { [key: string]: string } = {
        '京都': 'Kyoto',
        '京都府': 'Kyoto',
        '大阪': 'Osaka',
        '大阪府': 'Osaka', 
        '東京': 'Tokyo',
        '東京都': 'Tokyo',
        '横浜': 'Yokohama',
        '福岡': 'Fukuoka',
        '福岡県': 'Fukuoka',
        '神奈川': 'Kanagawa',
        '神奈川県': 'Kanagawa',
        '愛知': 'Aichi',
        '愛知県': 'Aichi',
        '宮城': 'Sendai',
        '宮城県': 'Sendai',
        '不明': 'Unknown',
        // Keep English as-is
        'Tokyo': 'Tokyo',
        'Osaka': 'Osaka',
        'Kyoto': 'Kyoto',
        'Yokohama': 'Yokohama',
        'Fukuoka': 'Fukuoka',
        'Barcelona': 'Barcelona',
        'Los Angeles': 'Los Angeles',
        'Mumbai': 'Mumbai',
        'Seoul': 'Seoul',
        'Vancouver': 'Vancouver'
      }
      
      const normalizedLocation = regionMap[artistLocation] || artistLocation
      const displayRegion = getRegionDisplayName(normalizedLocation)
      
      
      counts[displayRegion] = (counts[displayRegion] || 0) + 1
    })
    return counts
  }

  const getStyleCounts = () => {
    const counts: { [key: string]: number } = {}
    artistsWithStudios.forEach(artist => {
      // Count from style_ids
      if (artist.style_ids) {
        artist.style_ids.forEach(styleId => {
          const displayStyle = getStyleDisplayName(styleId)
          counts[displayStyle] = (counts[displayStyle] || 0) + 1
        })
      }
      // Count from image_styles
      if (artist.image_styles) {
        artist.image_styles.forEach(imageStyle => {
          imageStyle.style_ids.forEach(styleId => {
            const displayStyle = getStyleDisplayName(styleId)
            counts[displayStyle] = (counts[displayStyle] || 0) + 1
          })
        })
      }
    })
    return counts
  }

  const regionCounts = getRegionCounts()
  const styleCounts = getStyleCounts()

  // Sort by frequency and get top 5
  const topRegions = availableRegions
    .sort((a, b) => (regionCounts[b] || 0) - (regionCounts[a] || 0))
    .slice(0, 5)
  
  // Get top styles from available database styles based on usage frequency
  const topStyles = filterStyleOptions
    .sort((a, b) => (styleCounts[b.label] || 0) - (styleCounts[a.label] || 0))
    .slice(0, 5)
    .map(style => style.label)

  const displayedRegions = showMoreRegions ? displayRegions : topRegions
  const displayedStyles = showMoreStyles 
    ? filterStyleOptions
        .sort((a, b) => (styleCounts[b.label] || 0) - (styleCounts[a.label] || 0))
        .map(s => s.label) 
    : topStyles

  const filteredArtists = artistsWithStudios.filter(artist => {
    const name = getLocalizedField(artist, 'name', language) || ''
    const bio = getLocalizedField(artist, 'bio', language) || ''
    const studioName = getLocalizedField(artist.studio, 'name', language) || ''
    const artistLocation = artist.location || artist.studio?.location || artist.address_ja || artist.address_en || '不明'
    
    // Search query filter
    const matchesSearch = searchQuery === '' || 
                         name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         studioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         false // Remove legacy style search
    
    // Region filter - compare translated region names (normalize first)
    const regionMap: { [key: string]: string } = {
      '京都': 'Kyoto',
      '京都府': 'Kyoto',
      '大阪': 'Osaka',
      '大阪府': 'Osaka', 
      '東京': 'Tokyo',
      '東京都': 'Tokyo',
      '横浜': 'Yokohama',
      '福岡': 'Fukuoka',
      '福岡県': 'Fukuoka',
      '神奈川': 'Kanagawa',
      '神奈川県': 'Kanagawa',
      '愛知': 'Aichi',
      '愛知県': 'Aichi',
      '宮城': 'Sendai',
      '宮城県': 'Sendai',
      '不明': 'Unknown',
      // Keep English as-is
      'Tokyo': 'Tokyo',
      'Osaka': 'Osaka',
      'Kyoto': 'Kyoto',
      'Yokohama': 'Yokohama',
      'Fukuoka': 'Fukuoka',
      'Barcelona': 'Barcelona',
      'Los Angeles': 'Los Angeles',
      'Mumbai': 'Mumbai',
      'Seoul': 'Seoul',
      'Vancouver': 'Vancouver'
    }
    const normalizedLocation = regionMap[artistLocation] || artistLocation
    const matchesRegion = selectedRegion === '' || getRegionDisplayName(normalizedLocation) === selectedRegion
    
    // Style filter - check if artist has the selected style (including image-based styles)
    const matchesStyle = selectedStyle === '' || (() => {
      // Character normalization for style matching
      const normalizeStyleName = (name: string) => name.replace(/[＆]/g, '&')
      
      // Priority 1: Check style_ids array
      const styleIdsMatch = artist.style_ids?.some(styleId => {
        const dbStyle = availableStyles.find(s => s.id === styleId)
        if (dbStyle) {
          const displayName = language === 'ja' ? dbStyle.style_name_ja : dbStyle.style_name_en
          return normalizeStyleName(displayName) === normalizeStyleName(selectedStyle)
        }
        return false
      })
      
      // Priority 2: Check image-based styles
      const imageStylesMatch = artist.image_styles?.some(imageStyle => {
        return imageStyle.style_ids.some(styleId => {
          const dbStyle = availableStyles.find(s => s.id === styleId)
          if (dbStyle) {
            const displayName = language === 'ja' ? dbStyle.style_name_ja : dbStyle.style_name_en
            return normalizeStyleName(displayName) === normalizeStyleName(selectedStyle)
          }
          return false
        })
      })
      
      return styleIdsMatch || imageStylesMatch
    })()
    
    return matchesSearch && matchesRegion && matchesStyle
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="hidden md:block">
          <div className="max-w-[1261px] mx-auto px-4 relative py-6">
            <div className="absolute top-4 right-4">
              <LanguageToggle />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-black mb-1" style={{fontSize: '2.5rem', lineHeight: '35px', fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: '900', letterSpacing: '-0.05em'}}>
                {t('appName')}
              </h1>
              <p className="text-sm font-roboto font-light text-slate-600 whitespace-nowrap">
                {t('tagline')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="block md:hidden">
          <div className="w-full px-4 relative py-4">
            <div className="absolute top-4 right-4">
              <LanguageToggle />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl text-black mb-1" style={{fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: '900', letterSpacing: '-0.05em'}}>
                {t('appName')}
              </h1>
              <p className="text-xs font-roboto font-light text-slate-600 whitespace-nowrap" style={{height: '16.5px', lineHeight: '16.5px'}}>
                {t('tagline')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!loading && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">{t('search')}</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 placeholder:text-gray-700"
                />
              </div>
              
              {/* Region Filter Tags */}
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                  <MapPin className="w-4 h-4" />
                  {language === 'ja' ? '地域で絞り込み' : 'Filter by Region'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRegion('')}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedRegion === ''
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'ja' ? 'すべて' : 'All'}
                  </button>
                  {displayedRegions.map((region, index) => (
                    <button
                      key={`${region}-${index}`}
                      onClick={() => setSelectedRegion(region)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedRegion === region
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {region}
                      <span className="text-xs opacity-75">({regionCounts[region] || 0})</span>
                    </button>
                  ))}
                  {availableRegions.length > 5 && (
                    <button
                      onClick={() => setShowMoreRegions(!showMoreRegions)}
                      className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all duration-200"
                    >
                      {showMoreRegions 
                        ? (language === 'ja' ? '閉じる' : 'Show Less')
                        : (language === 'ja' ? 'もっと見る' : 'See More')
                      }
                      {!showMoreRegions && (
                        <span className="text-xs opacity-75">
                          (+{availableRegions.length - 5})
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Style Filter Tags */}
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                  <Palette className="w-4 h-4" />
                  {language === 'ja' ? 'スタイルで絞り込み' : 'Filter by Style'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStyle('')}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedStyle === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'ja' ? 'すべて' : 'All'}
                  </button>
                  {displayedStyles.map((style, index) => (
                    <button
                      key={`${style}-${index}`}
                      onClick={() => setSelectedStyle(style)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedStyle === style
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {style}
                      <span className="text-xs opacity-75">({styleCounts[style] || 0})</span>
                    </button>
                  ))}
                  {availableStyles.length > 5 && (
                    <button
                      onClick={() => setShowMoreStyles(!showMoreStyles)}
                      className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all duration-200"
                    >
                      {showMoreStyles 
                        ? (language === 'ja' ? '閉じる' : 'Show Less')
                        : (language === 'ja' ? 'もっと見る' : 'See More')
                      }
                      {!showMoreStyles && (
                        <span className="text-xs opacity-75">
                          (+{availableStyles.length - 5})
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
              <p className="text-slate-600">{t('loadingArtists')}</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  {filteredArtists.length}{' '}
                  {t('artistsFound')}
                </h2>
              </div>

              {filteredArtists.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-slate-700 text-lg">{t('noArtistsFound')}</p>
                  <p className="text-slate-600 mt-2">To load real artist data, go to the <Link href="/admin" className="text-purple-600 hover:underline">Admin page</Link> and click "Load 60 Realistic Artists"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onClick={() => handleArtistClick(artist)}
                      availableStyles={availableStyles}
                      selectedStyles={selectedStyle ? [selectedStyle] : []}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedArtist && (
        <ArtistModal
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
          availableStyles={availableStyles}
        />
      )}

      <footer className="bg-slate-100 mt-16 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {language === 'ja' && (
            <p className="text-sm text-slate-600 text-center leading-relaxed mb-4">{t('heroText')}</p>
          )}
          <div className="flex items-center justify-center gap-4 mb-2">
            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()} Ink Finder. All rights reserved.
            </p>
            <Link 
              href="/" 
              className="text-xs text-slate-600 hover:text-slate-800 underline"
            >
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}