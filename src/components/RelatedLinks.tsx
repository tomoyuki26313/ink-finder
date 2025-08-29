'use client'

import Link from 'next/link'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface RelatedLink {
  title: string
  href: string
  description?: string
  external?: boolean
}

interface RelatedLinksProps {
  title?: string
  links: RelatedLink[]
  className?: string
  variant?: 'grid' | 'list'
}

export default function RelatedLinks({ 
  title, 
  links, 
  className = '',
  variant = 'grid'
}: RelatedLinksProps) {
  const { language } = useLanguage()

  const defaultTitle = language === 'ja' ? '関連リンク' : 'Related Links'

  if (links.length === 0) return null

  const LinkItem = ({ link }: { link: RelatedLink }) => (
    <Link
      href={link.href}
      className={`
        group p-4 rounded-lg border border-gray-200 bg-white hover:border-purple-300 
        hover:shadow-md transition-all duration-200 block
        ${variant === 'list' ? 'flex items-center justify-between' : ''}
      `}
      {...(link.external && { 
        target: '_blank', 
        rel: 'noopener noreferrer' 
      })}
    >
      <div className={variant === 'list' ? 'flex-1' : ''}>
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
            {link.title}
          </h3>
          {link.external && (
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
          )}
        </div>
        {link.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {link.description}
          </p>
        )}
      </div>
      {variant === 'list' && (
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
      )}
    </Link>
  )

  return (
    <section className={`space-y-4 ${className}`}>
      {title !== false && (
        <h2 className="text-xl font-bold text-gray-900">
          {title || defaultTitle}
        </h2>
      )}
      
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link, index) => (
            <LinkItem key={index} link={link} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <LinkItem key={index} link={link} />
          ))}
        </div>
      )}
    </section>
  )
}

// Predefined link sets for common pages
export const getArtistRelatedLinks = (language: 'ja' | 'en') => {
  const baseUrl = `/${language}`
  
  if (language === 'ja') {
    return [
      {
        title: 'タトゥースタイル一覧',
        href: `${baseUrl}/styles`,
        description: 'トライバル、和彫り、リアリスティックなど様々なスタイルを探す'
      },
      {
        title: '地域別アーティスト',
        href: `${baseUrl}/locations`,
        description: '東京、大阪、京都など地域別でタトゥーアーティストを探す'
      },
      {
        title: 'タトゥースタジオ',
        href: `${baseUrl}/studios`,
        description: '全国のタトゥースタジオを検索'
      }
    ]
  }
  
  return [
    {
      title: 'Tattoo Styles',
      href: `${baseUrl}/styles`,
      description: 'Explore various styles like tribal, traditional Japanese, realism and more'
    },
    {
      title: 'Artists by Location',
      href: `${baseUrl}/locations`, 
      description: 'Find tattoo artists in Tokyo, Osaka, Kyoto and other cities'
    },
    {
      title: 'Tattoo Studios',
      href: `${baseUrl}/studios`,
      description: 'Search tattoo studios across Japan'
    }
  ]
}

export const getStyleRelatedLinks = (styleName: string, language: 'ja' | 'en') => {
  const baseUrl = `/${language}`
  
  if (language === 'ja') {
    return [
      {
        title: `${styleName}のアーティスト`,
        href: `${baseUrl}?styles=${encodeURIComponent(styleName)}`,
        description: `${styleName}を得意とするアーティストを検索`
      },
      {
        title: 'その他のスタイル',
        href: `${baseUrl}/styles`,
        description: '他のタトゥースタイルも見てみる'
      },
      {
        title: 'すべてのアーティスト',
        href: baseUrl,
        description: '全てのタトゥーアーティストを見る'
      }
    ]
  }
  
  return [
    {
      title: `${styleName} Artists`,
      href: `${baseUrl}?styles=${encodeURIComponent(styleName)}`,
      description: `Find artists specializing in ${styleName}`
    },
    {
      title: 'Other Styles',
      href: `${baseUrl}/styles`,
      description: 'Explore other tattoo styles'
    },
    {
      title: 'All Artists',
      href: baseUrl,
      description: 'View all tattoo artists'
    }
  ]
}

export const getLocationRelatedLinks = (locationName: string, language: 'ja' | 'en') => {
  const baseUrl = `/${language}`
  
  if (language === 'ja') {
    return [
      {
        title: `${locationName}のアーティスト`,
        href: `${baseUrl}?location=${encodeURIComponent(locationName)}`,
        description: `${locationName}にあるタトゥーアーティストを検索`
      },
      {
        title: '他の地域',
        href: `${baseUrl}/locations`,
        description: '他の都市のアーティストも探す'
      },
      {
        title: `${locationName}のタトゥー情報`,
        href: `${baseUrl}/blog/tattoo-guide-${locationName.toLowerCase()}`,
        description: `${locationName}でのタトゥー事情やおすすめ情報`
      }
    ]
  }
  
  return [
    {
      title: `Artists in ${locationName}`,
      href: `${baseUrl}?location=${encodeURIComponent(locationName)}`,
      description: `Find tattoo artists located in ${locationName}`
    },
    {
      title: 'Other Locations',
      href: `${baseUrl}/locations`,
      description: 'Explore artists in other cities'
    },
    {
      title: `${locationName} Tattoo Guide`,
      href: `${baseUrl}/blog/tattoo-guide-${locationName.toLowerCase()}`,
      description: `Complete guide to getting tattoos in ${locationName}`
    }
  ]
}