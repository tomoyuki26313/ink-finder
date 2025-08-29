// Dynamic Metadata Component for Ink Finder
// Handles page-specific SEO metadata

import { Metadata } from 'next';
import { seoConfig, generateMetaTags } from '@/lib/seo-config';

interface PageSEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  locale: 'ja' | 'en';
  path: string;
}

export function generatePageMetadata({
  title,
  description,
  image,
  article = false,
  publishedTime,
  modifiedTime,
  locale,
  path
}: PageSEOProps): Metadata {
  const config = seoConfig[locale];
  const siteUrl = 'https://www.ink-finder.com';
  const url = `${siteUrl}/${locale}${path}`;
  
  const pageTitle = title 
    ? `${title} | Ink Finder`
    : config.title.default;
    
  const pageDescription = description || config.description;
  const pageImage = image || '/og-image.jpg';

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: config.keywords,
    authors: [{ name: 'Ink Finder' }],
    creator: 'Ink Finder',
    publisher: 'Ink Finder',
    
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: 'Ink Finder',
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      type: article ? 'article' : 'website',
      images: [
        {
          url: pageImage.startsWith('http') ? pageImage : `${siteUrl}${pageImage}`,
          width: 1200,
          height: 630,
          alt: pageTitle
        }
      ],
      ...(article && {
        publishedTime,
        modifiedTime,
        authors: ['Ink Finder']
      })
    },
    
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage.startsWith('http') ? pageImage : `${siteUrl}${pageImage}`],
      creator: '@inkfinder_jp'
    },
    
    alternates: {
      canonical: url,
      languages: {
        'ja': `${siteUrl}/ja${path}`,
        'en': `${siteUrl}/en${path}`,
        'x-default': `${siteUrl}${path}`
      }
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

// Artist page metadata generator
export function generateArtistMetadata(artist: any, locale: 'ja' | 'en'): Metadata {
  const isJapanese = locale === 'ja';
  
  const title = isJapanese 
    ? `${artist.name} - ${artist.styles?.join('・')} タトゥーアーティスト`
    : `${artist.name} - ${artist.styles?.join(', ')} Tattoo Artist`;
    
  const description = isJapanese
    ? `${artist.name}は${artist.city}を拠点に活動する${artist.styles?.join('、')}を得意とするタトゥーアーティストです。作品ギャラリー、料金、予約方法をご覧ください。`
    : `${artist.name} is a tattoo artist based in ${artist.city}, specializing in ${artist.styles?.join(', ')}. View portfolio, pricing, and booking information.`;

  return generatePageMetadata({
    title,
    description,
    image: artist.profileImage,
    locale,
    path: `/artists/${artist.slug}`
  });
}

// Blog post metadata generator
export function generateBlogMetadata(post: any, locale: 'ja' | 'en'): Metadata {
  return generatePageMetadata({
    title: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    article: true,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    locale,
    path: `/blog/${post.slug}`
  });
}

// Search results metadata generator
export function generateSearchMetadata(query: string, locale: 'ja' | 'en'): Metadata {
  const isJapanese = locale === 'ja';
  
  const title = isJapanese
    ? `「${query}」の検索結果`
    : `Search results for "${query}"`;
    
  const description = isJapanese
    ? `${query}に関連するタトゥーアーティスト、スタジオ、作品を検索しています。日本全国から最適な結果をお届けします。`
    : `Find tattoo artists, studios, and designs related to ${query}. Discover the best matches across Japan.`;

  return generatePageMetadata({
    title,
    description,
    locale,
    path: `/search?q=${encodeURIComponent(query)}`
  });
}