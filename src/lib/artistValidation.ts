// Artist validation utilities for preventing duplicates

import { createClient } from '@supabase/supabase-js'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingArtist?: {
    id: string
    name: string
    instagram_handle: string
  }
  message?: string
}

// Extract Instagram handle from various formats
export function extractInstagramHandle(input: string): string {
  if (!input) return ''
  
  // Remove whitespace
  const cleaned = input.trim()
  
  // If it's a full Instagram URL
  if (cleaned.includes('instagram.com/')) {
    const match = cleaned.match(/instagram\.com\/([^\/\?]+)/)
    return match ? match[1] : ''
  }
  
  // If it starts with @, remove it
  if (cleaned.startsWith('@')) {
    return cleaned.substring(1)
  }
  
  // Otherwise assume it's already a handle
  return cleaned
}

// Check if artist already exists based on Instagram handle
export async function checkArtistDuplicate(
  instagramHandle: string,
  currentArtistId?: string
): Promise<DuplicateCheckResult> {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const handle = extractInstagramHandle(instagramHandle)
    
    if (!handle) {
      return { isDuplicate: false }
    }
    
    // Query for existing artists with the same Instagram handle
    let query = supabase
      .from('artists')
      .select('id, name_ja, name_en, instagram_handle')
      .eq('instagram_handle', handle)
    
    // Exclude current artist if editing
    if (currentArtistId) {
      query = query.neq('id', currentArtistId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error checking for duplicate artist:', error)
      return { 
        isDuplicate: false, 
        message: 'エラーが発生しました。重複チェックができませんでした。' 
      }
    }
    
    if (data && data.length > 0) {
      const existingArtist = data[0]
      const artistName = existingArtist.name_ja || existingArtist.name_en || 'Unknown'
      
      return {
        isDuplicate: true,
        existingArtist: {
          id: existingArtist.id,
          name: artistName,
          instagram_handle: existingArtist.instagram_handle
        },
        message: `このInstagramアカウント「@${handle}」は既に「${artistName}」として登録されています。`
      }
    }
    
    return { isDuplicate: false }
    
  } catch (error) {
    console.error('Error in duplicate check:', error)
    return { 
      isDuplicate: false, 
      message: '重複チェック中にエラーが発生しました。' 
    }
  }
}

// Check if artist name already exists (optional additional check)
export async function checkArtistNameDuplicate(
  nameJa: string,
  nameEn: string,
  currentArtistId?: string
): Promise<DuplicateCheckResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    if (!nameJa && !nameEn) {
      return { isDuplicate: false }
    }
    
    let query = supabase
      .from('artists')
      .select('id, name_ja, name_en, instagram_handle')
    
    // Build query conditions
    const orConditions = []
    if (nameJa) orConditions.push(`name_ja.eq.${nameJa}`)
    if (nameEn) orConditions.push(`name_en.eq.${nameEn}`)
    
    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','))
    }
    
    // Exclude current artist if editing
    if (currentArtistId) {
      query = query.neq('id', currentArtistId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error checking for duplicate artist name:', error)
      return { isDuplicate: false }
    }
    
    if (data && data.length > 0) {
      const existingArtist = data[0]
      const artistName = existingArtist.name_ja || existingArtist.name_en || 'Unknown'
      
      return {
        isDuplicate: true,
        existingArtist: {
          id: existingArtist.id,
          name: artistName,
          instagram_handle: existingArtist.instagram_handle || ''
        },
        message: `同じ名前「${artistName}」のアーティストが既に登録されています。`
      }
    }
    
    return { isDuplicate: false }
    
  } catch (error) {
    console.error('Error in name duplicate check:', error)
    return { isDuplicate: false }
  }
}