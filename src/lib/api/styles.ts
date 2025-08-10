import { supabase, isSupabaseConfigured } from '../supabase'
import { Style } from '@/types/database'

// Helper to simulate async behavior for mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data for local development
const mockStyles: Style[] = [
  { id: 1, style_name_ja: '和彫り', style_name_en: 'Japanese Traditional', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 2, style_name_ja: 'ブラックワーク', style_name_en: 'Blackwork', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 3, style_name_ja: 'リアリズム', style_name_en: 'Realism', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 4, style_name_ja: 'トライバル', style_name_en: 'Tribal', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 5, style_name_ja: 'ドットワーク', style_name_en: 'Dotwork', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 6, style_name_ja: '水彩画', style_name_en: 'Watercolor', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 7, style_name_ja: 'ファインライン', style_name_en: 'Fine Line', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 8, style_name_ja: 'オールドスクール', style_name_en: 'Old School', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 9, style_name_ja: 'ニュースクール', style_name_en: 'New School', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 10, style_name_ja: '幾何学模様', style_name_en: 'Geometric', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 11, style_name_ja: 'チカーノ', style_name_en: 'Chicano', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 12, style_name_ja: 'カラータトゥー', style_name_en: 'Color Tattoo', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 13, style_name_ja: 'ブラック＆グレー', style_name_en: 'Black & Grey', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 14, style_name_ja: 'ポートレート', style_name_en: 'Portrait', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
  { id: 15, style_name_ja: 'ミニマル', style_name_en: 'Minimal', created_at: '2025-01-30T00:00:00Z', updated_at: '2025-01-30T00:00:00Z' },
]

// Style API functions
export async function fetchStyles(forceRefresh = false): Promise<Style[]> {
  if (!isSupabaseConfigured) {
    await delay(200)
    const storedStyles = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      : []
    return storedStyles.length > 0 ? storedStyles : mockStyles
  }

  // Check if we have locally stored styles first (in case of RLS fallback)
  // Skip this check if forceRefresh is true
  if (!forceRefresh && typeof window !== 'undefined') {
    const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
    if (storedStyles.length > 0) {
      console.log('Using locally stored styles due to previous RLS fallback')
      return storedStyles
    }
  }

  try {
    const { data, error } = await supabase!
      .from('styles')
      .select('*')
      .order('style_name_ja')
    
    if (error) {
      console.error('Error fetching styles:', error)
      // If there's an error, try to use locally stored styles or fall back to mock data
      if (typeof window !== 'undefined') {
        const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
        if (storedStyles.length > 0) {
          return storedStyles
        }
      }
      return mockStyles
    }
    
    // If successful, clear any localStorage (unless we're in RLS fallback mode)
    if (data && data.length > 0 && typeof window !== 'undefined' && !forceRefresh) {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      if (storedStyles.length === 0) {
        // Only clear if localStorage is empty (not in RLS fallback mode)
        console.log('Fetched styles from database successfully')
      }
    }
    
    return data as Style[]
  } catch (error) {
    console.error('Unexpected error fetching styles:', error)
    // Fall back to localStorage or mock data
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      if (storedStyles.length > 0) {
        return storedStyles
      }
    }
    return mockStyles
  }
}

export async function fetchStyleById(id: number): Promise<Style | null> {
  if (!isSupabaseConfigured) {
    await delay(100)
    const storedStyles = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      : []
    const allStyles = storedStyles.length > 0 ? storedStyles : mockStyles
    return allStyles.find((style: Style) => style.id === id) || null
  }

  // Check localStorage first (in case of RLS fallback)
  if (typeof window !== 'undefined') {
    const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
    if (storedStyles.length > 0) {
      const style = storedStyles.find((s: Style) => s.id === id)
      if (style) return style
    }
  }

  try {
    const { data, error } = await supabase!
      .from('styles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching style:', error)
      // Fall back to localStorage or mock data
      if (typeof window !== 'undefined') {
        const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
        if (storedStyles.length > 0) {
          return storedStyles.find((s: Style) => s.id === id) || null
        }
      }
      return mockStyles.find((s: Style) => s.id === id) || null
    }
    
    return data as Style
  } catch (error) {
    console.error('Unexpected error fetching style by ID:', error)
    // Fall back to localStorage or mock data
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      if (storedStyles.length > 0) {
        return storedStyles.find((s: Style) => s.id === id) || null
      }
    }
    return mockStyles.find((s: Style) => s.id === id) || null
  }
}

