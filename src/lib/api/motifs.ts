import { supabase, isSupabaseConfigured } from '../supabase'
import { Motif } from '@/types/database'

// Helper to simulate async behavior for mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data for local development
const mockMotifs: Motif[] = [
  { id: 1, motif_name_ja: '龍', motif_name_en: 'Dragon', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 2, motif_name_ja: '虎', motif_name_en: 'Tiger', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 3, motif_name_ja: '鯉', motif_name_en: 'Koi', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 4, motif_name_ja: '桜', motif_name_en: 'Cherry Blossom', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 5, motif_name_ja: '菊', motif_name_en: 'Chrysanthemum', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 6, motif_name_ja: '牡丹', motif_name_en: 'Peony', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 7, motif_name_ja: '蓮', motif_name_en: 'Lotus', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 8, motif_name_ja: '鳳凰', motif_name_en: 'Phoenix', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 9, motif_name_ja: '般若', motif_name_en: 'Hannya', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 10, motif_name_ja: '髑髏', motif_name_en: 'Skull', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 11, motif_name_ja: '蛇', motif_name_en: 'Snake', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 12, motif_name_ja: '鷹', motif_name_en: 'Eagle', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 13, motif_name_ja: '狼', motif_name_en: 'Wolf', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 14, motif_name_ja: '獅子', motif_name_en: 'Lion', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 15, motif_name_ja: '薔薇', motif_name_en: 'Rose', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 16, motif_name_ja: '蝶', motif_name_en: 'Butterfly', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 17, motif_name_ja: '観音', motif_name_en: 'Kannon', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 18, motif_name_ja: '不動明王', motif_name_en: 'Fudo Myoo', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 19, motif_name_ja: '鬼', motif_name_en: 'Oni', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 20, motif_name_ja: '侍', motif_name_en: 'Samurai', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
]

// Motif API functions
export async function fetchMotifs(forceRefresh = false): Promise<Motif[]> {
  if (!isSupabaseConfigured) {
    await delay(200)
    const storedMotifs = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
      : []
    return storedMotifs.length > 0 ? storedMotifs : mockMotifs
  }

  // Check if we have locally stored motifs first (in case of RLS fallback)
  if (!forceRefresh && typeof window !== 'undefined') {
    const storedMotifs = JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
    if (storedMotifs.length > 0) {
      console.log('Using locally stored motifs due to previous RLS fallback')
      return storedMotifs
    }
  }

  try {
    const { data, error } = await supabase!
      .from('motifs')
      .select('*')
      .order('motif_name_ja')
    
    if (error) {
      console.error('Error fetching motifs:', error.message || error)
      
      // If the table doesn't exist (42P01 error) or relation doesn't exist, use mock data
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Motifs table does not exist, using mock data')
        return mockMotifs
      }
      
      // If there's an error, try to use locally stored motifs or fall back to mock data
      if (typeof window !== 'undefined') {
        const storedMotifs = JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
        if (storedMotifs.length > 0) {
          return storedMotifs
        }
      }
      return mockMotifs
    }
    
    return data as Motif[]
  } catch (error: any) {
    console.error('Unexpected error fetching motifs:', error)
    
    // If the table doesn't exist, use mock data
    if (error.message?.includes('does not exist')) {
      console.log('Motifs table does not exist (caught in catch), using mock data')
      return mockMotifs
    }
    
    // Fall back to localStorage or mock data
    if (typeof window !== 'undefined') {
      const storedMotifs = JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
      if (storedMotifs.length > 0) {
        return storedMotifs
      }
    }
    return mockMotifs
  }
}

export async function fetchMotifById(id: number): Promise<Motif | null> {
  if (!isSupabaseConfigured) {
    await delay(100)
    const storedMotifs = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
      : []
    const allMotifs = storedMotifs.length > 0 ? storedMotifs : mockMotifs
    return allMotifs.find((motif: Motif) => motif.id === id) || null
  }

  try {
    const { data, error } = await supabase!
      .from('motifs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching motif:', error)
      return mockMotifs.find((m: Motif) => m.id === id) || null
    }
    
    return data as Motif
  } catch (error) {
    console.error('Unexpected error fetching motif by ID:', error)
    return mockMotifs.find((m: Motif) => m.id === id) || null
  }
}

export async function createMotif(motifData: Omit<Motif, 'id' | 'created_at' | 'updated_at'>): Promise<Motif | null> {
  if (!isSupabaseConfigured) {
    // Local mode - store in localStorage
    const storedMotifs = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
      : []
    const allMotifs = storedMotifs.length > 0 ? storedMotifs : [...mockMotifs]
    
    const newMotif: Motif = {
      ...motifData,
      id: Math.max(...allMotifs.map((m: Motif) => m.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const updatedMotifs = [...allMotifs, newMotif]
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-motifs-table', JSON.stringify(updatedMotifs))
    }
    
    return newMotif
  }

  try {
    const { data, error } = await supabase!
      .from('motifs')
      .insert(motifData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating motif:', error)
      throw new Error(error.message || 'Failed to create motif')
    }
    
    return data as Motif
  } catch (error: any) {
    console.error('Unexpected error creating motif:', error)
    throw error
  }
}

export async function updateMotif(id: number, motifData: Partial<Omit<Motif, 'id' | 'created_at' | 'updated_at'>>): Promise<Motif | null> {
  if (!isSupabaseConfigured) {
    // Local mode - update in localStorage
    const storedMotifs = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
      : []
    const allMotifs = storedMotifs.length > 0 ? storedMotifs : [...mockMotifs]
    
    const motifIndex = allMotifs.findIndex((m: Motif) => m.id === id)
    if (motifIndex === -1) return null
    
    const updatedMotif = { 
      ...allMotifs[motifIndex], 
      ...motifData,
      updated_at: new Date().toISOString()
    }
    allMotifs[motifIndex] = updatedMotif
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-motifs-table', JSON.stringify(allMotifs))
    }
    
    return updatedMotif
  }

  try {
    const { data, error } = await supabase!
      .from('motifs')
      .update(motifData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating motif:', error)
      throw new Error(error.message || 'Failed to update motif')
    }
    
    return data as Motif
  } catch (error: any) {
    console.error('Unexpected error updating motif:', error)
    throw error
  }
}

export async function deleteMotif(id: number): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Local mode - remove from localStorage
    const storedMotifs = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-motifs-table') || '[]')
      : []
    const allMotifs = storedMotifs.length > 0 ? storedMotifs : [...mockMotifs]
    
    const filteredMotifs = allMotifs.filter((m: Motif) => m.id !== id)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-motifs-table', JSON.stringify(filteredMotifs))
    }
    
    return true
  }

  try {
    const { error } = await supabase!
      .from('motifs')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting motif:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Unexpected error deleting motif:', error)
    return false
  }
}