import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { Studio } from '@/types/database'

export async function GET() {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('studios')
      .select('*')
      .order('view_count', { ascending: false })

    if (error) {
      console.error('Error fetching studios:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If Supabase Admin is not configured, return a specific status that the client can handle
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      console.warn('Supabase Admin not configured, client should use localStorage fallback')
      return NextResponse.json({ 
        error: 'Database not configured', 
        fallback: true 
      }, { status: 503 }) // Service Unavailable
    }
    
    const { data, error } = await supabaseAdmin
      .from('studios')
      .insert([{
        name_ja: body.name_ja,
        name_en: body.name_en,
        location: body.location,
        instagram_handle: body.instagram_handle,
        website_url: body.website_url,
        view_count: 0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating studio:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If Supabase Admin is not configured, return a specific status that the client can handle
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      console.warn('Supabase Admin not configured, client should use localStorage fallback')
      return NextResponse.json({ 
        error: 'Database not configured', 
        fallback: true 
      }, { status: 503 }) // Service Unavailable
    }
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('studios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating studio:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // If Supabase Admin is not configured, return a specific status that the client can handle
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      console.warn('Supabase Admin not configured, client should use localStorage fallback')
      return NextResponse.json({ 
        error: 'Database not configured', 
        fallback: true 
      }, { status: 503 }) // Service Unavailable
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('studios')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting studio:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}