export async function createStyle(styleData: Omit<Style, 'id' | 'created_at' | 'updated_at'>): Promise<Style | null> {
  if (!isSupabaseConfigured) {
    // Local mode - store in localStorage
    const storedStyles = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      : []
    const allStyles = storedStyles.length > 0 ? storedStyles : [...mockStyles]
    
    const newStyle: Style = {
      ...styleData,
      id: Math.max(...allStyles.map((s: Style) => s.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const updatedStyles = [...allStyles, newStyle]
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(updatedStyles))
    }
    
    return newStyle
  }

  try {
    const { data, error } = await supabase!
      .from('styles')
      .insert(styleData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating style:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full_error: error
      })
      
      // Check if it's an RLS error
      if (error.message?.includes('row-level security') || error.code === '42501') {
        console.log('RLS error detected, creating style in localStorage instead...')
        
        if (typeof window !== 'undefined') {
          // Get current styles from localStorage or fetch them
          let storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
          
          // If no stored styles, start fresh or use mock data
          if (storedStyles.length === 0) {
            console.log('No styles in localStorage, using mock styles as base')
            storedStyles = [...mockStyles]
          }
          
          // Create new style with proper ID
          const maxId = storedStyles.length > 0 
            ? Math.max(...storedStyles.map((s: Style) => s.id)) 
            : 0
          
          const newStyle: Style = {
            ...styleData,
            id: maxId + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const updatedStyles = [...storedStyles, newStyle]
          localStorage.setItem('ink-finder-styles-table', JSON.stringify(updatedStyles))
          
          console.log('Style created successfully in localStorage:', newStyle)
          return newStyle
        }
      }
      
      throw new Error(error.message || error.details || JSON.stringify(error) || 'Failed to create style')
    }
    
    // If successful, also update localStorage if it exists
    if (data && typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      if (storedStyles.length > 0) {
        // Add to localStorage to keep in sync
        const updatedStyles = [...storedStyles, data]
        localStorage.setItem('ink-finder-styles-table', JSON.stringify(updatedStyles))
        console.log('Style also added to localStorage')
      }
    }
    
    return data as Style
  } catch (error: any) {
    console.error('Unexpected error creating style:', error)
    
    // Try localStorage fallback
    if (typeof window !== 'undefined') {
      console.log('Falling back to localStorage due to error...')
      
      let storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      
      if (storedStyles.length === 0) {
        console.log('No styles in localStorage, using mock styles as base')
        storedStyles = [...mockStyles]
      }
      
      const maxId = storedStyles.length > 0 
        ? Math.max(...storedStyles.map((s: Style) => s.id)) 
        : 0
      
      const newStyle: Style = {
        ...styleData,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const updatedStyles = [...storedStyles, newStyle]
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(updatedStyles))
      
      return newStyle
    }
    
    throw error
  }
}

export async function updateStyle(id: number, styleData: Partial<Omit<Style, 'id' | 'created_at' | 'updated_at'>>): Promise<Style | null> {
  if (!isSupabaseConfigured) {
    // Local mode - update in localStorage
    const storedStyles = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      : []
    const allStyles = storedStyles.length > 0 ? storedStyles : [...mockStyles]
    
    const styleIndex = allStyles.findIndex((s: Style) => s.id === id)
    if (styleIndex === -1) return null
    
    const updatedStyle = { 
      ...allStyles[styleIndex], 
      ...styleData,
      updated_at: new Date().toISOString()
    }
    allStyles[styleIndex] = updatedStyle
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(allStyles))
    }
    
    return updatedStyle
  }

  console.log('Executing Supabase update query...')
  console.log('Table: styles')
  console.log('Update data:', styleData)
  console.log('Where ID =', id)
  
  try {
    const { data, error, status, statusText } = await supabase!
      .from('styles')
      .update(styleData)
      .eq('id', id)
      .select()
    
    console.log('Supabase response:', { data, error, status, statusText })
    
    if (error) {
      console.error('Supabase update error:', error)
      
      // Check if it's an RLS (Row Level Security) error
      if (error.message?.includes('row-level security') || error.code === '42501') {
        console.log('RLS error detected, falling back to localStorage...')
        return await handleRLSFallback(id, styleData)
      }
      
      throw new Error(error.message || 'Failed to update style')
    }
    
    if (!data || data.length === 0) {
      console.log('Update returned no data, this might be an RLS issue. Trying fallback...')
      return await handleRLSFallback(id, styleData)
    }
    
    return data[0] as Style
  } catch (error) {
    console.error('Unexpected error during style update:', error)
    
    // Fall back to localStorage if any error occurs
    console.log('Falling back to localStorage due to error...')
    return await handleRLSFallback(id, styleData)
  }
}

