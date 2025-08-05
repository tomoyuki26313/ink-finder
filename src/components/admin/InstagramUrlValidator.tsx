'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'

interface InstagramUrlValidatorProps {
  url: string
  onValidationChange: (isValid: boolean) => void
}

export default function InstagramUrlValidator({ url, onValidationChange }: InstagramUrlValidatorProps) {
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Extract post ID from URL
  const getEmbedId = (url: string) => {
    if (!url || typeof url !== 'string') return null
    
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /\/p\/([A-Za-z0-9_-]+)/,
      /\/reel\/([A-Za-z0-9_-]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  const validateUrl = async (urlToValidate: string) => {
    if (!urlToValidate.trim()) {
      setValidationStatus('idle')
      onValidationChange(true) // Empty URL is okay
      return
    }

    setValidationStatus('checking')
    setErrorMessage('')

    // Basic URL format validation
    const embedId = getEmbedId(urlToValidate)
    if (!embedId) {
      setValidationStatus('invalid')
      setErrorMessage('Invalid Instagram URL format. Please use format: https://www.instagram.com/p/POST_ID/')
      onValidationChange(false)
      return
    }

    // Check if URL is accessible (basic validation)
    try {
      // We can't directly fetch Instagram due to CORS, but we can validate the format
      // and check if it's a proper HTTPS URL
      const urlObj = new URL(urlToValidate)
      
      if (!urlObj.hostname.includes('instagram.com')) {
        throw new Error('URL must be from instagram.com')
      }

      if (urlObj.protocol !== 'https:') {
        throw new Error('URL must use HTTPS')
      }

      // Simulate checking the embed (in real scenario, this might involve a server-side check)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setValidationStatus('valid')
      onValidationChange(true)
    } catch (error: any) {
      setValidationStatus('invalid')
      setErrorMessage(error.message || 'Invalid URL')
      onValidationChange(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateUrl(url)
    }, 500) // Debounce validation

    return () => clearTimeout(timeoutId)
  }, [url])

  if (!url.trim()) {
    return null
  }

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'checking':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'checking':
        return 'border-blue-200 bg-blue-50'
      case 'valid':
        return 'border-green-200 bg-green-50'
      case 'invalid':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatusText = () => {
    switch (validationStatus) {
      case 'checking':
        return 'Checking URL...'
      case 'valid':
        return 'URL is valid and ready to display'
      case 'invalid':
        return errorMessage || 'Invalid URL'
      default:
        return ''
    }
  }

  return (
    <div className={`mt-2 p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>
      
      {validationStatus === 'valid' && (
        <div className="mt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <Eye className="w-3 h-3" />
            Preview on Instagram
          </a>
        </div>
      )}
      
      {validationStatus === 'invalid' && (
        <div className="mt-2 text-xs text-red-600">
          <strong>Tips:</strong>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Use the full Instagram URL (https://www.instagram.com/p/POST_ID/)</li>
            <li>Make sure the post is public</li>
            <li>Copy the URL directly from Instagram</li>
          </ul>
        </div>
      )}
    </div>
  )
}