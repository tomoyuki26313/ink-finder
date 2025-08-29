'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { StructuredData } from './SEO/StructuredData'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const { language } = useLanguage()
  
  // Add home as first item if not present
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: language === 'ja' ? 'ホーム' : 'Home', url: `/${language}` },
    ...items
  ]

  // Structure data for breadcrumb
  const structuredDataItems = breadcrumbItems.map((item, index) => ({
    name: item.name,
    url: `https://www.ink-finder.com${item.url}`
  }))

  return (
    <>
      <StructuredData type="breadcrumb" data={structuredDataItems} locale={language} />
      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
      >
        <ol className="flex items-center space-x-1" itemScope itemType="https://schema.org/BreadcrumbList">
          {breadcrumbItems.map((item, index) => (
            <li 
              key={index} 
              className="flex items-center space-x-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index === 0 ? (
                <Home className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              
              {index === breadcrumbItems.length - 1 ? (
                <span 
                  className="text-gray-800 font-medium"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-purple-600 transition-colors"
                  itemProp="item"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}