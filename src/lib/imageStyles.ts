import { ImageStyle, Style, Artist } from '@/types/database'

// Helper functions for managing image styles

export function getImageStylesForArtist(artist: Artist): ImageStyle[] {
  return artist.image_styles || []
}

export function getStylesForImage(artist: Artist, imageUrl: string): number[] {
  const imageStyle = artist.image_styles?.find(img => img.image_url === imageUrl)
  return imageStyle?.style_ids || []
}

export function updateImageStyles(artist: Artist, imageUrl: string, styleIds: number[]): Artist {
  const existingImageStyles = artist.image_styles || []
  const existingIndex = existingImageStyles.findIndex(img => img.image_url === imageUrl)
  
  const newImageStyle: ImageStyle = {
    image_url: imageUrl,
    style_ids: styleIds
  }
  
  let updatedImageStyles: ImageStyle[]
  if (existingIndex >= 0) {
    // Update existing image style
    updatedImageStyles = [...existingImageStyles]
    updatedImageStyles[existingIndex] = newImageStyle
  } else {
    // Add new image style
    updatedImageStyles = [...existingImageStyles, newImageStyle]
  }
  
  return {
    ...artist,
    image_styles: updatedImageStyles
  }
}

export function removeImageStyles(artist: Artist, imageUrl: string): Artist {
  const filteredImageStyles = (artist.image_styles || []).filter(
    img => img.image_url !== imageUrl
  )
  
  return {
    ...artist,
    image_styles: filteredImageStyles
  }
}

export function getAllStylesFromImages(artist: Artist): number[] {
  const allStyleIds = new Set<number>()
  
  artist.image_styles?.forEach(imageStyle => {
    imageStyle.style_ids.forEach(styleId => {
      allStyleIds.add(styleId)
    })
  })
  
  return Array.from(allStyleIds)
}

export function getStyleNamesFromIds(styleIds: number[], availableStyles: Style[], language: 'ja' | 'en' = 'ja'): string[] {
  return styleIds
    .map(id => {
      const style = availableStyles.find(s => s.id === id)
      if (!style) return null
      return language === 'ja' ? style.style_name_ja : style.style_name_en
    })
    .filter(Boolean) as string[]
}

export function updateArtistStylesFromImages(artist: Artist, availableStyles: Style[], language: 'ja' | 'en' = 'ja'): Artist {
  // Get all unique style IDs from images
  const allStyleIds = getAllStylesFromImages(artist)
  
  // Convert to style names for the legacy styles array
  const styleNames = getStyleNamesFromIds(allStyleIds, availableStyles, language)
  
  return {
    ...artist,
    styles: styleNames
  }
}