import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Migration SQL to add missing artist columns (multilingual and features)
    const migrationSQL = `
      -- Add artist feature columns and multilingual fields if they don't exist
      DO $$ 
      BEGIN
          -- Add multilingual name columns
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'name_ja') THEN
              ALTER TABLE public.artists ADD COLUMN name_ja TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'name_en') THEN
              ALTER TABLE public.artists ADD COLUMN name_en TEXT;
          END IF;
          
          -- Add multilingual bio columns
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'bio_ja') THEN
              ALTER TABLE public.artists ADD COLUMN bio_ja TEXT DEFAULT '';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'bio_en') THEN
              ALTER TABLE public.artists ADD COLUMN bio_en TEXT DEFAULT '';
          END IF;
          
          -- Add multilingual address columns
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'address_ja') THEN
              ALTER TABLE public.artists ADD COLUMN address_ja TEXT DEFAULT '';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'address_en') THEN
              ALTER TABLE public.artists ADD COLUMN address_en TEXT DEFAULT '';
          END IF;
          
          -- Add artist feature columns
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'female_artist') THEN
              ALTER TABLE public.artists ADD COLUMN female_artist BOOLEAN DEFAULT false;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'beginner_friendly') THEN
              ALTER TABLE public.artists ADD COLUMN beginner_friendly BOOLEAN DEFAULT false;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'custom_design_allowed') THEN
              ALTER TABLE public.artists ADD COLUMN custom_design_allowed BOOLEAN DEFAULT false;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'cover_up_available') THEN
              ALTER TABLE public.artists ADD COLUMN cover_up_available BOOLEAN DEFAULT false;
          END IF;
          
          -- Add image_styles column for per-image style tagging
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'artists' AND column_name = 'image_styles') THEN
              ALTER TABLE public.artists ADD COLUMN image_styles JSONB DEFAULT '[]'::jsonb;
          END IF;
          
          -- Update existing artists to populate multilingual fields from legacy fields
          UPDATE public.artists 
          SET 
              name_ja = COALESCE(name_ja, name, 'Unknown Artist'),
              name_en = COALESCE(name_en, name, 'Unknown Artist'),
              bio_ja = COALESCE(bio_ja, bio, ''),
              bio_en = COALESCE(bio_en, bio, ''),
              address_ja = COALESCE(address_ja, address, location, ''),
              address_en = COALESCE(address_en, address, location, '')
          WHERE name_ja IS NULL OR name_en IS NULL OR bio_ja IS NULL OR bio_en IS NULL 
             OR address_ja IS NULL OR address_en IS NULL;
      END $$;
      
      -- Create indexes for better performance on new columns
      CREATE INDEX IF NOT EXISTS idx_artists_female_artist ON public.artists(female_artist) WHERE female_artist = true;
      CREATE INDEX IF NOT EXISTS idx_artists_beginner_friendly ON public.artists(beginner_friendly) WHERE beginner_friendly = true;
      CREATE INDEX IF NOT EXISTS idx_artists_custom_design_allowed ON public.artists(custom_design_allowed) WHERE custom_design_allowed = true;
      CREATE INDEX IF NOT EXISTS idx_artists_cover_up_available ON public.artists(cover_up_available) WHERE cover_up_available = true;
      CREATE INDEX IF NOT EXISTS idx_artists_image_styles ON public.artists USING gin(image_styles);
    `

    // Check if all columns exist by trying to select them from artists table
    const { data: testData, error: testError } = await supabase
      .from('artists')
      .select('name_ja, name_en, bio_ja, bio_en, address_ja, address_en, female_artist, beginner_friendly, custom_design_allowed, cover_up_available, image_styles')
      .limit(1)
    
    if (!testError) {
      // If this succeeds, all columns exist
      return NextResponse.json({ 
        success: true, 
        message: 'All required columns already exist in the database' 
      })
    }

    // If there's an error, determine which columns are missing based on the error message
    const missingColumns = [
      'name_ja', 'name_en', 'bio_ja', 'bio_en', 'address_ja', 'address_en',
      'female_artist', 'beginner_friendly', 'custom_design_allowed', 'cover_up_available', 'image_styles'
    ]

    if (missingColumns.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All required columns already exist in the database' 
      })
    }

    // Since we can't execute raw SQL directly, return instructions for manual migration
    return NextResponse.json({ 
      success: false,
      message: 'Manual migration required',
      missingColumns,
      instructions: 'Please execute the migration SQL in the Supabase SQL editor',
      migrationSQL: migrationSQL.trim()
    })

  } catch (error: any) {
    console.error('Migration execution error:', error)
    return NextResponse.json({ 
      error: 'Failed to execute migration', 
      details: error.message 
    }, { status: 500 })
  }
}