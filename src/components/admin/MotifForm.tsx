'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Motif } from '@/types/database'

interface MotifFormProps {
  motif: Motif | null
  onSave: (motifData: Omit<Motif, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export default function MotifForm({ motif, onSave, onCancel }: MotifFormProps) {
  const [formData, setFormData] = useState({
    motif_name_ja: '',
    motif_name_en: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (motif) {
      setFormData({
        motif_name_ja: motif.motif_name_ja || '',
        motif_name_en: motif.motif_name_en || ''
      })
    } else {
      setFormData({
        motif_name_ja: '',
        motif_name_en: ''
      })
    }
    setErrors({})
  }, [motif])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.motif_name_ja.trim()) {
      newErrors.motif_name_ja = 'Japanese name is required'
    }

    if (!formData.motif_name_en.trim()) {
      newErrors.motif_name_en = 'English name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSave({
      motif_name_ja: formData.motif_name_ja.trim(),
      motif_name_en: formData.motif_name_en.trim()
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {motif ? 'Edit Motif' : 'Add New Motif'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Japanese Name */}
          <div>
            <label htmlFor="motif_name_ja" className="block text-sm font-medium text-gray-700 mb-2">
              Japanese Name *
            </label>
            <input
              type="text"
              id="motif_name_ja"
              value={formData.motif_name_ja}
              onChange={(e) => handleInputChange('motif_name_ja', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.motif_name_ja ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. 龍"
            />
            {errors.motif_name_ja && (
              <p className="text-red-500 text-xs mt-1">{errors.motif_name_ja}</p>
            )}
          </div>

          {/* English Name */}
          <div>
            <label htmlFor="motif_name_en" className="block text-sm font-medium text-gray-700 mb-2">
              English Name *
            </label>
            <input
              type="text"
              id="motif_name_en"
              value={formData.motif_name_en}
              onChange={(e) => handleInputChange('motif_name_en', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.motif_name_en ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. Dragon"
            />
            {errors.motif_name_en && (
              <p className="text-red-500 text-xs mt-1">{errors.motif_name_en}</p>
            )}
          </div>
        </div>

        {/* Common Motifs Reference */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Common Tattoo Motifs</h3>
          <div className="text-xs text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>龍 (Dragon)</div>
            <div>虎 (Tiger)</div>
            <div>鯉 (Koi)</div>
            <div>桜 (Cherry Blossom)</div>
            <div>般若 (Hannya)</div>
            <div>鳳凰 (Phoenix)</div>
            <div>蛇 (Snake)</div>
            <div>狼 (Wolf)</div>
            <div>薔薇 (Rose)</div>
            <div>蝶 (Butterfly)</div>
            <div>髑髏 (Skull)</div>
            <div>観音 (Kannon)</div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {motif ? 'Update Motif' : 'Create Motif'}
          </button>
        </div>
      </form>
    </div>
  )
}