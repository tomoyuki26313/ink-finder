'use client'

import { X } from 'lucide-react'
import { Artist } from '@/types/database'
import ArtistCard from '@/components/ArtistCard'

interface ArtistPreviewProps {
  artist: Artist
  onClose: () => void
}

export default function ArtistPreview({ artist, onClose }: ArtistPreviewProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Preview</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-4">
          This is how the artist card will appear on the main site:
        </p>
        <ArtistCard 
          artist={artist} 
          onClick={() => {}} 
        />
      </div>
    </div>
  )
}