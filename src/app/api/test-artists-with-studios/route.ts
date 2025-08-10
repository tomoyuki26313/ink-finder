import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Testing fetchArtistsWithStudios query...')
    
    // Test the exact same query as in fetchArtistsWithStudios
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
      console.error('❌ Query error:', error)
      return NextResponse.json({
        success: false,
        error: error,
        query: 'Complex JOIN query failed'
      })
    }

    console.log(`✅ Found ${data.length} artists`)
    console.log('First artist:', data[0])

    return NextResponse.json({
      success: true,
      count: data.length,
      artists: data.map(artist => ({
        id: artist.id,
        name: artist.name,
        location: artist.location,
        instagram_handle: artist.instagram_handle,
        studio_id: artist.studio_id,
        studio: artist.studio,
        artist_styles: artist.artist_styles
      }))
    })

  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}