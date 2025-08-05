import { Style } from '@/types/database'

// Get style names from style IDs
export function getStyleNamesByIds(styleIds: number[], styles: Style[], language: 'ja' | 'en' = 'ja'): string[] {
  if (!styleIds || !styles) return []
  
  return styleIds
    .map(id => {
      const style = styles.find(s => s.id === id)
      if (!style) return null
      return language === 'ja' ? style.style_name_ja : style.style_name_en
    })
    .filter(Boolean) as string[]
}

// Get style IDs from style names (for backward compatibility)
export function getStyleIdsByNames(styleNames: string[], styles: Style[]): number[] {
  if (!styleNames || !styles) return []
  
  return styleNames
    .map(name => {
      const style = styles.find(s => s.style_name_ja === name || s.style_name_en === name)
      return style?.id || null
    })
    .filter(Boolean) as number[]
}

// Convert legacy styles array to style IDs
export function convertLegacyStyles(artist: any, styles: Style[]): number[] {
  // If artist already has style_ids, use those
  if (artist.style_ids && Array.isArray(artist.style_ids)) {
    return artist.style_ids
  }
  
  // Otherwise convert from legacy styles array
  if (artist.styles && Array.isArray(artist.styles)) {
    return getStyleIdsByNames(artist.styles, styles)
  }
  
  return []
}