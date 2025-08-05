import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Artist } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    // Get artists data from request
    const { artists } = await request.json()
    
    if (!artists || !Array.isArray(artists)) {
      return NextResponse.json(
        { error: 'Invalid artists data provided' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { error: 'Supabase is not properly configured for production sync' },
        { status: 500 }
      )
    }

    // Create service role client (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test connection
    console.log('🔍 Testing Supabase service role connection...')
    const { data: testData, error: testError } = await supabase
      .from('artists')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Service role connection test failed:', testError)
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Service role connection test passed')

    const results = {
      successful: 0,
      failed: 0,
      deleted: 0,
      errors: [] as { artist: string; error: string }[]
    }

    // First, get current production artists to identify deletions
    console.log('🔍 Fetching current production artists for sync comparison...')
    const { data: currentProdArtists, error: fetchError } = await supabase
      .from('artists')
      .select('id, name')
    
    if (fetchError) {
      console.error('❌ Failed to fetch current production artists:', fetchError)
      return NextResponse.json(
        { error: `Failed to fetch production data: ${fetchError.message}` },
        { status: 500 }
      )
    }

    console.log(`📊 Current production: ${currentProdArtists.length} artists`)
    console.log(`📊 Local artists: ${artists.length} artists`)

    // Helper function to convert non-UUID IDs to UUIDs
    const convertToUUID = (id: string): string => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(id)) {
        return id // Already a UUID
      }
      
      // Generate a deterministic UUID v5 from the original ID
      const crypto = require('crypto')
      const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' // UUID v1 namespace
      const hash = crypto.createHash('sha1')
      hash.update(namespace.replace(/-/g, ''), 'hex')
      hash.update(id, 'utf8')
      const hashBytes = hash.digest()
      
      // Format as UUID v5
      return [
        hashBytes.toString('hex', 0, 4),
        hashBytes.toString('hex', 4, 6),
        ((hashBytes[6] & 0x0f) | 0x50).toString(16) + hashBytes.toString('hex', 7, 8),
        ((hashBytes[8] & 0x3f) | 0x80).toString(16) + hashBytes.toString('hex', 9, 10),
        hashBytes.toString('hex', 10, 16)
      ].join('-')
    }

    // Identify artists to delete (exist in production but not in local)
    const localArtistIds = new Set(artists.map(a => convertToUUID(a.id)))
    const artistsToDelete = currentProdArtists.filter(prodArtist => !localArtistIds.has(prodArtist.id))

    console.log(`🗑️ Artists to delete: ${artistsToDelete.length}`)

    // Delete removed artists from production
    for (const artistToDelete of artistsToDelete) {
      try {
        const { error: deleteError } = await supabase
          .from('artists')
          .delete()
          .eq('id', artistToDelete.id)

        if (deleteError) {
          console.error(`❌ Failed to delete artist ${artistToDelete.name}:`, deleteError)
          results.errors.push({
            artist: artistToDelete.name,
            error: `Delete failed: ${deleteError.message}`
          })
          results.failed++
        } else {
          console.log(`🗑️ Deleted: ${artistToDelete.name}`)
          results.deleted++
        }
      } catch (error: any) {
        console.error(`❌ Error deleting artist ${artistToDelete.name}:`, error)
        results.errors.push({
          artist: artistToDelete.name,
          error: `Delete error: ${error.message}`
        })
        results.failed++
      }
    }

    // Now sync/upsert local artists
    for (const artist of artists) {
      try {
        // Generate UUID for non-UUID artist IDs
        const artistId = convertToUUID(artist.id)
        
        if (artistId !== artist.id) {
          console.log(`🔄 Converted ID: ${artist.id} → ${artistId}`)
        }
        
        // Map local artist data to Supabase schema
        const supabaseArtist: Record<string, any> = {
          id: artistId,
          name: artist.name_en || artist.name_ja || artist.name || 'Unknown Artist',
          bio: artist.bio_en || artist.bio_ja || artist.bio || 'No bio available',
          location: artist.location || artist.address_en || artist.address_ja || 'Unknown',
          address: artist.address_en || artist.address_ja || artist.location || 'Unknown',
          styles: artist.styles || [],
          price_range: artist.price_range || '¥10,000 - ¥50,000',
          booking_url: artist.booking_url || artist.website_url || '',
          instagram_handle: artist.instagram_handle || '@unknown',
          images: artist.images || artist.portfolio_images || [],
          view_count: artist.view_count || 0,
          profile_icon: artist.profile_icon || {
            icon: '🎨',
            color: 'from-purple-500 to-pink-500'
          },
          // Convert studio_id - handle empty strings and non-numeric values
          studio_id: (() => {
            if (!artist.studio_id || artist.studio_id === '') {
              return null // Empty or no studio ID
            }
            if (typeof artist.studio_id === 'number') {
              return artist.studio_id // Already a number
            }
            if (typeof artist.studio_id === 'string' && /^\d+$/.test(artist.studio_id)) {
              return parseInt(artist.studio_id, 10) // Convert numeric string to number
            }
            return null // Clear non-numeric studio IDs
          })()
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

        // Upsert with service role (bypasses RLS)
        const { data, error } = await supabase
          .from('artists')
          .upsert(supabaseArtist, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()

        if (error) {
          console.error(`❌ Supabase error for artist ${supabaseArtist.name}:`, error)
          throw new Error(error.message || 'Unknown Supabase error')
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

    console.log(`📊 Sync Results: ${results.successful} successful, ${results.failed} failed, ${results.deleted} deleted`)

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('❌ Production sync API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}