import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // SQL to fix RLS policies for all tables
    const fixRlsSQL = `
      -- Fix Artists table policies
      DROP POLICY IF EXISTS "Artists are viewable by everyone" ON public.artists;
      DROP POLICY IF EXISTS "Artists are insertable by authenticated users" ON public.artists;
      DROP POLICY IF EXISTS "Artists are updatable by authenticated users" ON public.artists;
      DROP POLICY IF EXISTS "Artists are deletable by authenticated users" ON public.artists;

      CREATE POLICY "Artists are viewable by everyone" 
          ON public.artists FOR SELECT 
          USING (true);

      CREATE POLICY "Artists are insertable by everyone" 
          ON public.artists FOR INSERT 
          WITH CHECK (true);

      CREATE POLICY "Artists are updatable by everyone" 
          ON public.artists FOR UPDATE 
          USING (true) 
          WITH CHECK (true);

      CREATE POLICY "Artists are deletable by everyone" 
          ON public.artists FOR DELETE 
          USING (true);

      -- Fix artist_styles table policies
      DROP POLICY IF EXISTS "Artist styles are viewable by everyone" ON public.artist_styles;
      DROP POLICY IF EXISTS "Artist styles are manageable by authenticated users" ON public.artist_styles;
      DROP POLICY IF EXISTS "Artist styles are insertable by authenticated users" ON public.artist_styles;
      DROP POLICY IF EXISTS "Artist styles are updatable by authenticated users" ON public.artist_styles;
      DROP POLICY IF EXISTS "Artist styles are deletable by authenticated users" ON public.artist_styles;

      CREATE POLICY "Artist styles are viewable by everyone" 
          ON public.artist_styles FOR SELECT 
          USING (true);

      CREATE POLICY "Artist styles are insertable by everyone" 
          ON public.artist_styles FOR INSERT 
          WITH CHECK (true);

      CREATE POLICY "Artist styles are updatable by everyone" 
          ON public.artist_styles FOR UPDATE 
          USING (true) 
          WITH CHECK (true);

      CREATE POLICY "Artist styles are deletable by everyone" 
          ON public.artist_styles FOR DELETE 
          USING (true);

      -- Fix styles table policies
      DROP POLICY IF EXISTS "Styles are insertable by authenticated users" ON public.styles;
      DROP POLICY IF EXISTS "Styles are updatable by authenticated users" ON public.styles;
      DROP POLICY IF EXISTS "Styles are deletable by authenticated users" ON public.styles;

      CREATE POLICY "Styles are insertable by everyone" 
          ON public.styles FOR INSERT 
          WITH CHECK (true);

      CREATE POLICY "Styles are updatable by everyone" 
          ON public.styles FOR UPDATE 
          USING (true) 
          WITH CHECK (true);

      CREATE POLICY "Styles are deletable by everyone" 
          ON public.styles FOR DELETE 
          USING (true);

      -- Grant necessary permissions to anonymous and authenticated users
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_styles TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.styles TO anon, authenticated;

      -- Also ensure the sequence permissions are correct
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    `

    return NextResponse.json({ 
      success: false,
      message: 'Manual RLS policy fix required',
      instructions: 'Please execute the RLS policy fix SQL in the Supabase SQL editor',
      fixRlsSQL: fixRlsSQL.trim()
    })

  } catch (error: any) {
    console.error('RLS policy fix error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate RLS fix', 
      details: error.message 
    }, { status: 500 })
  }
}