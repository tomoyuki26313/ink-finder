'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { Style } from '@/types/database'

interface StyleFormProps {
  style: Style | null
  onSave: (styleData: Omit<Style, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
}

export default function StyleForm({ style, onSave, onCancel }: StyleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    style_name_ja: '',
    style_name_en: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (style) {
      setFormData({
        style_name_ja: style.style_name_ja,
        style_name_en: style.style_name_en
      })
    }
  }, [style])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.style_name_ja.trim()) {
      newErrors.style_name_ja = 'Japanese name is required'
    }
    if (!formData.style_name_en.trim()) {
      newErrors.style_name_en = 'English name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (error: any) {
      console.error('Error saving style:', {
        message: error?.message,
        error: error
      })
      alert(`Error saving style: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {style ? 'Edit Style' : 'Add New Style'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Japanese Name */}
        <div>
          <label htmlFor="style_name_ja" className="block text-sm font-medium text-gray-900 mb-1">
            Japanese Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="style_name_ja"
            value={formData.style_name_ja}
            onChange={(e) => setFormData({ ...formData, style_name_ja: e.target.value })}
            className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600 ${
              errors.style_name_ja ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="例: 和彫り"
          />
          {errors.style_name_ja && (
            <p className="mt-1 text-sm text-red-600">{errors.style_name_ja}</p>
          )}
        </div>

        {/* English Name */}
        <div>
          <label htmlFor="style_name_en" className="block text-sm font-medium text-gray-900 mb-1">
            English Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="style_name_en"
            value={formData.style_name_en}
            onChange={(e) => setFormData({ ...formData, style_name_en: e.target.value })}
            className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600 ${
              errors.style_name_en ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Japanese Traditional"
          />
          {errors.style_name_en && (
            <p className="mt-1 text-sm text-red-600">{errors.style_name_en}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {style ? 'Update Style' : 'Create Style'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}