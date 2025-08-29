'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, Loader2, Database } from 'lucide-react'
import ArtistCard from '@/components/ArtistCard'
import ArtistModal from '@/components/ArtistModal'
import SearchFilters from '@/components/SearchFilters'
import LanguageToggle from '@/components/LanguageToggle'
import { Artist, Studio, ArtistWithStudio } from '@/types/database'
import { fetchArtists, fetchArtistsWithStudios, incrementViewCount } from '@/lib/api'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getStoredArtists, subscribeToArtistUpdates } from '@/lib/dataStore'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLocalizedField } from '@/lib/multilingual'
import { StructuredData } from '@/components/SEO/StructuredData'
import RelatedLinks, { getArtistRelatedLinks } from '@/components/RelatedLinks'

export default function Home() {
  const { t, language } = useLanguage()
  const [artistsWithStudios, setArtistsWithStudios] = useState<ArtistWithStudio[]>([])
  const [styles, setStyles] = useState<any[]>([])
  const [motifs, setMotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedMotifs, setSelectedMotifs] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string[]>([])
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithStudio | null>(null)
  const [sortBy, setSortBy] = useState<string>('followers')
  const [itemsPerPage, setItemsPerPage] = useState<number>(30)
  const [advancedFilters, setAdvancedFilters] = useState<{
    // Studio filters
    speaks_english?: boolean
    speaks_chinese?: boolean
    speaks_korean?: boolean
    lgbtq_friendly?: boolean
    same_day_booking?: boolean
    private_room?: boolean
    parking_available?: boolean
    credit_card_accepted?: boolean
    digital_payment_accepted?: boolean
    late_night_hours?: boolean
    weekend_hours?: boolean
    jagua_tattoo?: boolean
    // Artist filters
    female_artist?: boolean
    beginner_friendly?: boolean
    custom_design_allowed?: boolean
    cover_up_available?: boolean
  }>({})

  useEffect(() => {
    loadArtistsWithStudios()
    loadStyles()
    loadMotifs()
    
    // Subscribe to artist updates from admin page
    const unsubscribe = subscribeToArtistUpdates(() => {
      // Reload artists with studios when artists update
      loadArtistsWithStudios()
    })
    
    return unsubscribe
  }, [])

  const loadStyles = async () => {
    try {
      const { fetchStyles } = await import('@/lib/api/styles')
      const stylesData = await fetchStyles()
      setStyles(stylesData)
    } catch (error) {
      console.error('Error loading styles:', error)
      setStyles([])
    }
  }

  const loadMotifs = async () => {
    try {
      const { fetchMotifs } = await import('@/lib/api/motifs')
      const motifsData = await fetchMotifs()
      setMotifs(motifsData)
    } catch (error) {
      console.error('Error loading motifs:', error)
      setMotifs([])
    }
  }

  const loadArtistsWithStudios = async () => {
    try {
      setLoading(true)
      
      // Check if Supabase is configured
      if (isSupabaseConfigured) {
        const data = await fetchArtistsWithStudios()
        setArtistsWithStudios(data)
      } else {
        // Use localStorage data
        const storedArtists = getStoredArtists()
        const storedStudios = JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
        const studios = storedStudios
        
        // Combine artists with their studios
        const artistsWithStudios = storedArtists.map(artist => {
          const studio = studios.find(s => s.id === artist.studio_id)
          if (!studio) {
            console.warn(`Studio not found for artist ${artist.name_en}`)
            // Create a default studio to prevent errors
            return {
              ...artist,
              studio: {
                id: 'unknown',
                name_ja: '不明',
                name_en: 'Unknown',
                bio_ja: '',
                bio_en: '',
                location: artist.location || '東京都',
                address_ja: '',
                address_en: '',
                instagram_handle: '',
                instagram_posts: [],
                booking_url: '',
                view_count: 0,
                created_at: new Date().toISOString()
              }
            } as ArtistWithStudio
          }
          return { ...artist, studio } as ArtistWithStudio
        })
        setArtistsWithStudios(artistsWithStudios)
      }
    } catch (err) {
      setError('Failed to load artists. Please try again later.')
      console.error('Error loading artists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleArtistClick = useCallback(async (artist: ArtistWithStudio) => {
    setSelectedArtist(artist)
    await incrementViewCount(artist.id)
    
    setArtistsWithStudios(prevArtists => 
      prevArtists.map(a => 
        a.id === artist.id 
          ? { ...a, view_count: a.view_count + 1 }
          : a
      )
    )
  }, [])

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
  }

  const sortArtists = (artists: ArtistWithStudio[]) => {
    return [...artists].sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'followers':
        default:
          const aFollowers = a.instagram_follower_count || 0
          const bFollowers = b.instagram_follower_count || 0
          return bFollowers - aFollowers
      }
    })
  }

  const filteredArtists = useMemo(() => sortArtists(artistsWithStudios.filter(artist => {
    
    const matchesStyle = selectedStyles.length === 0 || (() => {
      // Priority 1: Check style_ids (with character normalization)
      const normalizeStyleName = (name: string) => name.replace(/[＆]/g, '&')
      const styleIdsMatch = artist.style_ids?.some(styleId => {
        const style = styles.find(s => s.id === styleId)
        if (style) {
          const styleName = language === 'ja' ? style.style_name_ja : style.style_name_en
          const normalizedStyleName = normalizeStyleName(styleName)
          return selectedStyles.some(selected => normalizeStyleName(selected) === normalizedStyleName)
        }
        return false
      })
      
      // Priority 2: Check image-based styles (with character normalization)
      const imageStylesMatch = artist.image_styles?.some(imageStyle => {
        return imageStyle.style_ids.some(styleId => {
          const style = styles.find(s => s.id === styleId)
          if (style) {
            const styleName = language === 'ja' ? style.style_name_ja : style.style_name_en
            const normalizedStyleName = normalizeStyleName(styleName)
            return selectedStyles.some(selected => normalizeStyleName(selected) === normalizedStyleName)
          }
          return false
        })
      })
      
      return styleIdsMatch || imageStylesMatch
    })()
    
    const matchesMotifs = selectedMotifs.length === 0 || (() => {
      // Check image-based motifs
      const imageMotifsMatch = artist.image_motifs?.some(imageMotif => {
        return imageMotif.motif_ids.some(motifId => {
          const motif = motifs.find(m => m.id === motifId)
          if (motif) {
            const motifName = language === 'ja' ? motif.motif_name_ja : motif.motif_name_en
            return selectedMotifs.includes(motifName)
          }
          return false
        })
      })
      
      return imageMotifsMatch
    })()
    
    // Normalize location for filtering (same logic as SearchFilters)
    const normalizeLocation = (location: string | undefined): string => {
      if (!location) return ''
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
      return regionMap[location] || location
    }
    
    const normalizedArtistLocation = normalizeLocation(artist.location)
    const normalizedStudioLocation = normalizeLocation(artist.studio?.location)
    
    const matchesLocation = selectedLocation.length === 0 || 
                           selectedLocation.includes(normalizedArtistLocation) ||
                           selectedLocation.includes(normalizedStudioLocation)
    
    // Advanced filters - check both artist and studio properties
    const matchesAdvanced = Object.entries(advancedFilters).every(([key, value]) => {
      if (!value) return true // Filter not active
      
      // Check artist properties
      if (key in artist && artist[key as keyof Artist] === true) return true
      
      // Check studio properties
      if (key in artist.studio && artist.studio[key as keyof Studio] === true) return true
      
      return false
    })
    
    return matchesStyle && matchesMotifs && matchesLocation && matchesAdvanced
  })), [artistsWithStudios, selectedStyles, selectedMotifs, selectedLocation, advancedFilters, sortBy, language, styles, motifs])

  // Paginate results
  const displayedArtists = useMemo(() => {
    return filteredArtists.slice(0, itemsPerPage)
  }, [filteredArtists, itemsPerPage])

  return (
    <>
      <StructuredData type="website" locale="en" />
      <StructuredData type="organization" locale="en" />
      <div className="min-h-screen" style={{backgroundColor: '#E6E6E6'}}>
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="max-w-[1261px] mx-auto px-4 relative py-6">
            <div className="absolute top-4 right-4 flex items-center gap-4">
              <LanguageToggle />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-black mb-1" style={{fontSize: '2.5rem', lineHeight: '35px', fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: '900', letterSpacing: '-0.05em'}}>
                {t('appName')}
              </h1>
              <p className="text-sm font-roboto font-light text-slate-700 whitespace-nowrap">
                {t('tagline')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="w-full px-4 relative py-4">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <LanguageToggle />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl text-black mb-1" style={{fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: '900', letterSpacing: '-0.05em'}}>
                {t('appName')}
              </h1>
              <p className="text-xs font-roboto font-light text-slate-700 whitespace-nowrap" style={{height: '16.5px', lineHeight: '16.5px'}}>
                {t('tagline')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && !error && (
          <>
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-700">
                {language === 'ja' ? (
                  <>
                    <span className="block md:inline">本サイトはタトゥーアーティストやスタジオの情報紹介を目的としており、各掲載先とは直接の関係はありません。</span>
                    <span className="block md:inline md:before:content-[''] md:before:block">ご予約・ご相談は、各アーティストまたはスタジオへ直接ご連絡ください。</span>
                  </>
                ) : (
                  <>
                    <span className="block md:inline">This website is operated for the purpose of introducing tattoo artists and studios, and has no direct affiliation with any of the artists or studios listed.</span>
                    <span className="block md:inline md:before:content-[''] md:before:block">For bookings and consultations, please contact the artists or studios directly.</span>
                  </>
                )}
              </p>
            </div>
            <SearchFilters
              selectedStyles={selectedStyles}
              setSelectedStyles={setSelectedStyles}
              selectedMotifs={selectedMotifs}
              setSelectedMotifs={setSelectedMotifs}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
              artists={artistsWithStudios}
              styles={styles}
              motifs={motifs}
            />
          </>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
              <p className="text-slate-700">{t('loadingArtists')}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-xl font-semibold text-slate-800">
                  {filteredArtists.length}{' '}
                  {t('artistsFound')}
                  {filteredArtists.length > itemsPerPage && (
                    <span className="text-sm font-normal text-gray-800 ml-2">
                      ({displayedArtists.length}件表示中)
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  <select 
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-slate-800 font-medium bg-white"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="followers">Sort by: Popular</option>
                    <option value="created_at">{t('sortNewest')}</option>
                  </select>
                  
                  <select 
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-slate-800 font-medium bg-white"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value="30">30件</option>
                    <option value="50">50件</option>
                    <option value="100">100件</option>
                  </select>
                </div>
              </div>

              {filteredArtists.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-slate-700 text-lg">{t('noArtistsFound')}</p>
                  <p className="text-slate-700 mt-2">To load real artist data, go to the <a href="/admin" className="text-purple-600 hover:underline">Admin page</a> and click "Load 60 Realistic Artists"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedArtists.map((artist, index) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onClick={() => handleArtistClick(artist)}
                      availableStyles={styles}
                      availableMotifs={motifs}
                      selectedStyles={selectedStyles}
                      selectedMotifs={selectedMotifs}
                      delay={index * 50} // 各カードに50msずつ遅延を追加
                    />
                  ))}
                </div>
              )}
              
              {filteredArtists.length > displayedArtists.length && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-800 mb-3">
                    {filteredArtists.length}件中{displayedArtists.length}件を表示
                  </p>
                  <button
                    onClick={() => setItemsPerPage(prev => Math.min(prev + 30, filteredArtists.length))}
                    className="px-6 py-2 bg-white text-black border border-black rounded-lg hover:bg-black hover:text-white transition-colors"
                  >
                    もっと見る
                  </button>
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
          availableStyles={styles}
          availableMotifs={motifs}
        />
      )}

      {/* Related Links Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <RelatedLinks 
          links={getArtistRelatedLinks(language)}
          className="mb-8"
        />
      </div>

      <footer className="bg-slate-100 mt-16 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {language === 'ja' && (
            <p className="text-sm text-slate-700 text-center leading-relaxed mb-4">{t('heroText')}</p>
          )}
          <div className="flex items-center justify-center gap-4 mb-2">
            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()} Ink Finder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}