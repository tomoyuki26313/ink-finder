'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Studio } from '@/types/database'

interface StudioFormProps {
  studio?: Studio | null
  onSave: (studioData: Omit<Studio, 'id' | 'created_at' | 'view_count'>) => void
  onCancel: () => void
}

const locations = [...new Set([
  '東京', '大阪', '京都', '神奈川', '愛知', '福岡', '埼玉', '千葉', '宮城', '沖縄', '滋賀'
])]

export default function StudioForm({ studio, onSave, onCancel }: StudioFormProps) {
  const [formData, setFormData] = useState({
    name_ja: '',
    name_en: '',
    bio_ja: '',
    bio_en: '',
    location: '東京',
    address_ja: '',
    address_en: '',
    instagram_handle: '',
    instagram_posts: ['', '', ''],
    phone: '',
    website: '',
    // Studio amenities
    speaks_english: false,
    speaks_chinese: false,
    speaks_korean: false,
    lgbtq_friendly: false,
    same_day_booking: false,
    private_room: false,
    parking_available: false,
    credit_card_accepted: false,
    digital_payment_accepted: false,
    late_night_hours: false,
    weekend_hours: false,
    jagua_tattoo: false
  })

  useEffect(() => {
    if (studio) {
      setFormData({
        name_ja: studio.name_ja,
        name_en: studio.name_en,
        bio_ja: studio.bio_ja,
        bio_en: studio.bio_en,
        location: studio.location,
        address_ja: studio.address_ja,
        address_en: studio.address_en,
        instagram_handle: studio.instagram_handle,
        instagram_posts: [...studio.instagram_posts, '', '', ''].slice(0, 3),
        phone: studio.phone || '',
        website: studio.website || '',
        speaks_english: studio.speaks_english || false,
        speaks_chinese: studio.speaks_chinese || false,
        speaks_korean: studio.speaks_korean || false,
        lgbtq_friendly: studio.lgbtq_friendly || false,
        same_day_booking: studio.same_day_booking || false,
        private_room: studio.private_room || false,
        parking_available: studio.parking_available || false,
        credit_card_accepted: studio.credit_card_accepted || false,
        digital_payment_accepted: studio.digital_payment_accepted || false,
        late_night_hours: studio.late_night_hours || false,
        weekend_hours: studio.weekend_hours || false,
        jagua_tattoo: studio.jagua_tattoo || false
      })
    }
  }, [studio])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const cleanedData = {
      ...formData,
      instagram_posts: formData.instagram_posts.filter(post => post.trim() !== '')
    }

    onSave(cleanedData)
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.instagram_posts]
    newImages[index] = value
    setFormData(prev => ({ ...prev, instagram_posts: newImages }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {studio ? 'Edit Studio' : 'Add New Studio'}
        </h2>
        <button onClick={onCancel} className="text-gray-600 hover:text-gray-800">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Studio Name (Japanese) *
            </label>
            <input
              type="text"
              required
              value={formData.name_ja}
              onChange={(e) => setFormData(prev => ({ ...prev, name_ja: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Studio Name (English) *
            </label>
            <input
              type="text"
              required
              value={formData.name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio (Japanese)
            </label>
            <textarea
              rows={3}
              value={formData.bio_ja}
              onChange={(e) => setFormData(prev => ({ ...prev, bio_ja: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional: Studio description in Japanese"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio (English)
            </label>
            <textarea
              rows={3}
              value={formData.bio_en}
              onChange={(e) => setFormData(prev => ({ ...prev, bio_en: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional: Studio description in English"
            />
          </div>
        </div>

        {/* Location and Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <select
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {locations.map((location, index) => (
              <option key={`${location}-${index}`} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address (Japanese)
            </label>
            <input
              type="text"
              value={formData.address_ja}
              onChange={(e) => setFormData(prev => ({ ...prev, address_ja: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address (English)
            </label>
            <input
              type="text"
              value={formData.address_en}
              onChange={(e) => setFormData(prev => ({ ...prev, address_en: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
            <input
              type="text"
              placeholder="@studioname"
              value={formData.instagram_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
            />
          </div>
        </div>

        {/* Instagram Posts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Post URLs</label>
          <p className="text-sm text-gray-600 mb-3">
            Add Instagram post URLs for the studio's work showcase.
          </p>
          <div className="space-y-2">
            {formData.instagram_posts.map((postUrl, index) => (
              <input
                key={index}
                type="url"
                placeholder={`https://www.instagram.com/p/ABC123${index + 1}/`}
                value={postUrl}
                onChange={(e) => updateImage(index, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700"
              />
            ))}
          </div>
        </div>

        {/* Studio Features */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Studio Features & Services</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Language Support</h4>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.speaks_english}
                    onChange={(e) => setFormData(prev => ({ ...prev, speaks_english: e.target.checked }))}
                    className="mr-2"
                  />
                  English
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.speaks_chinese}
                    onChange={(e) => setFormData(prev => ({ ...prev, speaks_chinese: e.target.checked }))}
                    className="mr-2"
                  />
                  Chinese
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.speaks_korean}
                    onChange={(e) => setFormData(prev => ({ ...prev, speaks_korean: e.target.checked }))}
                    className="mr-2"
                  />
                  Korean
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Studio Amenities</h4>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.lgbtq_friendly}
                    onChange={(e) => setFormData(prev => ({ ...prev, lgbtq_friendly: e.target.checked }))}
                    className="mr-2"
                  />
                  LGBTQ+ Friendly
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.same_day_booking}
                    onChange={(e) => setFormData(prev => ({ ...prev, same_day_booking: e.target.checked }))}
                    className="mr-2"
                  />
                  Same Day Booking
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.private_room}
                    onChange={(e) => setFormData(prev => ({ ...prev, private_room: e.target.checked }))}
                    className="mr-2"
                  />
                  Private Room
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.parking_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, parking_available: e.target.checked }))}
                    className="mr-2"
                  />
                  Parking Available
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.credit_card_accepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, credit_card_accepted: e.target.checked }))}
                    className="mr-2"
                  />
                  Credit Card Accepted
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.digital_payment_accepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, digital_payment_accepted: e.target.checked }))}
                    className="mr-2"
                  />
                  Digital Payment
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.late_night_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, late_night_hours: e.target.checked }))}
                    className="mr-2"
                  />
                  Late Night Hours
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.weekend_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekend_hours: e.target.checked }))}
                    className="mr-2"
                  />
                  Weekend Hours
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.jagua_tattoo}
                    onChange={(e) => setFormData(prev => ({ ...prev, jagua_tattoo: e.target.checked }))}
                    className="mr-2"
                  />
                  Jagua Tattoo
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {studio ? 'Update Studio' : 'Add Studio'}
          </button>
        </div>
      </form>
    </div>
  )
}