import { Artist, ImageMotif } from '@/types/database'

/**
 * Get motif IDs for a specific image from an artist's image_motifs array
 */
export function getMotifIdsForImage(artist: Artist, imageUrl: string): number[] {
  if (!artist.image_motifs || !imageUrl) return []
  
  const imageMotif = artist.image_motifs.find(motif => motif.image_url === imageUrl)
  return imageMotif?.motif_ids || []
}

/**
 * Update motif IDs for a specific image in an artist's image_motifs array
 */
export function updateImageMotifs(artist: Artist, imageUrl: string, motifIds: number[]): ImageMotif[] {
  const currentImageMotifs = artist.image_motifs || []
  
  // Remove existing entry for this image if it exists
  const filteredMotifs = currentImageMotifs.filter(motif => motif.image_url !== imageUrl)
  
  // Add new entry if there are motif IDs
  if (motifIds.length > 0) {
    filteredMotifs.push({
      image_url: imageUrl,
      motif_ids: motifIds
    })
  }
  
  return filteredMotifs
}

/**
 * Get all unique motif IDs from all images of an artist
 */
export function getAllMotifsFromImages(artist: Artist): number[] {
  if (!artist.image_motifs) return []
  
  const allMotifIds = artist.image_motifs.reduce((acc: number[], imageMotif) => {
    return [...acc, ...imageMotif.motif_ids]
  }, [])
  
  // Return unique motif IDs
  return [...new Set(allMotifIds)]
}

/**
 * Update an artist's overall motif information based on their image motifs
 */
export function updateArtistMotifsFromImages(artist: Artist): Artist {
  const allMotifIds = getAllMotifsFromImages(artist)
  
  return {
    ...artist,
    // We could add a motif_ids field to Artist interface if needed
    // motif_ids: allMotifIds
  }
}

/**
 * Check if an artist has a specific motif in any of their images
 */
export function artistHasMotif(artist: Artist, motifId: number): boolean {
  if (!artist.image_motifs) return false
  
  return artist.image_motifs.some(imageMotif => 
    imageMotif.motif_ids.includes(motifId)
  )
}

/**
 * Get images that contain a specific motif
 */
export function getImagesWithMotif(artist: Artist, motifId: number): string[] {
  if (!artist.image_motifs) return []
  
  return artist.image_motifs
    .filter(imageMotif => imageMotif.motif_ids.includes(motifId))
    .map(imageMotif => imageMotif.image_url)
}

/**
 * Get motifs for a specific image by URL
 */
export function getMotifsForImage(artist: Artist, imageUrl: string): ImageMotif | undefined {
  if (!artist.image_motifs) return undefined
  
  return artist.image_motifs.find(imageMotif => imageMotif.image_url === imageUrl)
}