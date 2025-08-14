import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Style } from '@/types/database'

// Mock styles for fallback when Supabase is not configured
const mockStyles: Style[] = [
  {
    id: 1,
    style_name_ja: '和彫り',
    style_name_en: 'Japanese Traditional',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    style_name_ja: 'アメリカントラディショナル',
    style_name_en: 'American Traditional',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    style_name_ja: 'リアリスティック',
    style_name_en: 'Realistic',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    style_name_ja: 'ブラック＆グレー',
    style_name_en: 'Black & Grey',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    style_name_ja: 'ニュースクール',
    style_name_en: 'New School',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    style_name_ja: 'トライバル',
    style_name_en: 'Tribal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 7,
    style_name_ja: 'ウォーターカラー',
    style_name_en: 'Watercolor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 8,
    style_name_ja: 'ジオメトリック',
    style_name_en: 'Geometric',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 9,
    style_name_ja: 'ドットワーク',
    style_name_en: 'Dotwork',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 10,
    style_name_ja: 'ミニマル',
    style_name_en: 'Minimal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export async function fetchStyles(): Promise<Style[]> {
  // First try API route (with service role key)
  try {
    const response = await fetch('/api/styles')
    if (response.ok) {
      const data = await response.json()
      console.log('Fetched styles from API:', data.length)
      return data
    }
  } catch (error) {
    console.error('Error fetching styles from API:', error)
  }

  // Fallback to direct Supabase query (for read operations, RLS typically allows SELECT)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .order('id', { ascending: true })
      
      if (!error && data) {
        console.log('Fetched styles from Supabase:', data.length)
        return data
      }
    } catch (error) {
      console.error('Error fetching styles from Supabase:', error)
    }
  }

  // Final fallback to localStorage or mock data
  if (typeof window !== 'undefined') {
    const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
    if (storedStyles.length > 0) {
      console.log('Using styles from localStorage:', storedStyles.length)
      return storedStyles
    }
  }
  
  console.log('Using mock styles')
  return mockStyles
}

export async function fetchStyleById(id: number): Promise<Style | null> {
  // Try API route first
  try {
    const response = await fetch('/api/styles')
    if (response.ok) {
      const styles = await response.json()
      return styles.find((s: Style) => s.id === id) || null
    }
  } catch (error) {
    console.error('Error fetching style from API:', error)
  }

  // Fallback to direct Supabase query
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('styles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (data) {
        return data
      }
    } catch (error) {
      console.error('Error fetching style from Supabase:', error)
    }
  }

  // Fallback to localStorage or mock data
  if (typeof window !== 'undefined') {
    const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
    if (storedStyles.length > 0) {
      return storedStyles.find((s: Style) => s.id === id) || null
    }
  }
  
  return mockStyles.find((s: Style) => s.id === id) || null
}

export async function createStyle(styleData: Omit<Style, 'id' | 'created_at' | 'updated_at'>): Promise<Style> {
  console.log('Creating style:', styleData)
  
  // Use API route to bypass RLS
  try {
    const response = await fetch('/api/styles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(styleData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create style')
    }
    
    const data = await response.json()
    console.log('Style created successfully via API:', data)
    
    // Also update localStorage if it exists
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      const updatedStyles = [...storedStyles, data]
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(updatedStyles))
    }
    
    return data
  } catch (error: any) {
    console.error('Error creating style:', error)
    
    // Fallback to localStorage if API fails
    if (typeof window !== 'undefined') {
      console.log('Falling back to localStorage...')
      
      let storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      
      if (storedStyles.length === 0) {
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
      
      console.log('Style created in localStorage:', newStyle)
      return newStyle
    }
    
    throw new Error(error?.message || 'Failed to create style')
  }
}

export async function updateStyle(id: number, styleData: Partial<Omit<Style, 'id' | 'created_at' | 'updated_at'>>): Promise<Style | null> {
  console.log('Updating style:', id, styleData)
  
  // Use API route to bypass RLS
  try {
    const response = await fetch('/api/styles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...styleData })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update style')
    }
    
    const data = await response.json()
    console.log('Style updated successfully via API:', data)
    
    // Also update localStorage if it exists
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      const index = storedStyles.findIndex((s: Style) => s.id === id)
      if (index !== -1) {
        storedStyles[index] = data
        localStorage.setItem('ink-finder-styles-table', JSON.stringify(storedStyles))
      }
    }
    
    return data
  } catch (error: any) {
    console.error('Error updating style:', error)
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      const allStyles = storedStyles.length > 0 ? storedStyles : [...mockStyles]
      
      const index = allStyles.findIndex((s: Style) => s.id === id)
      if (index !== -1) {
        allStyles[index] = {
          ...allStyles[index],
          ...styleData,
          updated_at: new Date().toISOString()
        }
        
        localStorage.setItem('ink-finder-styles-table', JSON.stringify(allStyles))
        console.log('Style updated in localStorage:', allStyles[index])
        return allStyles[index]
      }
    }
    
    return null
  }
}

export async function deleteStyle(id: number): Promise<boolean> {
  console.log('Deleting style:', id)
  
  // Use API route to bypass RLS
  try {
    const response = await fetch(`/api/styles?id=${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete style')
    }
    
    console.log('Style deleted successfully via API')
    
    // Also remove from localStorage if it exists
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      const filteredStyles = storedStyles.filter((s: Style) => s.id !== id)
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(filteredStyles))
    }
    
    return true
  } catch (error: any) {
    console.error('Error deleting style:', error)
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const storedStyles = JSON.parse(localStorage.getItem('ink-finder-styles-table') || '[]')
      const filteredStyles = storedStyles.filter((s: Style) => s.id !== id)
      localStorage.setItem('ink-finder-styles-table', JSON.stringify(filteredStyles))
      console.log('Style deleted from localStorage')
      return true
    }
    
    return false
  }
}