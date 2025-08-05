import { Language } from './i18n'
import { Artist } from '@/types/database'

export function getLocalizedField(artist: Artist, field: 'name' | 'bio' | 'address', language: Language): string {
  if (!artist) return ''
  
  switch (field) {
    case 'name':
      return language === 'ja' ? (artist.name_ja || '') : (artist.name_en || '')
    case 'bio':
      return language === 'ja' ? (artist.bio_ja || '') : (artist.bio_en || '')
    case 'address':
      return language === 'ja' ? (artist.address_ja || '') : (artist.address_en || '')
    default:
      return ''
  }
}