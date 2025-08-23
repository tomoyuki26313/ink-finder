'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Tag, User, ArrowLeft, Share2, Eye } from 'lucide-react'
import { BlogPost } from '@/types/blog'

const categoryLabels = {
  'news': 'News',
  'artist-feature': 'Artist Feature',
  'style-guide': 'Style Guide',
  'care-tips': 'Care Tips',
  'culture': 'Tattoo Culture',
  'event': 'Events',
  'other': 'Other'
}

export default function EnglishBlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (params.slug) {
      loadPost(params.slug as string)
    }
  }, [params.slug])

  const loadPost = async (slug: string) => {
    try {
      // Load specific post
      const response = await fetch(`/api/blog?slug=${slug}`)
      if (response.ok) {
        const postData = await response.json()
        if (postData && postData.published) {
          setPost(postData)
          await loadRelatedPosts(postData.category, postData.id)
        } else {
          setNotFound(true)
        }
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Error loading blog post:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedPosts = async (category: string, currentPostId: string) => {
    try {
      const response = await fetch(`/api/blog?published=true&category=${category}`)
      if (response.ok) {
        const posts = await response.json()
        const filtered = posts.filter((p: BlogPost) => p.id !== currentPostId).slice(0, 3)
        setRelatedPosts(filtered)
      }
    } catch (error) {
      console.error('Error loading related posts:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title_en,
          text: post.excerpt_en,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert('URL copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E6E6E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#E6E6E6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-8">Article not found</p>
          <Link
            href="/en/blog"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E6E6E6]">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/en/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Category */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-black text-white text-sm rounded-full">
                {categoryLabels[post.category as keyof typeof categoryLabels]}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title_en}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
              {post.view_count > 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{post.view_count.toLocaleString()} views</span>
                </div>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="container mx-auto px-4 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title_en}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-lg p-8 md:p-12 shadow-sm">
            {/* Excerpt */}
            {post.excerpt_en && (
              <div className="text-xl text-gray-700 leading-relaxed mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-black">
                {post.excerpt_en}
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none text-gray-900 leading-relaxed"
              style={{
                lineHeight: '1.8',
                fontSize: '18px'
              }}
              dangerouslySetInnerHTML={{ 
                __html: post.content_en.replace(/\n/g, '<br><br>') 
              }}
            />
          </article>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {relatedPost.featured_image && (
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={relatedPost.featured_image}
                        alt={relatedPost.title_en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-black text-white text-xs rounded-full">
                        {categoryLabels[relatedPost.category as keyof typeof categoryLabels]}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {relatedPost.title_en}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {relatedPost.excerpt_en}
                    </p>

                    <Link
                      href={`/en/blog/${relatedPost.slug}`}
                      className="text-black hover:underline text-sm font-medium"
                    >
                      Read More →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}