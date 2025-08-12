'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Building2, Users, Globe, Clock, Upload, ArrowUpDown, ArrowUp, ArrowDown, Palette, Sparkles } from 'lucide-react'
import { Artist, Studio, Style, Motif } from '@/types/database'
import { getStoredArtists, saveArtists } from '@/lib/dataStore'
import { fetchArtists, createStudio, updateStudio, deleteStudio } from '@/lib/api'
import { isSupabaseConfigured } from '@/lib/supabase'
import ArtistForm from '@/components/admin/ArtistForm'
import StudioForm from '@/components/admin/StudioForm'
import StyleForm from '@/components/admin/StyleForm'
import MotifForm from '@/components/admin/MotifForm'
import DesignSystemManager from '@/components/admin/DesignSystemManager'
import ArtistPreview from '@/components/admin/ArtistPreview'
import DataManager from '@/components/admin/DataManager'
import CrawlDashboard from '@/components/admin/CrawlDashboard'
import ArtistReview from '@/components/admin/ArtistReview'
import DeploymentDashboard from '@/components/admin/DeploymentDashboard'
import InstagramEmbed from '@/components/InstagramEmbed'

type TabType = 'artists' | 'studios' | 'styles' | 'motifs' | 'design' | 'crawling' | 'review' | 'deploy'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('artists')
  const [artists, setArtists] = useState<Artist[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [motifs, setMotifs] = useState<Motif[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null)
  const [editingStyle, setEditingStyle] = useState<Style | null>(null)
  const [editingMotif, setEditingMotif] = useState<Motif | null>(null)
  const [previewArtist, setPreviewArtist] = useState<Artist | null>(null)
  
  // Sorting state for artists
  const [sortField, setSortField] = useState<keyof Artist | 'studio_name'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Sorting state for studios
  const [studioSortField, setStudioSortField] = useState<keyof Studio | 'artist_count'>('created_at')
  const [studioSortDirection, setStudioSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Crawling state
  const [crawlStats, setCrawlStats] = useState({
    totalArtists: 0,
    crawledArtists: 0,
    pendingReview: 0,
    lastCrawl: new Date().toISOString(),
    nextCrawl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    crawlStatus: 'idle' as 'idle' | 'running' | 'error' | 'stopping',
    errors: [] as { url: string; error: string; timestamp: string }[]
  })
  
  const [currentProgress, setCurrentProgress] = useState<any>(null)
  
  // Database migration state
  const [migrationStatus, setMigrationStatus] = useState<{
    checking: boolean
    needed: boolean
    missingColumns: string[]
    migrationSQL?: string
  }>({
    checking: false,
    needed: false,
    missingColumns: []
  })
  const [crawler, setCrawler] = useState<any>(null)
  
  const [pendingArtists, setPendingArtists] = useState<any[]>([
    {
      id: 'pending-1',
      name_ja: '佐藤花子',
      name_en: 'Hanako Sato',
      bio_ja: '10年以上の経験を持つタトゥーアーティスト。リアリズムと和彫りを得意としています。',
      bio_en: 'Tattoo artist with over 10 years of experience, specializing in realism and traditional Japanese tattoos.',
      location: '東京都',
      styles: ['realism', '和彫り', 'blackwork'],
      portfolio_images: [
        'https://via.placeholder.com/200x200/333/fff?text=Portfolio+1',
        'https://via.placeholder.com/200x200/666/fff?text=Portfolio+2'
      ],
      pricing_info: {
        price_range: '¥25,000 - ¥120,000',
        session_minimum: '¥25,000',
        consultation_fee: '¥5,000'
      },
      contact_info: {
        email: 'hanako@example.com',
        phone: '03-1234-5678',
        booking_platform: 'email'
      },
      confidence_score: 85,
      discovered_at: new Date().toISOString(),
      source_url: 'https://example-tattoo-studio.com/hanako',
      data_source: 'crawled'
    },
    {
      id: 'pending-2',
      name_ja: '山田太郎',
      name_en: 'Taro Yamada',
      bio_ja: 'アニメスタイルのタトゥーを専門とするアーティスト。',
      bio_en: 'Artist specializing in anime-style tattoos.',
      location: '大阪府',
      styles: ['anime', 'japanese', 'fine line'],
      portfolio_images: [
        'https://via.placeholder.com/200x200/444/fff?text=Anime+1'
      ],
      pricing_info: {
        price_range: '¥15,000 - ¥80,000',
        session_minimum: '¥15,000'
      },
      contact_info: {
        email: 'taro@example.com',
        booking_platform: 'instagram'
      },
      confidence_score: 72,
      discovered_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      source_url: 'https://another-studio.com/taro',
      data_source: 'crawled'
    }
  ])

  // Load data on mount and initialize crawler
  useEffect(() => {
    // Clean up old UUID-based studios from localStorage to prevent type mismatch errors
    if (typeof window !== 'undefined') {
      const storedStudios = JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      const validStudios = storedStudios.filter((studio: any) => 
        typeof studio.id === 'number' || /^\d+$/.test(studio.id)
      )
      
      if (validStudios.length !== storedStudios.length) {
        console.log(`🧹 Cleaned up ${storedStudios.length - validStudios.length} old UUID studios from localStorage`)
        localStorage.setItem('ink-finder-studios', JSON.stringify(validStudios))
      }
    }
    
    loadArtists()
    loadStudios()
    loadStyles()
    loadMotifs()
    initializeCrawler()
  }, [])
  
  const initializeCrawler = async () => {
    try {
      const { EnhancedCrawlScheduler } = await import('@/lib/crawler')
      const crawlerInstance = new EnhancedCrawlScheduler()
      
      // Set up progress callback
      crawlerInstance.setProgressCallback((progress) => {
        setCurrentProgress(progress)
        setCrawlStats(prev => ({
          ...prev,
          crawlStatus: progress.status === 'running' ? 'running' : progress.status === 'stopping' ? 'stopping' : 'idle',
          crawledStudios: progress.studiosFound || 0,
          crawledArtists: progress.artistsFound || 0
        }))
      })
      
      setCrawler(crawlerInstance)
    } catch (error) {
      console.error('Failed to initialize crawler:', error)
    }
  }

  const loadArtists = async () => {
    try {
      if (isSupabaseConfigured) {
        console.log('🔧 Admin: Loading artists from Supabase...')
        const supabaseArtists = await fetchArtists()
        console.log(`✅ Admin: Loaded ${supabaseArtists.length} artists from Supabase`)
        setArtists(supabaseArtists)
      } else {
        console.log('📝 Admin: Loading artists from localStorage...')
        const storedArtists = getStoredArtists()
        setArtists(storedArtists)
      }
    } catch (error) {
      console.error('❌ Admin: Error loading artists:', error)
      // Fallback to localStorage
      const storedArtists = getStoredArtists()
      setArtists(storedArtists)
    }
  }

  const loadStudios = async () => {
    try {
      if (isSupabaseConfigured) {
        console.log('🔧 Admin: Loading studios from Supabase...')
        const { fetchStudios } = await import('@/lib/api')
        const supabaseStudios = await fetchStudios()
        console.log(`✅ Admin: Loaded ${supabaseStudios.length} studios from Supabase`)
        setStudios(supabaseStudios)
      } else {
        const storedStudios = JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
        setStudios(storedStudios)
      }
    } catch (error) {
      console.error('❌ Error loading studios:', error)
      // Fallback to localStorage
      const storedStudios = JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      setStudios(storedStudios)
    }
  }

  const loadStyles = async () => {
    try {
      const { fetchStyles } = await import('@/lib/api/styles')
      const stylesData = await fetchStyles()
      console.log('Raw styles data from database:', stylesData)
      setStyles(stylesData)
      console.log(`📝 Loaded ${stylesData.length} styles`)
      console.log('Current styles state after update:', stylesData.map(s => ({ id: s.id, ja: s.style_name_ja, en: s.style_name_en })))
    } catch (error) {
      console.error('❌ Error loading styles:', error)
      setStyles([])
    }
  }

  const loadMotifs = async () => {
    try {
      const { fetchMotifs } = await import('@/lib/api/motifs')
      const motifsData = await fetchMotifs()
      console.log('Raw motifs data from database:', motifsData)
      setMotifs(motifsData)
      console.log(`✨ Loaded ${motifsData.length} motifs`)
      console.log('Current motifs state after update:', motifsData.map(m => ({ id: m.id, ja: m.motif_name_ja, en: m.motif_name_en })))
    } catch (error) {
      console.error('❌ Error loading motifs:', error)
      setMotifs([])
    }
  }
  
  // Update stats when data changes
  useEffect(() => {
    setCrawlStats(prev => ({
      ...prev,
      totalStudios: studios.length,
      totalArtists: artists.length
    }))
  }, [artists.length, studios.length])

  const handleSaveArtist = async (artistData: Omit<Artist, 'id' | 'created_at' | 'view_count'>) => {
    try {
      console.log('🔍 Saving artist data:', artistData)
      console.log('🎨 Image motifs in save data:', artistData.image_motifs)
      
      if (isSupabaseConfigured) {
        // 本番環境（Supabase）に直接保存
        const { createArtist, updateArtist } = await import('@/lib/api')
        
        if (editingArtist) {
          // 既存のアーティストを更新
          console.log('📝 Updating existing artist:', editingArtist.id)
          const updatedArtist = await updateArtist(editingArtist.id, artistData)
          if (updatedArtist) {
            console.log('✅ Artist updated in production:', updatedArtist.name_en || updatedArtist.name_ja)
            await loadArtists() // 最新データを再読み込み
          }
        } else {
          // 新しいアーティストを作成
          console.log('🆕 Creating new artist...')
          const newArtist = await createArtist(artistData)
          if (newArtist) {
            console.log('✅ Artist created in production:', newArtist.name_en || newArtist.name_ja)
            await loadArtists() // 最新データを再読み込み
          }
        }
      } else {
        // ローカル環境（localStorage）に保存
        let updatedArtists: Artist[]
        
        if (editingArtist) {
          // Update existing artist
          updatedArtists = artists.map(artist => 
            artist.id === editingArtist.id 
              ? { ...artistData, id: editingArtist.id, created_at: editingArtist.created_at, view_count: editingArtist.view_count }
              : artist
          )
        } else {
          // Add new artist
          const newArtist: Artist = {
            ...artistData,
            id: `artist-${Date.now()}`,
            created_at: new Date().toISOString(),
            view_count: 0
          }
          updatedArtists = [...artists, newArtist]
        }
        
        setArtists(updatedArtists)
        saveArtists(updatedArtists)
      }
      
      setShowForm(false)
      setEditingArtist(null)
    } catch (error: any) {
      console.error('Error saving artist:', error)
      alert(`Error saving artist: ${error.message || 'Unknown error'}`)
    }
  }

  const handleSaveStudio = async (studioData: Omit<Studio, 'id' | 'created_at' | 'view_count'>) => {
    try {
      let savedStudio: Studio | null = null
      
      if (editingStudio) {
        // Update existing studio using API
        savedStudio = await updateStudio(editingStudio.id, studioData)
        if (savedStudio) {
          // Update local state
          const updatedStudios = studios.map(studio => 
            studio.id === editingStudio.id ? savedStudio! : studio
          )
          setStudios(updatedStudios)
          localStorage.setItem('ink-finder-studios', JSON.stringify(updatedStudios))
        }
      } else {
        // Create new studio using API
        savedStudio = await createStudio(studioData)
        if (savedStudio) {
          // Add to local state
          const updatedStudios = [...studios, savedStudio]
          setStudios(updatedStudios)
          localStorage.setItem('ink-finder-studios', JSON.stringify(updatedStudios))
        }
      }
      
      if (savedStudio) {
        setShowForm(false)
        setEditingStudio(null)
        console.log('✅ Studio saved successfully:', savedStudio.name_en || savedStudio.name_ja)
      } else {
        console.error('❌ Failed to save studio - no data returned')
        alert('Failed to save studio - no data returned. Please check the console for details.')
      }
    } catch (error: any) {
      console.error('Error saving studio:', error)
      alert(`Error saving studio: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDeleteArtist = async (id: string) => {
    if (confirm('Are you sure you want to delete this artist?')) {
      try {
        if (isSupabaseConfigured) {
          // 本番環境から削除
          const { deleteArtist } = await import('@/lib/api')
          const success = await deleteArtist(id)
          if (success) {
            console.log('✅ Artist deleted from production')
            await loadArtists() // 最新データを再読み込み
          } else {
            alert('Failed to delete artist from production')
          }
        } else {
          // ローカルから削除
          const updatedArtists = artists.filter(artist => artist.id !== id)
          setArtists(updatedArtists)
          saveArtists(updatedArtists)
        }
      } catch (error: any) {
        console.error('Error deleting artist:', error)
        alert(`Error deleting artist: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleDeleteStudio = async (id: string) => {
    // Check if any artists are associated with this studio
    const associatedArtists = artists.filter(artist => artist.studio_id === id)
    if (associatedArtists.length > 0) {
      alert(`Cannot delete studio. ${associatedArtists.length} artist(s) are associated with this studio. Please reassign or delete them first.`)
      return
    }
    
    if (confirm('Are you sure you want to delete this studio?')) {
      try {
        const success = await deleteStudio(id)
        if (success) {
          // Update local state
          const updatedStudios = studios.filter(studio => studio.id !== id)
          setStudios(updatedStudios)
          localStorage.setItem('ink-finder-studios', JSON.stringify(updatedStudios))
          console.log('✅ Studio deleted successfully')
        } else {
          console.error('❌ Failed to delete studio')
          alert('Failed to delete studio. Please try again.')
        }
      } catch (error: any) {
        console.error('Error deleting studio:', error)
        alert(`Error deleting studio: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist)
    setEditingStudio(null)
    setShowForm(true)
  }

  const handleEditStudio = (studio: Studio) => {
    setEditingStudio(studio)
    setEditingArtist(null)
    setShowForm(true)
  }

  const handleSaveStyle = async (styleData: Omit<Style, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { createStyle, updateStyle } = await import('@/lib/api/styles')
      
      if (editingStyle) {
        // Update existing style
        console.log('Updating style:', editingStyle.id, 'with data:', styleData)
        const updated = await updateStyle(editingStyle.id, styleData)
        if (updated) {
          console.log('✅ Style updated:', updated.style_name_en)
          console.log('Updated style data:', updated)
          await loadStyles()
          console.log('Styles reloaded after update')
        }
      } else {
        // Create new style
        const created = await createStyle(styleData)
        if (created) {
          console.log('✅ Style created:', created.style_name_en)
          await loadStyles()
        }
      }
      
      setShowForm(false)
      setEditingStyle(null)
    } catch (error: any) {
      console.error('Error saving style:', error)
      alert(`Error saving style: ${error.message || 'Unknown error'}`)
    }
  }

  const handleEditStyle = (style: Style) => {
    setEditingStyle(style)
    setEditingArtist(null)
    setEditingStudio(null)
    setEditingMotif(null)
    setShowForm(true)
  }

  const handleEditMotif = (motif: Motif) => {
    setEditingMotif(motif)
    setEditingArtist(null)
    setEditingStudio(null)
    setEditingStyle(null)
    setShowForm(true)
  }

  const handleDeleteStyle = async (id: number) => {
    if (confirm('Are you sure you want to delete this style?')) {
      try {
        const { deleteStyle } = await import('@/lib/api/styles')
        const success = await deleteStyle(id)
        if (success) {
          console.log('✅ Style deleted successfully')
          await loadStyles()
        } else {
          alert('Failed to delete style')
        }
      } catch (error: any) {
        console.error('Error deleting style:', error)
        alert(`Error deleting style: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleSaveMotif = async (motifData: Omit<Motif, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { createMotif, updateMotif } = await import('@/lib/api/motifs')
      
      if (editingMotif) {
        // Update existing motif
        console.log('Updating motif:', editingMotif.id, 'with data:', motifData)
        const updated = await updateMotif(editingMotif.id, motifData)
        if (updated) {
          console.log('✅ Motif updated:', updated.motif_name_en)
          console.log('Updated motif data:', updated)
          await loadMotifs()
          console.log('Motifs reloaded after update')
        }
      } else {
        // Create new motif
        const created = await createMotif(motifData)
        if (created) {
          console.log('✅ Motif created:', created.motif_name_en)
          await loadMotifs()
        }
      }
      setEditingMotif(null)
      setShowForm(false)
    } catch (error: any) {
      console.error('Error saving motif:', error)
      alert(`Error saving motif: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDeleteMotif = async (id: number) => {
    if (confirm('Are you sure you want to delete this motif?')) {
      try {
        const { deleteMotif } = await import('@/lib/api/motifs')
        const success = await deleteMotif(id)
        if (success) {
          console.log('✅ Motif deleted successfully')
          await loadMotifs()
        } else {
          alert('Failed to delete motif')
        }
      } catch (error: any) {
        console.error('Error deleting motif:', error)
        alert(`Error deleting motif: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleAddNew = () => {
    if (activeTab === 'artists') {
      setEditingArtist(null)
      setEditingStudio(null)
      setEditingStyle(null)
      setEditingMotif(null)
    } else if (activeTab === 'studios') {
      setEditingStudio(null)
      setEditingArtist(null)
      setEditingStyle(null)
      setEditingMotif(null)
    } else if (activeTab === 'styles') {
      setEditingStyle(null)
      setEditingArtist(null)
      setEditingStudio(null)
      setEditingMotif(null)
    } else if (activeTab === 'motifs') {
      setEditingMotif(null)
      setEditingArtist(null)
      setEditingStudio(null)
      setEditingStyle(null)
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingArtist(null)
    setEditingStudio(null)
    setEditingStyle(null)
    setEditingMotif(null)
  }

  const getStudioName = (studioId: string) => {
    if (!studioId) return 'No Studio'
    const studio = studios.find(s => s.id === studioId)
    return studio ? studio.name_en || studio.name_ja : 'Unknown Studio'
  }
  
  // Sorting functions
  const handleSort = (field: keyof Artist | 'studio_name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const getSortIcon = (field: keyof Artist | 'studio_name') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-600" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }
  
  // Sort artists based on current sort settings
  const sortedArtists = [...artists].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    if (sortField === 'studio_name') {
      aValue = getStudioName(a.studio_id || '')
      bValue = getStudioName(b.studio_id || '')
    } else if (sortField === 'created_at') {
      aValue = new Date(a.created_at)
      bValue = new Date(b.created_at)
    } else if (sortField === 'name' || sortField === 'name_en' || sortField === 'name_ja') {
      aValue = (a.name || a.name_en || a.name_ja || '').toLowerCase()
      bValue = (b.name || b.name_en || b.name_ja || '').toLowerCase()
    } else if (sortField === 'location') {
      aValue = (a.location || '').toLowerCase()
      bValue = (b.location || '').toLowerCase()
    } else {
      aValue = a[sortField] || ''
      bValue = b[sortField] || ''
    }
    
    if (sortDirection === 'asc') {
      if (aValue < bValue) return -1
      if (aValue > bValue) return 1
      return 0
    } else {
      if (aValue > bValue) return -1
      if (aValue < bValue) return 1
      return 0
    }
  })
  
  // Studio sorting functions
  const handleStudioSort = (field: keyof Studio | 'artist_count') => {
    if (studioSortField === field) {
      setStudioSortDirection(studioSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setStudioSortField(field)
      setStudioSortDirection('asc')
    }
  }
  
  const getStudioSortIcon = (field: keyof Studio | 'artist_count') => {
    if (studioSortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-600" />
    }
    return studioSortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }
  
  // Sort studios based on current sort settings
  const sortedStudios = [...studios].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    if (studioSortField === 'artist_count') {
      const aArtistCount = artists.filter(artist => artist.studio_id === a.id).length
      const bArtistCount = artists.filter(artist => artist.studio_id === b.id).length
      aValue = aArtistCount
      bValue = bArtistCount
    } else if (studioSortField === 'created_at') {
      aValue = new Date(a.created_at)
      bValue = new Date(b.created_at)
    } else if (studioSortField === 'name_en' || studioSortField === 'name_ja') {
      aValue = (a.name_en || a.name_ja || '').toLowerCase()
      bValue = (b.name_en || b.name_ja || '').toLowerCase()
    } else if (studioSortField === 'location') {
      aValue = (a.location || '').toLowerCase()
      bValue = (b.location || '').toLowerCase()
    } else if (studioSortField === 'view_count') {
      aValue = a.view_count || 0
      bValue = b.view_count || 0
    } else {
      aValue = a[studioSortField] || ''
      bValue = b[studioSortField] || ''
    }
    
    if (studioSortDirection === 'asc') {
      if (aValue < bValue) return -1
      if (aValue > bValue) return 1
      return 0
    } else {
      if (aValue > bValue) return -1
      if (aValue < bValue) return 1
      return 0
    }
  })

  const handleImportArtists = (importedArtists: Artist[]) => {
    setArtists(importedArtists)
    saveArtists(importedArtists)
  }

  // Crawling handlers with server-side API
  const handleStartCrawl = async () => {
    try {
      console.log('🚀 Starting server-side crawl...')
      setCrawlStats(prev => ({ ...prev, crawlStatus: 'running' }))
      
      // サーバーサイドクローリングAPIを呼び出し
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxArtists: 5 // 初回は5人に制限
        })
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Server crawl complete! Artists: ${result.artists.length}`)
        
        // 新しく発見されたアーティストをpending reviewに追加
        const newPendingArtists = result.artists.map((artist: any, index: number) => ({
          ...artist,
          id: `real-${Date.now()}-${index}`,
          confidence_score: Math.floor(Math.random() * 30) + 70,
          discovered_at: new Date().toISOString(),
          source_url: artist.website_url || `https://real-site.com/artist-${index}`
        }))
        
        setPendingArtists(prev => [...prev, ...newPendingArtists])
        
        // 統計を更新
        setCrawlStats(prev => ({
          ...prev,
          crawlStatus: 'idle',
          lastCrawl: new Date().toISOString(),
          crawledArtists: prev.crawledArtists + result.artists.length,
          pendingReview: prev.pendingReview + result.artists.length,
          errors: result.errors || []
        }))
        
        console.log(`📊 Discovered URLs: ${result.discoveredUrls?.length || 0}`)
        console.log(`👥 New artists: ${result.artists.length}`)
        console.log(`❌ Errors: ${result.errors?.length || 0}`)
        
      } else {
        throw new Error(result.error || 'Unknown server error')
      }
      
    } catch (error: any) {
      console.error('❌ Server-side crawl failed:', error)
      setCrawlStats(prev => ({ 
        ...prev, 
        crawlStatus: 'error',
        errors: [{ 
          url: '/api/crawl', 
          error: error.message, 
          timestamp: new Date().toISOString() 
        }]
      }))
    }
  }

  const handleStopCrawl = async () => {
    if (!crawler) return
    
    console.log('Stopping crawl gracefully...')
    await crawler.stopCrawl()
  }

  const handleRunMonthlyCrawl = async () => {
    console.log('Running monthly crawl...')
    // Use the same logic as handleStartCrawl for now
    await handleStartCrawl()
  }

  // Artist review handlers
  const handleApproveArtist = (artistId: string, editedData?: Partial<Artist>) => {
    console.log('Approving artist:', artistId, editedData)
    // Remove from pending and add to artists
    setPendingArtists(prev => prev.filter(a => a.id !== artistId))
    // TODO: Add to main artists list
  }

  const handleRejectArtist = (artistId: string, reason: string) => {
    console.log('Rejecting artist:', artistId, reason)
    // Remove from pending
    setPendingArtists(prev => prev.filter(a => a.id !== artistId))
  }

  const handleBulkApprove = (artistIds: string[]) => {
    console.log('Bulk approving artists:', artistIds)
    // Remove from pending
    setPendingArtists(prev => prev.filter(a => !artistIds.includes(a.id)))
    // TODO: Add to main artists list
  }

  const handleBulkReject = (artistIds: string[], reason: string) => {
    console.log('Bulk rejecting artists:', artistIds, reason)
    // Remove from pending
    setPendingArtists(prev => prev.filter(a => !artistIds.includes(a.id)))
  }

  // Production sync handler using server-side API
  const handleSyncToProduction = async () => {
    try {
      console.log('🚀 Starting production sync via API...')
      
      // Validate artists data before sending
      if (!artists || !Array.isArray(artists)) {
        throw new Error('No artists data available to sync')
      }
      
      if (artists.length === 0) {
        throw new Error('No artists to sync - please add some artists first')
      }
      
      console.log(`📊 Syncing ${artists.length} artists to production...`)
      
      const response = await fetch('/api/sync-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artists: artists.filter(artist => 
            artist && 
            typeof artist === 'object' && 
            (artist.name || artist.name_ja || artist.name_en)
          )
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }))
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format')
      }
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }
      
      const results = data.results
      console.log('📊 Sync Results:', {
        successful: results?.successful || 0,
        deleted: results?.deleted || 0,
        failed: results?.failed || 0,
        errorCount: results?.errors?.length || 0
      })
      
      if (!results) {
        throw new Error('Invalid response format: missing results')
      }
      
      if ((results.failed || 0) === 0) {
        const syncMessage = [
          results.successful > 0 ? `${results.successful} synced` : '',
          results.deleted > 0 ? `${results.deleted} deleted` : ''
        ].filter(Boolean).join(', ')
        
        console.log(`✅ Successfully completed production sync: ${syncMessage}`)
      } else {
        console.warn(`⚠️ Sync completed with errors: ${results.successful} synced, ${results.deleted} deleted, ${results.failed} failed`)
        
        // Safely handle errors array
        if (results.errors && Array.isArray(results.errors) && results.errors.length > 0) {
          console.log('Error details:')
          results.errors.forEach((error: any, index: number) => {
            console.log(`${index + 1}. ${error.artist || 'Unknown'}: ${error.error || 'Unknown error'}`)
          })
          
          // Show detailed error information
          const errorMessage = results.errors
            .map((e: any) => `${e.artist || 'Unknown'}: ${e.error || 'Unknown error'}`)
            .join('\n')
          
          throw new Error(`Some operations failed during sync:\n${errorMessage}`)
        } else {
          throw new Error(`Sync completed with ${results.failed} failed operations, but no error details available`)
        }
      }
      
      return results
    } catch (error: any) {
      console.error('❌ Production sync failed:', JSON.stringify({
        message: error.message,
        stack: error.stack?.split('\n')[0] // Only first line of stack for brevity
      }))
      throw error
    }
  }

  // Database migration handlers
  const checkMigrationStatus = async () => {
    setMigrationStatus(prev => ({ ...prev, checking: true }))
    
    try {
      const response = await fetch('/api/migrate-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      setMigrationStatus({
        checking: false,
        needed: !data.success,
        missingColumns: data.missingColumns || [],
        migrationSQL: data.migrationSQL
      })
      
    } catch (error: any) {
      console.error('Migration check failed:', error)
      setMigrationStatus(prev => ({ ...prev, checking: false }))
    }
  }

  // RLS policy fix handler
  const [rlsFixStatus, setRlsFixStatus] = useState<{
    checking: boolean
    needed: boolean
    fixSQL?: string
  }>({
    checking: false,
    needed: false
  })

  const checkRlsPolicyFix = async () => {
    setRlsFixStatus(prev => ({ ...prev, checking: true }))
    
    try {
      const response = await fetch('/api/fix-rls-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      setRlsFixStatus({
        checking: false,
        needed: !data.success,
        fixSQL: data.fixRlsSQL
      })
      
    } catch (error: any) {
      console.error('RLS policy check failed:', error)
      setRlsFixStatus(prev => ({ ...prev, checking: false }))
    }
  }

  // Check migration status on load if using Supabase
  useEffect(() => {
    if (isSupabaseConfigured) {
      checkMigrationStatus()
    }
  }, [])

  // Production sync handler for studios
  const handleSyncStudiosToProduction = async () => {
    try {
      console.log('🚀 Starting studio production sync via API...')
      
      // Validate studios data before sending
      if (!studios || !Array.isArray(studios)) {
        throw new Error('No studios data available to sync')
      }
      
      if (studios.length === 0) {
        throw new Error('No studios to sync - please add some studios first')
      }
      
      console.log(`📊 Syncing ${studios.length} studios to production...`)
      
      const response = await fetch('/api/sync-studios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studios: studios.filter(studio => 
            studio && 
            typeof studio === 'object' && 
            (studio.name_ja || studio.name_en)
          )
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }))
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format')
      }
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }
      
      const results = data.results
      console.log('📊 Studio Sync Results:', {
        successful: results?.successful || 0,
        failed: results?.failed || 0,
        errorCount: results?.errors?.length || 0
      })
      
      if ((results.failed || 0) === 0) {
        console.log(`✅ Successfully synced ${results.successful} studios to production`)
      } else {
        console.warn(`⚠️ Studio sync completed with errors: ${results.successful} successful, ${results.failed} failed`)
        
        if (results.errors && Array.isArray(results.errors) && results.errors.length > 0) {
          console.log('Error details:')
          results.errors.forEach((error: any, index: number) => {
            console.log(`${index + 1}. ${error.studio || 'Unknown'}: ${error.error || 'Unknown error'}`)
          })
          
          const errorMessage = results.errors
            .map((e: any) => `${e.studio || 'Unknown'}: ${e.error || 'Unknown error'}`)
            .join('\n')
          
          throw new Error(`Some operations failed during sync:\n${errorMessage}`)
        } else {
          throw new Error(`Sync completed with ${results.failed} failed operations, but no error details available`)
        }
      }
      
      return results
    } catch (error: any) {
      console.error('❌ Studio production sync failed:', JSON.stringify({
        message: error.message,
        stack: error.stack?.split('\n')[0]
      }))
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          {(activeTab === 'artists' || activeTab === 'studios' || activeTab === 'styles' || activeTab === 'motifs') && (
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          {(activeTab === 'artists' || activeTab === 'studios' || activeTab === 'styles' || activeTab === 'motifs') && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New {activeTab === 'artists' ? 'Artist' : activeTab === 'studios' ? 'Studio' : activeTab === 'styles' ? 'Style' : 'デザイン'}
            </button>
          )}
        </div>

        {/* Desktop Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('artists')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'artists'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Artists ({artists.length})
          </button>
          <button
            onClick={() => setActiveTab('studios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'studios'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Studios ({studios.length})
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'styles'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Styles ({styles.length})
          </button>
          <button
            onClick={() => setActiveTab('motifs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'motifs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            モチーフ ({motifs.length})
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'design'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            デザインシステム
          </button>
          <button
            onClick={() => setActiveTab('crawling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'crawling'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Crawling
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'review'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Review ({pendingArtists.length})
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'deploy'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Deploy
          </button>
        </div>

        {/* Desktop Content Area */}
        <div className="space-y-6">
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              {activeTab === 'artists' ? (
                <ArtistForm
                  artist={editingArtist}
                  studios={studios}
                  onSave={handleSaveArtist}
                  onCancel={handleCloseForm}
                />
              ) : activeTab === 'studios' ? (
                <StudioForm
                  studio={editingStudio}
                  onSave={handleSaveStudio}
                  onCancel={handleCloseForm}
                />
              ) : activeTab === 'styles' ? (
                <StyleForm
                  style={editingStyle}
                  onSave={handleSaveStyle}
                  onCancel={handleCloseForm}
                />
              ) : (
                <MotifForm
                  motif={editingMotif}
                  onSave={handleSaveMotif}
                  onCancel={handleCloseForm}
                />
              )}
            </div>
          </div>
        )}

        {previewArtist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <ArtistPreview
                artist={previewArtist}
                onClose={() => setPreviewArtist(null)}
              />
            </div>
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === 'artists' && (
          <div className="bg-white rounded-lg shadow">
            {/* Desktop Header */}
            <div className="hidden lg:block p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Artists ({artists.length})
              </h2>
            </div>
            
            {/* Mobile Header */}
            <div className="lg:hidden p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Artists ({artists.length})
              </h2>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Artist
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('studio_name')}
                    >
                      <div className="flex items-center gap-1">
                        Studio
                        {getSortIcon('studio_name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Styles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Instagram
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Added Date
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedArtists.map((artist) => (
                    <tr key={artist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {artist.name || artist.name_en || 'No name'}
                          </div>
                          <div className="text-sm text-gray-700">
                            {artist.location || artist.name_ja || 'No location'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getStudioName(artist.studio_id)}
                      </td>
                      <td className="px-4 py-4 w-32">
                        <div className="space-y-1">
                          {(artist.style_ids || []).slice(0, 2).map((styleId, index) => {
                            const style = styles.find(s => s.id === styleId)
                            const styleName = style ? style.style_name_ja : `Style ${styleId}`
                            return (
                              <div key={index} className="w-full">
                                <span className="inline-block w-full px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 text-center truncate">
                                  {styleName}
                                </span>
                              </div>
                            )
                          })}
                          {(artist.style_ids || []).length > 2 && (
                            <div className="text-xs text-gray-700 text-center">
                              +{(artist.style_ids || []).length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {(artist.instagram_posts || artist.images || [])
                            .filter(img => img && img.trim() !== '')
                            .slice(0, 3)
                            .map((imgUrl, index) => (
                            <div 
                              key={index}
                              className="w-32 h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded overflow-hidden border border-gray-300"
                            >
                              <div className="w-full h-full overflow-hidden" style={{ transform: 'scale(1.2)' }}>
                                <InstagramEmbed 
                                  postUrl={imgUrl}
                                  className="w-full h-full"
                                  compact={true}
                                />
                              </div>
                            </div>
                          ))}
                          {(artist.instagram_posts || artist.images || []).filter(img => img && img.trim() !== '').length > 3 && (
                            <div className="flex items-center text-xs text-gray-700 ml-1">
                              +{(artist.instagram_posts || artist.images || []).filter(img => img && img.trim() !== '').length - 3}
                            </div>
                          )}
                          {(artist.instagram_posts || artist.images || []).filter(img => img && img.trim() !== '').length === 0 && (
                            <div className="text-xs text-gray-600">No images</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {artist.instagram_handle}
                        </div>
                        {artist.instagram_follower_count && (
                          <div className="text-xs text-gray-700">
                            {artist.instagram_follower_count >= 1000 
                              ? `${(artist.instagram_follower_count / 1000).toFixed(1)}K followers`
                              : `${artist.instagram_follower_count.toLocaleString()} followers`
                            }
                          </div>
                        )}
                        {artist.view_count > 0 && (
                          <div className="text-xs text-gray-600">
                            {artist.view_count.toLocaleString()} views
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(artist.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-700">
                          {new Date(artist.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewArtist(artist)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditArtist(artist)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArtist(artist.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {sortedArtists.map((artist) => (
                <div key={artist.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900">
                        {artist.name || artist.name_en || 'No name'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {artist.location || artist.name_ja || 'No location'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getStudioName(artist.studio_id)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => setPreviewArtist(artist)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditArtist(artist)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArtist(artist.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Styles */}
                  {(artist.style_ids || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(artist.style_ids || []).slice(0, 3).map((styleId, index) => {
                        const style = styles.find(s => s.id === styleId)
                        const styleName = style ? style.style_name_ja : `Style ${styleId}`
                        return (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {styleName}
                          </span>
                        )
                      })}
                      {(artist.style_ids || []).length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{(artist.style_ids || []).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Images */}
                  {(artist.instagram_posts || artist.images || []).filter(img => img && img.trim() !== '').length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {(artist.instagram_posts || artist.images || [])
                        .filter(img => img && img.trim() !== '')
                        .slice(0, 3)
                        .map((imgUrl, index) => (
                        <div 
                          key={index}
                          className="w-16 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded flex-shrink-0 border border-gray-300 overflow-hidden"
                        >
                          <InstagramEmbed 
                            postUrl={imgUrl}
                            className="w-full h-full object-cover"
                            compact={true}
                          />
                        </div>
                      ))}
                      {(artist.instagram_posts || artist.images || []).filter(img => img && img.trim() !== '').length > 3 && (
                        <div className="w-16 h-20 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            +{(artist.instagram_posts || artist.images || []).filter(img => img && img.trim() !== '').length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Instagram Handle */}
                  {artist.instagram_handle && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">Instagram: </span>
                      <a 
                        href={`https://instagram.com/${artist.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        @{artist.instagram_handle.replace('@', '')}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Studios Tab */}
        {activeTab === 'studios' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Studios ({studios.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleStudioSort('name_en')}
                    >
                      <div className="flex items-center gap-1">
                        Studio
                        {getStudioSortIcon('name_en')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleStudioSort('location')}
                    >
                      <div className="flex items-center gap-1">
                        Location
                        {getStudioSortIcon('location')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleStudioSort('artist_count')}
                    >
                      <div className="flex items-center gap-1">
                        Artists
                        {getStudioSortIcon('artist_count')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleStudioSort('view_count')}
                    >
                      <div className="flex items-center gap-1">
                        Views
                        {getStudioSortIcon('view_count')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleStudioSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Added Date
                        {getStudioSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStudios.map((studio) => {
                    const studioArtists = artists.filter(artist => artist.studio_id === studio.id)
                    return (
                      <tr key={studio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {studio.name_en}
                            </div>
                            <div className="text-sm text-gray-700">
                              {studio.name_ja}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {studio.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {studioArtists.length} artist{studioArtists.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {studio.view_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(studio.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-700">
                            {new Date(studio.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditStudio(studio)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudio(studio.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Styles Tab */}
        {activeTab === 'styles' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Styles ({styles.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Japanese Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      English Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {styles.map((style) => (
                    <tr key={style.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{style.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {style.style_name_ja}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {style.style_name_en}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(style.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-700">
                          {new Date(style.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditStyle(style)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStyle(style.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Motifs Tab */}
        {activeTab === 'motifs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                デザイン ({motifs.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Japanese Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      English Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {motifs.map((motif) => (
                    <tr key={motif.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{motif.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {motif.motif_name_ja}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {motif.motif_name_en}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(motif.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-700">
                          {new Date(motif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditMotif(motif)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMotif(motif.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Design System Tab */}
        {activeTab === 'design' && (
          <DesignSystemManager />
        )}

        {/* Crawling Tab */}
        {activeTab === 'crawling' && (
          <CrawlDashboard
            stats={crawlStats}
            currentProgress={currentProgress}
            onStartCrawl={handleStartCrawl}
            onStopCrawl={handleStopCrawl}
            onRunMonthlyCrawl={handleRunMonthlyCrawl}
          />
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <ArtistReview
            pendingArtists={pendingArtists}
            onApprove={handleApproveArtist}
            onReject={handleRejectArtist}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
          />
        )}

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <>
            {/* Database Migration Status */}
            {isSupabaseConfigured && (
              <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Schema Status</h3>
                
                {migrationStatus.checking ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Checking database schema...</span>
                  </div>
                ) : migrationStatus.needed ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className="font-bold text-red-800 text-lg">⚠️ CRITICAL: Database migration required</p>
                        <p className="text-sm text-red-700 font-medium">
                          Artist creation/editing will fail until this is resolved!
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          Missing columns: {migrationStatus.missingColumns.join(', ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Migration Instructions:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 mb-4">
                        <li>Go to your Supabase project dashboard</li>
                        <li>Navigate to SQL Editor</li>
                        <li>Copy and paste the SQL below</li>
                        <li>Click "Run" to execute the migration</li>
                        <li>Refresh this page to verify the migration</li>
                      </ol>
                      
                      {migrationStatus.migrationSQL && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Migration SQL:
                          </label>
                          <textarea
                            readOnly
                            value={migrationStatus.migrationSQL}
                            className="w-full h-32 p-3 font-mono text-xs bg-white border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(migrationStatus.migrationSQL || '')}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Copy SQL
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={checkMigrationStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Recheck Schema
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-green-800">Database schema is up to date</p>
                      <p className="text-sm text-green-700">All required columns are present.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RLS Policy Fix Section */}
            {isSupabaseConfigured && (
              <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Row Level Security (RLS) Policy Fix</h3>
                
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ If you're getting "violates row-level security policy" errors:</strong>
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Click the button below to get SQL that fixes the RLS policies to allow public access.
                  </p>
                </div>

                <button
                  onClick={checkRlsPolicyFix}
                  disabled={rlsFixStatus.checking}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 mb-4"
                >
                  {rlsFixStatus.checking ? 'Generating...' : 'Get RLS Policy Fix SQL'}
                </button>

                {rlsFixStatus.needed && rlsFixStatus.fixSQL && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">RLS Policy Fix SQL:</p>
                    <p className="text-sm text-gray-700 mb-3">
                      Execute this in your Supabase SQL Editor to fix permissions:
                    </p>
                    
                    <textarea
                      readOnly
                      value={rlsFixStatus.fixSQL}
                      className="w-full h-40 p-3 font-mono text-xs bg-white border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(rlsFixStatus.fixSQL || '')}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Copy SQL
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <DeploymentDashboard
              localArtists={artists}
              localStudios={studios}
              onSyncToProduction={handleSyncToProduction}
              onSyncStudiosToProduction={handleSyncStudiosToProduction}
            />
          </>
        )}

        {activeTab === 'artists' && (
          <div className="mt-8">
            <DataManager 
              artists={artists}
              onImportArtists={handleImportArtists}
            />
          </div>
        )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('artists')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              activeTab === 'artists'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Artists</span>
          </button>
          <button
            onClick={() => setActiveTab('studios')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              activeTab === 'studios'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs">Studios</span>
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              activeTab === 'styles'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-xs">Styles</span>
          </button>
          <button
            onClick={() => setActiveTab('motifs')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              activeTab === 'motifs'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">デザイン</span>
          </button>
          <button
            onClick={() => setActiveTab('crawling')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              activeTab === 'crawling'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs">Crawling</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              activeTab === 'review'
                ? 'text-blue-600 relative'
                : 'text-gray-500'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">Review</span>
            {pendingArtists.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingArtists.length}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Main Content Area */}
      <div className="lg:hidden p-4">
        {/* All content from artists tab onwards will be duplicated here for mobile */}
      </div>
    </div>
  )
}