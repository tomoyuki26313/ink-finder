import { supabase, isSupabaseConfigured } from './supabase'
import { Artist, Studio, ArtistWithStudio } from '@/types/database'
import { getStoredArtists, saveArtists } from './dataStore'

// Helper to simulate async behavior for mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Studio API functions
export async function fetchStudios(): Promise<Studio[]> {
  if (!isSupabaseConfigured) {
    await delay(500)
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    return [...storedStudios].sort((a, b) => b.view_count - a.view_count)
  }

  const { data, error } = await supabase!
    .from('studios')
    .select('*')
    .order('view_count', { ascending: false })
  
  if (error) {
    console.error('Error fetching studios:', error)
    return []
  }
  
  return data as Studio[]
}

export async function fetchStudioById(id: string): Promise<Studio | null> {
  if (!isSupabaseConfigured) {
    await delay(200)
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    return storedStudios.find((studio: Studio) => studio.id === id) || null
  }

  const { data, error } = await supabase!
    .from('studios')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching studio:', error)
    return null
  }
  
  return data as Studio
}

export async function createStudio(studioData: Omit<Studio, 'id' | 'created_at' | 'view_count'>): Promise<Studio | null> {
  if (!isSupabaseConfigured) {
    // Local mode - store in localStorage
    const newStudio: Studio = {
      ...studioData,
      id: `studio-${Date.now()}`,
      created_at: new Date().toISOString(),
      view_count: 0
    }
    
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    
    const updatedStudios = [...storedStudios, newStudio]
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-studios', JSON.stringify(updatedStudios))
    }
    
    return newStudio
  }

  const { data, error } = await supabase!
    .from('studios')
    .insert(studioData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating studio:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(error.message || error.details || error.hint || 'Failed to create studio')
  }
  
  return data as Studio
}

export async function updateStudio(id: string | number, studioData: Partial<Omit<Studio, 'id' | 'created_at'>>): Promise<Studio | null> {
  if (!isSupabaseConfigured) {
    // Local mode - update in localStorage
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    
    const studioIndex = storedStudios.findIndex((s: Studio) => s.id === id)
    if (studioIndex === -1) return null
    
    const updatedStudio = { ...storedStudios[studioIndex], ...studioData }
    storedStudios[studioIndex] = updatedStudio
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-studios', JSON.stringify(storedStudios))
    }
    
    return updatedStudio
  }

  console.log('Updating studio with ID:', id, 'Type:', typeof id)
  console.log('Studio data:', studioData)
  
  const { data, error } = await supabase!
    .from('studios')
    .update(studioData)
    .eq('id', id)
    .select()
    .single()
  
  console.log('Update response:', { data, error })
  
  if (error) {
    console.error('Error updating studio:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      stack: error.stack
    })
    console.error('Full error object:', JSON.stringify(error, null, 2))
    throw new Error(error.message || error.details || error.hint || 'Failed to update studio')
  }
  
  return data as Studio
}

export async function deleteStudio(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Local mode - remove from localStorage
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    
    const filteredStudios = storedStudios.filter((s: Studio) => s.id !== id)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ink-finder-studios', JSON.stringify(filteredStudios))
    }
    
    return true
  }

  const { error } = await supabase!
    .from('studios')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting studio:', error)
    return false
  }
  
  return true
}

// Artist API functions (updated to work with studios)
export async function fetchArtists(): Promise<Artist[]> {
  if (!isSupabaseConfigured) {
    await delay(500)
    const storedArtists = getStoredArtists()
    return [...storedArtists].sort((a, b) => b.view_count - a.view_count)
  }

  const { data, error } = await supabase!
    .from('artists')
    .select('*')
    .order('view_count', { ascending: false })
  
  if (error) {
    console.error('Error fetching artists:', error)
    return []
  }
  
  return data as Artist[]
}

