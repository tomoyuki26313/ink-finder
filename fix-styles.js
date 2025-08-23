// Standalone script to fix invalid style IDs
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function fixInvalidStyles() {
  console.log('🔍 Fetching all artists...')
  
  // Get all artists
  const { data: artists, error: artistsError } = await supabase
    .from('artists')
    .select('*')
  
  if (artistsError) {
    console.error('Error fetching artists:', artistsError)
    return
  }
  
  console.log(`Found ${artists.length} artists`)
  
  // Get all valid style IDs
  const { data: styles, error: stylesError } = await supabase
    .from('styles')
    .select('id')
  
  if (stylesError) {
    console.error('Error fetching styles:', stylesError)
    return
  }
  
  const validStyleIds = new Set(styles.map(s => s.id))
  console.log('✅ Valid style IDs:', Array.from(validStyleIds).sort((a, b) => a - b))
  
  // Find missing style IDs
  const allUsedStyleIds = new Set()
  
  for (const artist of artists) {
    if (artist.style_ids && Array.isArray(artist.style_ids)) {
      artist.style_ids.forEach(id => allUsedStyleIds.add(id))
    }
    
    if (artist.image_styles && Array.isArray(artist.image_styles)) {
      artist.image_styles.forEach(imageStyle => {
        if (imageStyle.style_ids && Array.isArray(imageStyle.style_ids)) {
          imageStyle.style_ids.forEach(id => allUsedStyleIds.add(id))
        }
      })
    }
  }
  
  const invalidStyleIds = Array.from(allUsedStyleIds).filter(id => !validStyleIds.has(id))
  console.log('❌ Invalid style IDs found:', invalidStyleIds)
  
  // Fix artists with invalid style IDs
  let fixedCount = 0
  
  for (const artist of artists) {
    let needsUpdate = false
    let updatedData = {}
    
    // Check style_ids
    if (artist.style_ids && Array.isArray(artist.style_ids)) {
      const validIds = artist.style_ids.filter(id => validStyleIds.has(id))
      const invalidIds = artist.style_ids.filter(id => !validStyleIds.has(id))
      
      if (invalidIds.length > 0) {
        console.log(`\n❌ Artist "${artist.name_ja || artist.name_en}" (ID: ${artist.id}) has invalid style IDs:`, invalidIds)
        updatedData.style_ids = validIds
        needsUpdate = true
      }
    }
    
    // Check image_styles
    if (artist.image_styles && Array.isArray(artist.image_styles)) {
      let hasInvalidImageStyles = false
      const updatedImageStyles = artist.image_styles.map(imageStyle => {
        if (imageStyle.style_ids && Array.isArray(imageStyle.style_ids)) {
          const validIds = imageStyle.style_ids.filter(id => validStyleIds.has(id))
          const invalidIds = imageStyle.style_ids.filter(id => !validStyleIds.has(id))
          
          if (invalidIds.length > 0) {
            console.log(`❌ Artist "${artist.name_ja || artist.name_en}" image has invalid style IDs:`, invalidIds)
            hasInvalidImageStyles = true
            return { ...imageStyle, style_ids: validIds }
          }
        }
        return imageStyle
      })
      
      if (hasInvalidImageStyles) {
        updatedData.image_styles = updatedImageStyles
        needsUpdate = true
      }
    }
    
    // Update artist if needed
    if (needsUpdate) {
      console.log(`🔧 Updating artist "${artist.name_ja || artist.name_en}"...`)
      
      const { error: updateError } = await supabase
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
fixInvalidStyles()
  .then(() => {
    console.log('✨ Script completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })