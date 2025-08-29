'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  loading?: 'eager' | 'lazy'
}

export default function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  objectFit = 'cover',
  loading = 'lazy'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // If priority, load immediately
  const imgRef = useRef<HTMLDivElement>(null)

  // Generate blur data URL if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli5xnqTiiuVmgSGVyT8+zX/a'

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [priority, isInView])

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className={`bg-gray-200 animate-pulse ${className}`} style={{ width, height }} />
  )

  // Error fallback component
  const ErrorFallback = () => (
    <div 
      className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">📷</div>
        <p className="text-xs">Failed to load</p>
      </div>
    </div>
  )

  if (hasError) {
    return <ErrorFallback />
  }

  if (!isInView && !priority) {
    return (
      <div ref={imgRef}>
        <LoadingSkeleton />
      </div>
    )
  }

  const imageProps = {
    src,
    alt,
    quality,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    onLoad: () => setIsLoading(false),
    onError: () => setHasError(true),
    placeholder: placeholder as any,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    priority,
    sizes,
    ...(fill ? { fill: true, style: { objectFit } } : { width, height }),
  }

  return (
    <div ref={imgRef} className="relative overflow-hidden">
      {isLoading && <LoadingSkeleton />}
      <Image {...imageProps} />
    </div>
  )
}