// Fetch artists with their studio information
export async function fetchArtistsWithStudios(): Promise<ArtistWithStudio[]> {
  if (!isSupabaseConfigured) {
    await delay(500)
    const storedArtists = getStoredArtists()
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    
    const artistsWithStudios = storedArtists.map(artist => {
      const studio = storedStudios.find((s: Studio) => s.id === artist.studio_id)
      if (!studio) return null
      return { ...artist, studio } as ArtistWithStudio
    }).filter(Boolean) as ArtistWithStudio[]
    
    return artistsWithStudios.sort((a, b) => b.view_count - a.view_count)
  }

  const { data, error } = await supabase!
    .from('artists')
    .select(`
      *,
      studio:studios(*),
      artist_styles(
        style:styles(
          id,
          style_name_ja,
          style_name_en
        )
      )
    `)
    .order('view_count', { ascending: false })
  
  if (error) {
    console.error('Error fetching artists with studios:', error)
    return []
  }
  
  return data as ArtistWithStudio[]
}

export async function fetchArtistById(id: string): Promise<Artist | null> {
  if (!isSupabaseConfigured) {
    await delay(200)
    const storedArtists = getStoredArtists()
    return storedArtists.find(artist => artist.id === id) || null
  }

  const { data, error } = await supabase!
    .from('artists')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching artist:', error)
    return null
  }
  
  return data as Artist
}