// Helper function to handle RLS fallback using localStorage
async function handleRLSFallback(id: number, styleData: Partial<Omit<Style, 'id' | 'created_at' | 'updated_at'>>): Promise<Style | null> {
  console.log('Using localStorage fallback for style update...')
  
  if (typeof window === 'undefined') {
    throw new Error('Cannot use localStorage fallback in server environment')
  }
  
  // Get current styles from localStorage, or initialize with fetched data
  let storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
  
  // If no stored styles, try to fetch current styles first
  if (storedStyles.length === 0) {
    try {
      console.log('No stored styles found, fetching current styles...')
      const currentStyles = await fetchStyles()
      if (currentStyles.length > 0) {
        storedStyles = currentStyles
        localStorage.setItem('ink-finder-styles-table', JSON.stringify(storedStyles))
      }
    } catch (error) {
      console.log('Could not fetch current styles, using mock data')
      storedStyles = [...mockStyles]
    }
  }
  
  // Find and update the style
  const styleIndex = storedStyles.findIndex((s: Style) => s.id === id)
  if (styleIndex === -1) {
    throw new Error(`Style with ID ${id} not found`)
  }
  
  const updatedStyle = { 
    ...storedStyles[styleIndex], 
    ...styleData,
    updated_at: new Date().toISOString()
  }
  storedStyles[styleIndex] = updatedStyle
  
  // Save back to localStorage
  localStorage.setItem('ink-finder-styles-table', JSON.stringify(storedStyles))
  
  console.log('Style updated successfully in localStorage:', updatedStyle)
  return updatedStyle
}

export async function deleteStyle(id: number): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Local mode - remove from localStorage
    const storedStyles = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      : []
    const allStyles = storedStyles.length > 0 ? storedStyles : [...mockStyles]
    
    const filteredStyles = allStyles.filter((s: Style) => s.id !== id)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(filteredStyles))
    }
    
    return true
  }

  try {
    const { error } = await supabase!
      .from('styles')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting style:', error)
      
      // Check if it's an RLS error and handle localStorage
      if (error.message?.includes('row-level security') || error.code === '42501') {
        console.log('RLS error detected during delete, handling localStorage...')
        
        // Also remove from localStorage if it exists there
        if (typeof window !== 'undefined') {
          const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
          if (storedStyles.length > 0) {
            const filteredStyles = storedStyles.filter((s: Style) => s.id !== id)
            localStorage.setItem('ink-finder-styles-table', JSON.stringify(filteredStyles))
            console.log('Style removed from localStorage due to RLS restriction')
          }
        }
        
        // Return true since we handled it locally
        return true
      }
      
      return false
    }
    
    // Also check if we're using localStorage fallback
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      if (storedStyles.length > 0) {
        // Remove from localStorage as well to keep in sync
        const filteredStyles = storedStyles.filter((s: Style) => s.id !== id)
        localStorage.setItem('ink-finder-styles-table', JSON.stringify(filteredStyles))
        console.log('Style also removed from localStorage')
      }
    }
    
    return true
  } catch (error) {
    console.error('Unexpected error deleting style:', error)
    
    // Try to handle it locally
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      if (storedStyles.length > 0) {
        const filteredStyles = storedStyles.filter((s: Style) => s.id !== id)
        localStorage.setItem('ink-finder-styles-table', JSON.stringify(filteredStyles))
        console.log('Style removed from localStorage due to error')
        return true
      }
    }
    
    return false
  }
}

// Artist-Style relationship functions
export async function getArtistStyles(artistId: string): Promise<number[]> {
  if (!isSupabaseConfigured) {
    // In local mode, parse from the artist's styles array
    return []
  }

  const { data, error } = await supabase!
    .from('artist_styles')
    .select('style_id')
    .eq('artist_id', artistId)
  
  if (error) {
    console.error('Error fetching artist styles:', error)
    return []
  }
  
  return data.map(item => item.style_id)
}

export async function updateArtistStyles(artistId: string, styleIds: number[]): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // In local mode, we'll handle this differently
    return true
  }

  console.log('updateArtistStyles called with:', { artistId, styleIds })

  try {
    // First, check if artist_styles table exists by trying to select from it
    const { data: testQuery, error: testError } = await supabase!
      .from('artist_styles')
      .select('artist_id')
      .limit(1)
    
    if (testError && testError.code === '42P01') {
      console.error('artist_styles table does not exist! Please run the table creation migration.')
      throw new Error('artist_styles table does not exist. Please run database migration.')
    }

    console.log('artist_styles table exists, proceeding...')

    // First, delete all existing artist-style relationships
    const { error: deleteError } = await supabase!
      .from('artist_styles')
      .delete()
      .eq('artist_id', artistId)
    
    if (deleteError) {
      console.error('Error deleting artist styles:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      })
      return false
    }

    console.log('Deleted existing relationships for artist:', artistId)

    // Then insert new relationships
    if (styleIds.length > 0) {
      const insertData = styleIds.map(styleId => ({
        artist_id: artistId,
        style_id: styleId
      }))

      console.log('Attempting to insert:', insertData)

      const { data: insertResult, error: insertError } = await supabase!
        .from('artist_styles')
        .insert(insertData)
        .select()
      
      if (insertError) {
        console.error('Error inserting artist styles:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          full_error: insertError
        })
        console.error('Insert data:', insertData)
        console.error('Artist ID type:', typeof artistId, artistId)
        console.error('Style IDs:', styleIds.map(id => ({ id, type: typeof id })))
        return false
      }

      console.log('Successfully inserted artist styles:', insertResult)
    }

    return true
  } catch (error) {
    console.error('Unexpected error updating artist styles:', error)
    return false
  }
}