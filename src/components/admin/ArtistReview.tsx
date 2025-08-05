'use client'

import { useState } from 'react'
import { Check, X, Edit, ExternalLink, Globe, Instagram, Mail, Phone, MapPin, Clock, DollarSign } from 'lucide-react'
import { Artist } from '@/types/database'

interface PendingArtist extends Partial<Artist> {
  id: string
  confidence_score: number  // How confident we are in the parsed data (0-100)
  discovered_at: string
  source_url: string
}

interface ArtistReviewProps {
  pendingArtists: PendingArtist[]
  onApprove: (artistId: string, editedData?: Partial<Artist>) => void
  onReject: (artistId: string, reason: string) => void
  onBulkApprove: (artistIds: string[]) => void
  onBulkReject: (artistIds: string[], reason: string) => void
}

export default function ArtistReview({ 
  pendingArtists, 
  onApprove, 
  onReject, 
  onBulkApprove, 
  onBulkReject 
}: ArtistReviewProps) {
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set())
  const [editingArtist, setEditingArtist] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Artist>>({})
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  const [showBulkReject, setShowBulkReject] = useState(false)

  const toggleSelection = (artistId: string) => {
    const newSelected = new Set(selectedArtists)
    if (newSelected.has(artistId)) {
      newSelected.delete(artistId)
    } else {
      newSelected.add(artistId)
    }
    setSelectedArtists(newSelected)
  }

  const selectAll = () => {
    setSelectedArtists(new Set(pendingArtists.map(a => a.id)))
  }

  const clearSelection = () => {
    setSelectedArtists(new Set())
  }

  const handleEdit = (artist: PendingArtist) => {
    setEditingArtist(artist.id)
    setEditData(artist)
  }

  const handleSaveEdit = () => {
    if (editingArtist) {
      onApprove(editingArtist, editData)
      setEditingArtist(null)
      setEditData({})
    }
  }

  const handleBulkReject = () => {
    if (selectedArtists.size > 0 && bulkRejectReason.trim()) {
      onBulkReject(Array.from(selectedArtists), bulkRejectReason)
      setSelectedArtists(new Set())
      setBulkRejectReason('')
      setShowBulkReject(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDataSourceIcon = (source: string) => {
    switch (source) {
      case 'crawled': return <Globe className="w-4 h-4" />
      case 'manual': return <Edit className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Artist Review</h2>
          <p className="text-gray-600">
            Review and approve newly discovered artists ({pendingArtists.length} pending)
          </p>
        </div>

        {/* Bulk Actions */}
        {selectedArtists.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedArtists.size} selected
            </span>
            <button
              onClick={() => onBulkApprove(Array.from(selectedArtists))}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Approve Selected
            </button>
            <button
              onClick={() => setShowBulkReject(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Reject Selected
            </button>
            <button
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Selection Controls */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={selectAll}
          className="text-blue-600 hover:text-blue-700"
        >
          Select All
        </button>
        <button
          onClick={clearSelection}
          className="text-gray-600 hover:text-gray-700"
        >
          Clear All
        </button>
        <span className="text-gray-700">
          {selectedArtists.size} of {pendingArtists.length} selected
        </span>
      </div>

      {/* Artist Cards */}
      <div className="space-y-4">
        {pendingArtists.map((artist) => (
          <div
            key={artist.id}
            className={`bg-white rounded-lg shadow border-2 transition-all ${
              selectedArtists.has(artist.id) 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedArtists.has(artist.id)}
                    onChange={() => toggleSelection(artist.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {artist.name_ja || 'No Japanese Name'} / {artist.name_en || 'No English Name'}
                      </h3>
                      
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(artist.confidence_score)}`}>
                        {getDataSourceIcon(artist.data_source || 'crawled')}
                        <span>{artist.confidence_score}% confidence</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {artist.location || 'Unknown Location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Discovered {new Date(artist.discovered_at).toLocaleDateString()}
                      </span>
                      <a
                        href={artist.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Source
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(artist)}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => onApprove(artist.id)}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(artist.id, 'Manual rejection')}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Artist Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Bio Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Biography</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-700">JP:</span>
                      <p className="text-gray-700">{artist.bio_ja || 'Not found'}</p>
                    </div>
                    <div>
                      <span className="text-gray-700">EN:</span>
                      <p className="text-gray-700">{artist.bio_en || 'Not found'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact</h4>
                  <div className="space-y-2 text-sm">
                    {artist.contact_info?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-600" />
                        <span>{artist.contact_info.email}</span>
                      </div>
                    )}
                    {artist.contact_info?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-600" />
                        <span>{artist.contact_info.phone}</span>
                      </div>
                    )}
                    {artist.instagram_handle && (
                      <div className="flex items-center gap-2">
                        <Instagram className="w-3 h-3 text-gray-600" />
                        <span>{artist.instagram_handle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pricing</h4>
                  <div className="space-y-2 text-sm">
                    {artist.pricing_info?.price_range && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-gray-600" />
                        <span>{artist.pricing_info.price_range}</span>
                      </div>
                    )}
                    {artist.pricing_info?.session_minimum && (
                      <div className="text-gray-600">
                        Min: {artist.pricing_info.session_minimum}
                      </div>
                    )}
                    {artist.pricing_info?.consultation_fee && (
                      <div className="text-gray-600">
                        Consultation: {artist.pricing_info.consultation_fee}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Styles */}
              {artist.styles && artist.styles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {artist.styles.map((style, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Images Preview */}
              {artist.portfolio_images && artist.portfolio_images.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Portfolio ({artist.portfolio_images.length} images)</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {artist.portfolio_images.slice(0, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ))}
                    {artist.portfolio_images.length > 5 && (
                      <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-700">
                        +{artist.portfolio_images.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pendingArtists.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No artists pending review at the moment.</p>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject {selectedArtists.size} Artists
            </h3>
            <textarea
              placeholder="Reason for rejection..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="w-full h-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowBulkReject(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReject}
                disabled={!bulkRejectReason.trim()}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingArtist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Artist Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Japanese)
                </label>
                <input
                  type="text"
                  value={editData.name_ja || ''}
                  onChange={(e) => setEditData({...editData, name_ja: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={editData.name_en || ''}
                  onChange={(e) => setEditData({...editData, name_en: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (Japanese)
                </label>
                <textarea
                  value={editData.bio_ja || ''}
                  onChange={(e) => setEditData({...editData, bio_ja: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (English)
                </label>
                <textarea
                  value={editData.bio_en || ''}
                  onChange={(e) => setEditData({...editData, bio_en: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingArtist(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Check className="w-4 h-4" />
                Save & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}