export async function fetchArtistWithStudioById(id: string): Promise<ArtistWithStudio | null> {
  if (!isSupabaseConfigured) {
    await delay(200)
    const storedArtists = getStoredArtists()
    const artist = storedArtists.find(artist => artist.id === id)
    if (!artist) return null
    
    const storedStudios = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('ink-finder-studios') || '[]')
      : []
    const studio = storedStudios.find((s: Studio) => s.id === artist.studio_id)
    if (!studio) return null
    
    return { ...artist, studio } as ArtistWithStudio
  }

  const { data, error } = await supabase!
    .from('artists')
    .select(`
      *,
      studio:studios(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching artist with studio:', error)
    return null
  }
  
  return data as ArtistWithStudio
}

export async function createArtist(artistData: Omit<Artist, 'id' | 'created_at' | 'view_count'>): Promise<Artist | null> {
  if (!isSupabaseConfigured) {
    // Local mode - store in localStorage
    const newArtist: Artist = {
      ...artistData,
      id: `artist-${Date.now()}`,
      created_at: new Date().toISOString(),
      view_count: 0
    }
    
    const storedArtists = getStoredArtists()
    const updatedArtists = [...storedArtists, newArtist]
    saveArtists(updatedArtists)
    
    return newArtist
  }

  // Filter out fields that may not exist in the database schema
  const safeArtistData = filterArtistDataForSupabase(artistData)

  console.log('Creating artist with data:', safeArtistData)
  
  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }
  
  console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🔑 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // Test Supabase connection first
  try {
    const { data: testData, error: testError } = await supabase
      .from('artists')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError)
      throw new Error(`Database connection failed: ${testError.message}`)
    }
    
    console.log('✅ Supabase connection test passed')
  } catch (connectionError) {
    console.error('❌ Failed to connect to database:', connectionError)
    throw new Error(`Database connection error: ${connectionError.message}`)
  }

  try {
    const { data, error } = await supabase
      .from('artists')
      .insert(safeArtistData)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase error creating artist:')
      console.error('📄 Insert data was:', JSON.stringify(safeArtistData, null, 2))
      console.error('🔍 Full error object:', JSON.stringify(error, null, 2))
      console.error('🔍 Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        toString: error.toString?.()
      })
      
      // Try to get more error information
      if (typeof error === 'object' && error !== null) {
        console.error('🔍 Error keys:', Object.keys(error))
        console.error('🔍 Error values:', Object.values(error))
      }
      
      throw new Error(error.message || error.toString?.() || 'Failed to create artist')
    }
    
    console.log('✅ Successfully created artist:', data)
    
    // If artist has style_ids, also manage the junction table relationships
    if (data && artistData.style_ids && artistData.style_ids.length > 0) {
      const { updateArtistStyles } = await import('./api/styles')
      await updateArtistStyles(data.id, artistData.style_ids)
    }
    
    return data as Artist
    
  } catch (networkError) {
    console.error('🌐 Network or other error creating artist:')
    console.error('📄 Insert data was:', JSON.stringify(safeArtistData, null, 2))
    console.error('🔍 Network error details:', {
      name: networkError.name,
      message: networkError.message,
      stack: networkError.stack,
      cause: networkError.cause
    })
    console.error('🔍 Full network error:', JSON.stringify(networkError, Object.getOwnPropertyNames(networkError), 2))
    
    throw new Error(`Network error creating artist: ${networkError.message}`)
  }
}

// Helper function to manage artist-style relationships
async function updateArtistStyleRelationships(artistId: string, styles: string[]): Promise<void> {
  if (!isSupabaseConfigured) return
  
  try {
    // Get available styles from database
    const { fetchStyles } = await import('./api/styles')
    const availableStyles = await fetchStyles()
    
    // Convert style names to IDs
    const styleIds: number[] = []
    styles.forEach(styleName => {
      const style = availableStyles.find(s => 
        s.style_name_ja === styleName || s.style_name_en === styleName
      )
      if (style) {
        styleIds.push(style.id)
      }
    })
    
    if (styleIds.length > 0) {
      // Update artist-style relationships using the API
      const { updateArtistStyles } = await import('./api/styles')
      await updateArtistStyles(artistId, styleIds)
    }
  } catch (error) {
    console.error('Error updating artist-style relationships:', error)
    // Don't throw error here to avoid breaking artist creation
  }
}

// Helper function to filter out fields that don't exist in database schema
function filterArtistDataForSupabase(artistData: Partial<Artist>): Record<string, any> {
  // Start with a clean object and only add fields we know are safe
  const safeData: Record<string, any> = {}
  
  // Core fields that should exist in most database schemas
  // Always provide a name field (required by database)
  safeData.name = artistData.name_en || artistData.name_ja || (artistData as any).name || 'Unknown Artist'
  
  // Always provide a bio field (required by database)
  safeData.bio = artistData.bio_en || artistData.bio_ja || (artistData as any).bio || 'Experienced tattoo artist specializing in various styles and techniques.'
  
  if (artistData.location) {
    safeData.location = artistData.location
  }
  
  // Always provide an address field (required by database)
  safeData.address = artistData.address_en || artistData.address_ja || (artistData as any).address || artistData.location || 'Unknown'
  
  if (artistData.style_ids && Array.isArray(artistData.style_ids)) {
    safeData.style_ids = artistData.style_ids
  }
  
  // Always provide required fields with defaults
  safeData.instagram_handle = artistData.instagram_handle || '@unknown'
  safeData.images = artistData.images || artistData.portfolio_images || []
  safeData.price_range = artistData.price_range || artistData.pricing_info?.price_range || '¥10,000 - ¥50,000'
  safeData.booking_url = artistData.booking_url || artistData.contact_info?.booking_url || (artistData as any).website_url || 'https://example.com'
  
  // Always provide view_count with default
  const viewCount = artistData.view_count !== undefined 
    ? (typeof artistData.view_count === 'string' ? parseInt(artistData.view_count) : artistData.view_count)
    : 0
  safeData.view_count = isNaN(viewCount) ? 0 : viewCount
  
  if (artistData.studio_id !== undefined) {
    // Handle empty string studio_id - convert to null for database
    if (artistData.studio_id === '' || artistData.studio_id === null || artistData.studio_id === undefined) {
      safeData.studio_id = null
    } else if (typeof artistData.studio_id === 'string' && artistData.studio_id.trim() === '') {
      safeData.studio_id = null
    } else {
      // Try to convert to integer if it's a valid number string
      const studioId = typeof artistData.studio_id === 'string' ? parseInt(artistData.studio_id) : artistData.studio_id
      safeData.studio_id = isNaN(studioId) ? null : studioId
    }
  }
  
  // Re-enable these fields after database migration is complete
  const conditionalFields = [
    'female_artist', 'beginner_friendly', 'custom_design_allowed', 'cover_up_available',
    'name_ja', 'name_en', 'bio_ja', 'bio_en', 'address_ja', 'address_en', 'instagram_follower_count'
  ]
  
  conditionalFields.forEach(field => {
    if (artistData[field as keyof Artist] !== undefined) {
      safeData[field] = artistData[field as keyof Artist]
    }
  })
  
  // Re-enable image_styles and image_motifs after database migration is complete
  if (artistData.image_styles) {
    safeData.image_styles = artistData.image_styles
  }
  
  if (artistData.image_motifs) {
    safeData.image_motifs = artistData.image_motifs
  }
  
  console.log('📋 Original artist data image_motifs:', artistData.image_motifs)
  console.log('📋 Filtered data keys:', Object.keys(safeData))
  console.log('📋 Filtered data image_motifs:', safeData.image_motifs)
  console.log('📋 Filtered data values:', safeData)
  return safeData
}

export async function updateArtist(id: string, artistData: Partial<Omit<Artist, 'id' | 'created_at'>>): Promise<Artist | null> {
  if (!isSupabaseConfigured) {
    // Local mode - update in localStorage
    const storedArtists = getStoredArtists()
    const artistIndex = storedArtists.findIndex(a => a.id === id)
    if (artistIndex === -1) return null
    
    const updatedArtist = { ...storedArtists[artistIndex], ...artistData }
    storedArtists[artistIndex] = updatedArtist
    saveArtists(storedArtists)
    
    return updatedArtist
  }

  // Filter out fields that may not exist in the database schema
  const safeArtistData = filterArtistDataForSupabase(artistData)

  console.log('Updating artist with ID:', id)
  console.log('Safe artist data:', safeArtistData)

  // First check if the artist exists
  const { data: existingArtist, error: fetchError } = await supabase!
    .from('artists')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error checking existing artist:', fetchError)
    throw new Error(`Failed to check existing artist: ${fetchError.message}`)
  }

  if (!existingArtist) {
    console.warn('Artist not found with ID:', id, 'Attempting to create instead...')
    
    // If artist doesn't exist, create it instead
    const createData = {
      ...safeArtistData,
      id: id // Preserve the original ID
    }
    
    const { data: createResultData, error: createError } = await supabase!
      .from('artists')
      .insert(createData)
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating artist:', createError)
      console.error('Create data:', createData)
      throw new Error(`Artist not found and creation failed: ${createError.message}`)
    }
    
    console.log('Successfully created artist:', createResultData)
    
    // Handle styles for newly created artist
    if (createResultData && artistData.style_ids) {
      const { updateArtistStyles } = await import('./api/styles')
      await updateArtistStyles(createResultData.id, artistData.style_ids)
    }
    
    return createResultData as Artist
  }

  console.log('Found existing artist:', existingArtist)

  // Check if we have any data to update
  if (!safeArtistData || Object.keys(safeArtistData).length === 0) {
    console.warn('No valid data to update after filtering')
    // Return the existing artist if no updates needed
    return existingArtist as Artist
  }

  console.log('Executing update with data:', safeArtistData)

  const { data, error } = await supabase!
    .from('artists')
    .update(safeArtistData)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating artist:', error)
    console.error('Update data:', safeArtistData)
    console.error('Artist ID:', id)
    throw new Error(error.message || 'Failed to update artist')
  }

  console.log('Update query result:', { data, rowCount: data?.length })

  if (!data || data.length === 0) {
    console.error('No rows updated. Artist exists but update failed.')
    console.error('This could indicate a permissions issue or schema mismatch.')
    
    // Try a minimal update with just core fields
    console.log('Attempting minimal update with core fields only...')
    const minimalData: Record<string, any> = {}
    
    if (safeArtistData.name) minimalData.name = safeArtistData.name
    if (safeArtistData.bio) minimalData.bio = safeArtistData.bio
    if (safeArtistData.location) minimalData.location = safeArtistData.location
    
    if (Object.keys(minimalData).length > 0) {
      const { data: minimalUpdateData, error: minimalError } = await supabase!
        .from('artists')
        .update(minimalData)
        .eq('id', id)
        .select()
      
      if (!minimalError && minimalUpdateData && minimalUpdateData.length > 0) {
        console.log('Minimal update succeeded with core fields')
        return minimalUpdateData[0] as Artist
      } else {
        console.error('Even minimal update failed:', minimalError)
      }
    }
    
    // Try to fetch the artist again to see if it still exists
    const { data: recheckArtist } = await supabase!
      .from('artists')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    console.log('Artist still exists after failed update:', !!recheckArtist)
    
    if (recheckArtist) {
      console.warn('Update failed but artist exists - returning existing artist data')
      return recheckArtist as Artist
    }
    
    throw new Error('Artist exists but could not be updated. Check database permissions and schema.')
  }

  if (data.length > 1) {
    console.warn('Multiple artists updated - this should not happen:', data.length)
  }

  // Return the first result
  const updatedArtist = data[0]
  
  // If styles are being updated, also update the junction table relationships
  if (updatedArtist && artistData.style_ids) {
    const { updateArtistStyles } = await import('./api/styles')
    await updateArtistStyles(updatedArtist.id, artistData.style_ids)
  }
  
  return updatedArtist as Artist
}

export async function deleteArtist(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Local mode - remove from localStorage
    const storedArtists = getStoredArtists()
    const filteredArtists = storedArtists.filter(a => a.id !== id)
    saveArtists(filteredArtists)
    return true
  }

  const { error } = await supabase!
    .from('artists')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting artist:', error)
    return false
  }
  
  return true
}

export async function searchArtists(query: string) {
  if (!isSupabaseConfigured) {
    await delay(300)
    const lowerQuery = query.toLowerCase()
    const storedArtists = getStoredArtists()
    return storedArtists.filter(artist => 
      artist.name_ja.toLowerCase().includes(lowerQuery) ||
      artist.name_en.toLowerCase().includes(lowerQuery) ||
      artist.bio_ja.toLowerCase().includes(lowerQuery) ||
      artist.bio_en.toLowerCase().includes(lowerQuery) ||
      artist.styles.some(style => style.toLowerCase().includes(lowerQuery))
    )
  }

  const { data, error } = await supabase!
    .from('artists')
    .select('*')
    .or(`name.ilike.%${query}%,bio.ilike.%${query}%`)
    .order('view_count', { ascending: false })
  
  if (error) {
    console.error('Error searching artists:', error)
    return []
  }
  
  return data as Artist[]
}

export async function filterArtists(filters: {
  styles?: string[]
  priceRange?: string
  location?: string
}) {
  if (!isSupabaseConfigured) {
    await delay(300)
    const storedArtists = getStoredArtists()
    let filtered = [...storedArtists]
    
    if (filters.styles && filters.styles.length > 0) {
      filtered = filtered.filter(artist =>
        artist.styles.some(style => filters.styles!.includes(style))
      )
    }
    
    if (filters.priceRange) {
      filtered = filtered.filter(artist =>
        artist.price_range.includes(filters.priceRange!)
      )
    }
    
    if (filters.location) {
      filtered = filtered.filter(artist =>
        artist.location === filters.location
      )
    }
    
    return filtered.sort((a, b) => b.view_count - a.view_count)
  }

  let query = supabase!.from('artists').select('*')
  
  if (filters.styles && filters.styles.length > 0) {
    query = query.contains('styles', filters.styles)
  }
  
  if (filters.priceRange) {
    query = query.ilike('price_range', `%${filters.priceRange}%`)
  }
  
  if (filters.location) {
    query = query.eq('location', filters.location)
  }
  
  const { data, error } = await query.order('view_count', { ascending: false })
  
  if (error) {
    console.error('Error filtering artists:', error)
    return []
  }
  
  return data as Artist[]
}

export async function incrementViewCount(artistId: string) {
  if (!isSupabaseConfigured) {
    // In local mode, we just update the local data
    const storedArtists = getStoredArtists()
    const artist = storedArtists.find(a => a.id === artistId)
    if (artist) {
      artist.view_count += 1
    }
    await delay(100)
    return
  }

  const { error } = await supabase!
    .rpc('increment_artist_view_count', { artist_id: artistId })
  
  if (error) {
    console.error('Error incrementing view count:', error)
  }
}

export async function getStyleTags(): Promise<string[]> {
  if (!isSupabaseConfigured) {
    await delay(200)
    // For local mode, return empty array since styles should come from props
    return []
  }

  try {
    const { fetchStyles } = await import('./api/styles')
    const styles = await fetchStyles()
    // Return Japanese style names for compatibility
    return styles.map(style => style.style_name_ja).sort()
  } catch (error) {
    console.error('Error fetching style tags:', error)
    return []
  }
}

export async function getLocations(): Promise<string[]> {
  if (!isSupabaseConfigured) {
    await delay(200)
    const storedArtists = getStoredArtists()
    const uniqueLocations = [...new Set(storedArtists.map(artist => artist.location))]
    return uniqueLocations.sort()
  }

  const { data, error } = await supabase!
    .from('artists')
    .select('location')
    .order('location')
  
  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }
  
  const uniqueLocations = [...new Set(data.map(item => item.location))]
  
  return uniqueLocations
}

// Sync local artists to production (Supabase)
export async function syncArtistsToProduction(localArtists: Artist[]) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }

  // Test the connection first
  console.log('Testing Supabase connection before sync...')
  console.log('Supabase configured:', isSupabaseConfigured)
  console.log('Supabase client exists:', !!supabase)
  
  try {
    const { data: testData, error: testError } = await supabase
      .from('artists')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('Connection test failed:', testError)
      throw new Error(`Database connection failed: ${testError.message || JSON.stringify(testError)}`)
    }
    
    console.log('✅ Connection test passed')
  } catch (connError: any) {
    console.error('Connection test error:', connError)
    throw new Error(`Cannot connect to Supabase: ${connError.message}`)
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as { artist: string; error: string }[]
  }

  for (const artist of localArtists) {
    try {
      // Map local artist data to Supabase schema
      const supabaseArtist: Record<string, any> = {
        id: artist.id, // Keep the original ID
        name: artist.name_en || artist.name_ja || artist.name || 'Unknown Artist',
        bio: artist.bio_en || artist.bio_ja || artist.bio || 'No bio available',
        location: artist.location || artist.address_en || artist.address_ja || 'Unknown',
        address: artist.address_en || artist.address_ja || artist.location || 'Unknown',
        style_ids: artist.style_ids || [],
        price_range: artist.price_range || '¥10,000 - ¥50,000',
        booking_url: artist.booking_url || artist.website_url || '',
        instagram_handle: artist.instagram_handle || '@unknown',
        images: artist.images || artist.portfolio_images || [],
        view_count: artist.view_count || 0,
        profile_icon: artist.profile_icon || {
          icon: '🎨',
          color: 'from-purple-500 to-pink-500'
        }
      }

      // Validate required fields
      if (!supabaseArtist.name || supabaseArtist.name.length < 2) {
        throw new Error('Artist name is too short (minimum 2 characters)')
      }
      if (!supabaseArtist.bio || supabaseArtist.bio.length < 10) {
        throw new Error('Artist bio is too short (minimum 10 characters)')
      }
      if (!supabaseArtist.price_range || supabaseArtist.price_range.length < 3) {
        throw new Error('Price range is too short (minimum 3 characters)')
      }

      // Try to upsert the artist
      const { data, error } = await supabase
        .from('artists')
        .upsert(supabaseArtist, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error(`Supabase error for artist ${supabaseArtist.name}:`, error)
        console.error('Error type:', typeof error)
        console.error('Error keys:', Object.keys(error))
        console.error('Error stringified:', JSON.stringify(error))
        console.error('Error message:', error?.message)
        console.error('Error details:', error?.details)
        console.error('Error hint:', error?.hint)
        console.error('Error code:', error?.code)
        
        // Try to extract meaningful error information
        let errorMessage = 'Unknown Supabase error'
        if (error.message) {
          errorMessage = error.message
        } else if (error.details) {
          errorMessage = error.details
        } else if (error.hint) {
          errorMessage = error.hint
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        throw new Error(errorMessage)
      }

      results.successful++
      console.log(`✅ Synced: ${supabaseArtist.name}`)
    } catch (error: any) {
      results.failed++
      const artistName = artist.name_en || artist.name_ja || artist.name || 'Unknown'
      results.errors.push({
        artist: artistName,
        error: error.message || 'Unknown error'
      })
      console.error(`❌ Failed to sync ${artistName}:`, error.message)
    }
  }

  return results
}

// Sync local studios to production (Supabase)
export async function syncStudiosToProduction(localStudios: Studio[]) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as { studio: string; error: string }[]
  }

  for (const studio of localStudios) {
    try {
      // Map local studio data to Supabase schema
      const supabaseStudio: Record<string, any> = {
        id: studio.id, // Keep the original ID
        name_ja: studio.name_ja || 'Unknown Studio',
        name_en: studio.name_en || 'Unknown Studio',
        bio_ja: studio.bio_ja || '',
        bio_en: studio.bio_en || '',
        location: studio.location || 'Unknown',
        address_ja: studio.address_ja || '',
        address_en: studio.address_en || '',
        instagram_handle: studio.instagram_handle || '',
        instagram_posts: studio.instagram_posts || [],
        booking_url: studio.booking_url || '',
        phone: studio.phone || '',
        website: studio.website || '',
        view_count: studio.view_count || 0,
        // Studio features
        speaks_english: studio.speaks_english || false,
        speaks_chinese: studio.speaks_chinese || false,
        speaks_korean: studio.speaks_korean || false,
        lgbtq_friendly: studio.lgbtq_friendly || false,
        same_day_booking: studio.same_day_booking || false,
        private_room: studio.private_room || false,
        parking_available: studio.parking_available || false,
        credit_card_accepted: studio.credit_card_accepted || false,
        digital_payment_accepted: studio.digital_payment_accepted || false,
        late_night_hours: studio.late_night_hours || false,
        weekend_hours: studio.weekend_hours || false,
        jagua_tattoo: studio.jagua_tattoo || false
      }

      // Validate required fields
      if (!supabaseStudio.name_ja && !supabaseStudio.name_en) {
        throw new Error('Studio must have at least one name (Japanese or English)')
      }
      if (!supabaseStudio.location || supabaseStudio.location.length < 2) {
        throw new Error('Studio location is required (minimum 2 characters)')
      }

      // Try to upsert the studio
      const { data, error } = await supabase
        .from('studios')
        .upsert(supabaseStudio, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error(`Supabase error for studio ${supabaseStudio.name_en || supabaseStudio.name_ja}:`, error)
        
        // Try to extract meaningful error information
        let errorMessage = 'Unknown Supabase error'
        if (error.message) {
          errorMessage = error.message
        } else if (error.details) {
          errorMessage = error.details
        } else if (error.hint) {
          errorMessage = error.hint
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        throw new Error(errorMessage)
      }

      results.successful++
      console.log(`✅ Synced studio: ${supabaseStudio.name_en || supabaseStudio.name_ja}`)
    } catch (error: any) {
      results.failed++
      const studioName = studio.name_en || studio.name_ja || 'Unknown'
      results.errors.push({
        studio: studioName,
        error: error.message || 'Unknown error'
      })
      console.error(`❌ Failed to sync ${studioName}:`, error.message)
    }
  }

  return results
}