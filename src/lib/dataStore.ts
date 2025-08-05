'use client'

import { Artist } from '@/types/database'

// Browser storage key
const STORAGE_KEY = 'ink-finder-artists'

// Get artists from localStorage or return empty array
export function getStoredArtists(): Artist[] {
  if (typeof window === 'undefined') {
    return [] // SSR fallback - empty array
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error)
  }
  
  return [] // Return empty array instead of mock data
}

// Save artists to localStorage
export function saveArtists(artists: Artist[]): void {
  if (typeof window === 'undefined') {
    return // SSR safety
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(artists))
    
    // Dispatch custom event to notify other pages
    window.dispatchEvent(new CustomEvent('artists-updated', {
      detail: { artists }
    }))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

// Listen for artist updates
export function subscribeToArtistUpdates(callback: (artists: Artist[]) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {} // SSR safety
  }
  
  const handleUpdate = (event: CustomEvent) => {
    callback(event.detail.artists)
  }
  
  window.addEventListener('artists-updated', handleUpdate as EventListener)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('artists-updated', handleUpdate as EventListener)
  }
}

// Clear all data
export function resetArtists(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('artists-updated', {
      detail: { artists: [] } // Empty array instead of mock data
    }))
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}