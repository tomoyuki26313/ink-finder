'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Image, Eye } from 'lucide-react'
import { BlogPost, BlogCategory, BlogFormData } from '@/types/blog'

interface BlogFormProps {
  post?: BlogPost
  onSave: (postData: BlogFormData) => Promise<void>
  onCancel: () => void
}

const categories: { value: BlogCategory; label_ja: string; label_en: string }[] = [
  { value: 'news', label_ja: 'ニュース', label_en: 'News' },
  { value: 'artist-feature', label_ja: 'アーティスト特集', label_en: 'Artist Feature' },
  { value: 'style-guide', label_ja: 'スタイルガイド', label_en: 'Style Guide' },
  { value: 'care-tips', label_ja: 'ケア方法', label_en: 'Care Tips' },
  { value: 'culture', label_ja: 'タトゥー文化', label_en: 'Tattoo Culture' },
  { value: 'event', label_ja: 'イベント', label_en: 'Event' },
  { value: 'other', label_ja: 'その他', label_en: 'Other' }
]

export default function BlogForm({ post, onSave, onCancel }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>({
    slug: post?.slug || '',
    title_ja: post?.title_ja || '',
    title_en: post?.title_en || '',
    content_ja: post?.content_ja || '',
    content_en: post?.content_en || '',
    excerpt_ja: post?.excerpt_ja || '',
    excerpt_en: post?.excerpt_en || '',
    featured_image: post?.featured_image || '',
    category: post?.category || 'other',
    tags: post?.tags || [],
    author: post?.author || 'Admin',
    published: post?.published || false,
    published_at: post?.published_at
  })

  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState<'ja' | 'en' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title_ja.trim()) {
      newErrors.title_ja = 'Japanese title is required'
    }
    if (!formData.title_en.trim()) {
      newErrors.title_en = 'English title is required'
    }
    if (!formData.content_ja.trim()) {
      newErrors.content_ja = 'Japanese content is required'
    }
    if (!formData.content_en.trim()) {
      newErrors.content_en = 'English content is required'
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug is required'
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
    } catch (error) {
      console.error('Error saving blog post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const generateSlug = () => {
    const slug = formData.title_en.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setFormData({ ...formData, slug })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {post ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title_ja" className="block text-sm font-medium text-gray-900 mb-1">
              Japanese Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title_ja"
              value={formData.title_ja}
              onChange={(e) => setFormData({ ...formData, title_ja: e.target.value })}
              className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.title_ja ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="記事のタイトル"
            />
            {errors.title_ja && (
              <p className="mt-1 text-sm text-red-600">{errors.title_ja}</p>
            )}
          </div>

          <div>
            <label htmlFor="title_en" className="block text-sm font-medium text-gray-900 mb-1">
              English Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title_en"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.title_en ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Article Title"
            />
            {errors.title_en && (
              <p className="mt-1 text-sm text-red-600">{errors.title_en}</p>
            )}
          </div>
        </div>

        {/* URL Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-1">
            URL Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className={`flex-1 px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="article-url-slug"
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Generate from Title
            </button>
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
          )}
        </div>

        {/* Excerpt Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="excerpt_ja" className="block text-sm font-medium text-gray-900 mb-1">
              Japanese Excerpt
            </label>
            <textarea
              id="excerpt_ja"
              value={formData.excerpt_ja}
              onChange={(e) => setFormData({ ...formData, excerpt_ja: e.target.value })}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="記事の概要（一覧表示用）"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="excerpt_en" className="block text-sm font-medium text-gray-900 mb-1">
              English Excerpt
            </label>
            <textarea
              id="excerpt_en"
              value={formData.excerpt_en}
              onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Article summary (for list view)"
              rows={3}
            />
          </div>
        </div>

        {/* Content Fields with Preview */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="content_ja" className="block text-sm font-medium text-gray-900">
                Japanese Content <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPreviewMode(previewMode === 'ja' ? null : 'ja')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4" />
                {previewMode === 'ja' ? 'Edit' : 'Preview'}
              </button>
            </div>
            {previewMode === 'ja' ? (
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px] prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formData.content_ja.replace(/\n/g, '<br>') }} />
              </div>
            ) : (
              <textarea
                id="content_ja"
                value={formData.content_ja}
                onChange={(e) => setFormData({ ...formData, content_ja: e.target.value })}
                className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.content_ja ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="記事の本文"
                rows={10}
              />
            )}
            {errors.content_ja && (
              <p className="mt-1 text-sm text-red-600">{errors.content_ja}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="content_en" className="block text-sm font-medium text-gray-900">
                English Content <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPreviewMode(previewMode === 'en' ? null : 'en')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4" />
                {previewMode === 'en' ? 'Edit' : 'Preview'}
              </button>
            </div>
            {previewMode === 'en' ? (
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px] prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formData.content_en.replace(/\n/g, '<br>') }} />
              </div>
            ) : (
              <textarea
                id="content_en"
                value={formData.content_en}
                onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.content_en ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Article content"
                rows={10}
              />
            )}
            {errors.content_en && (
              <p className="mt-1 text-sm text-red-600">{errors.content_en}</p>
            )}
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <label htmlFor="featured_image" className="block text-sm font-medium text-gray-900 mb-1">
            Featured Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="featured_image"
              value={formData.featured_image}
              onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
              className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.featured_image && (
              <a
                href={formData.featured_image}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                View
              </a>
            )}
          </div>
        </div>

        {/* Category and Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as BlogCategory })}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label_en} / {cat.label_ja}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-900 mb-1">
              Author
            </label>
            <input
              type="text"
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Author Name"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-red-600 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Publish Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-900">
            Publish this post
          </label>
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
                {post ? 'Update' : 'Create'} Post
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}