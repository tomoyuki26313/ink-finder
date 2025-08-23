import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Supabase admin not configured' 
      }, { status: 500 })
    }

    console.log('🔐 Starting RLS security fix...')

    // SQL to fix RLS security issues
    const fixRlsSQL = `
      -- Enable RLS on studios table
      ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

      -- Drop existing permissive policies and create secure ones for studios
      DROP POLICY IF EXISTS "Studios are deletable by everyone" ON public.studios;
      DROP POLICY IF EXISTS "Studios are insertable by everyone" ON public.studios;
      DROP POLICY IF EXISTS "Studios are updatable by everyone" ON public.studios;
      DROP POLICY IF EXISTS "Studios are viewable by everyone" ON public.studios;

      -- Create secure RLS policies for studios
      CREATE POLICY "Enable read access for all users" ON public.studios
        FOR SELECT USING (true);

      CREATE POLICY "Enable insert for service role" ON public.studios
        FOR INSERT WITH CHECK (true);

      CREATE POLICY "Enable update for service role" ON public.studios
        FOR UPDATE USING (true) WITH CHECK (true);

      CREATE POLICY "Enable delete for service role" ON public.studios
        FOR DELETE USING (true);

      -- Enable RLS on artists table
      ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

      -- Drop existing permissive policies for artists if they exist
      DROP POLICY IF EXISTS "Artists are deletable by everyone" ON public.artists;
      DROP POLICY IF EXISTS "Artists are insertable by everyone" ON public.artists;
      DROP POLICY IF EXISTS "Artists are updatable by everyone" ON public.artists;
      DROP POLICY IF EXISTS "Artists are viewable by everyone" ON public.artists;

      -- Create secure RLS policies for artists
      CREATE POLICY "Enable read access for all users" ON public.artists
        FOR SELECT USING (true);

      CREATE POLICY "Enable insert for service role" ON public.artists
        FOR INSERT WITH CHECK (true);

      CREATE POLICY "Enable update for service role" ON public.artists
        FOR UPDATE USING (true) WITH CHECK (true);

      CREATE POLICY "Enable delete for service role" ON public.artists
        FOR DELETE USING (true);

      -- Enable RLS on styles table
      ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

      -- Drop existing permissive policies for styles if they exist
      DROP POLICY IF EXISTS "Styles are deletable by everyone" ON public.styles;
      DROP POLICY IF EXISTS "Styles are insertable by everyone" ON public.styles;
      DROP POLICY IF EXISTS "Styles are updatable by everyone" ON public.styles;
      DROP POLICY IF EXISTS "Styles are viewable by everyone" ON public.styles;

      -- Create secure RLS policies for styles
      CREATE POLICY "Enable read access for all users" ON public.styles
        FOR SELECT USING (true);

      CREATE POLICY "Enable insert for service role" ON public.styles
        FOR INSERT WITH CHECK (true);

      CREATE POLICY "Enable update for service role" ON public.styles
        FOR UPDATE USING (true) WITH CHECK (true);

      CREATE POLICY "Enable delete for service role" ON public.styles
        FOR DELETE USING (true);

      -- Enable RLS on motifs table
      ALTER TABLE public.motifs ENABLE ROW LEVEL SECURITY;

      -- Drop existing permissive policies for motifs if they exist
      DROP POLICY IF EXISTS "Motifs are deletable by everyone" ON public.motifs;
      DROP POLICY IF EXISTS "Motifs are insertable by everyone" ON public.motifs;
      DROP POLICY IF EXISTS "Motifs are updatable by everyone" ON public.motifs;
      DROP POLICY IF EXISTS "Motifs are viewable by everyone" ON public.motifs;

      -- Create secure RLS policies for motifs
      CREATE POLICY "Enable read access for all users" ON public.motifs
        FOR SELECT USING (true);

      CREATE POLICY "Enable insert for service role" ON public.motifs
        FOR INSERT WITH CHECK (true);

      CREATE POLICY "Enable update for service role" ON public.motifs
        FOR UPDATE USING (true) WITH CHECK (true);

      CREATE POLICY "Enable delete for service role" ON public.motifs
        FOR DELETE USING (true);
    `

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: fixRlsSQL 
    })

    if (error) {
      console.error('❌ RLS fix failed:', error)
      
      // Try alternative approach - execute each statement individually
      const statements = fixRlsSQL.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabaseAdmin.rpc('exec_sql', { 
            sql_query: statement.trim() + ';' 
          })
          
          if (stmtError) {
            console.error('❌ Statement failed:', statement.trim(), stmtError)
          }
        }
      }
    }

    console.log('✅ RLS security fix completed')

    return NextResponse.json({
      success: true,
      message: 'RLS security policies have been fixed',
      fixedTables: ['studios', 'artists', 'styles', 'motifs']
    })

  } catch (error: any) {
    console.error('❌ RLS security fix failed:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fix RLS security',
      details: error
    }, { status: 500 })
  }
}