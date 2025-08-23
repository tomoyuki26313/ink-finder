import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Script to remove invalid style IDs from artists
async function fixInvalidStyles() {
  if (!supabaseAdmin) {
    console.error('Supabase Admin not configured')
    return
  }

  console.log('🔍 Fetching all artists...')
  
  // Get all artists
  const { data: artists, error: artistsError } = await supabaseAdmin
    .from('artists')
    .select('*')
  
  if (artistsError) {
    console.error('Error fetching artists:', artistsError)
    return
  }
  
  // Get all valid style IDs
  const { data: styles, error: stylesError } = await supabaseAdmin
    .from('styles')
    .select('id')
  
  if (stylesError) {
    console.error('Error fetching styles:', stylesError)
    return
  }
  
  const validStyleIds = new Set(styles.map(s => s.id))
  console.log('✅ Valid style IDs:', Array.from(validStyleIds).sort((a, b) => a - b))
  
  // Find and fix artists with invalid style IDs
  let fixedCount = 0
  
  for (const artist of artists) {
    let needsUpdate = false
    let updatedData: any = {}
    
    // Check style_ids
    if (artist.style_ids && Array.isArray(artist.style_ids)) {
      const validIds = artist.style_ids.filter(id => validStyleIds.has(id))
      const invalidIds = artist.style_ids.filter(id => !validStyleIds.has(id))
      
      if (invalidIds.length > 0) {
        console.log(`❌ Artist "${artist.name_ja || artist.name_en}" has invalid style IDs:`, invalidIds)
        updatedData.style_ids = validIds
        needsUpdate = true
      }
    }
    
    // Check image_styles
    if (artist.image_styles && Array.isArray(artist.image_styles)) {
      const updatedImageStyles = artist.image_styles.map(imageStyle => {
        if (imageStyle.style_ids && Array.isArray(imageStyle.style_ids)) {
          const validIds = imageStyle.style_ids.filter(id => validStyleIds.has(id))
          const invalidIds = imageStyle.style_ids.filter(id => !validStyleIds.has(id))
          
          if (invalidIds.length > 0) {
            console.log(`❌ Artist "${artist.name_ja || artist.name_en}" image has invalid style IDs:`, invalidIds)
            needsUpdate = true
            return { ...imageStyle, style_ids: validIds }
          }
        }
        return imageStyle
      })
      
      if (needsUpdate) {
        updatedData.image_styles = updatedImageStyles
      }
    }
    
    // Update artist if needed
    if (needsUpdate) {
      console.log(`🔧 Updating artist "${artist.name_ja || artist.name_en}"...`)
      
      const { error: updateError } = await supabaseAdmin
        .from('artists')
        .update(updatedData)
        .eq('id', artist.id)
      
      if (updateError) {
        console.error(`Failed to update artist ${artist.id}:`, updateError)
      } else {
        console.log(`✅ Updated artist "${artist.name_ja || artist.name_en}"`)
        fixedCount++
      }
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} artists with invalid style IDs`)
}

// Run the script
fixInvalidStyles().catch(console.error)