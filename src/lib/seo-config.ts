// SEO Configuration for Ink Finder
// Centralized SEO settings for Japanese and English versions

export const seoConfig = {
  ja: {
    title: {
      default: 'Ink Finder - 日本のタトゥーアーティスト検索',
      template: '%s | Ink Finder'
    },
    description: '日本全国のタトゥーアーティスト・彫師を簡単検索。東京、大阪、名古屋など地域別、和彫り、ブラックワーク、リアリスティックなどスタイル別で、あなたにぴったりのアーティストを見つけよう。',
    keywords: [
      'タトゥー',
      '彫師',
      '刺青',
      '和彫り',
      'タトゥーアーティスト',
      'タトゥースタジオ',
      '東京 タトゥー',
      '大阪 タトゥー',
      '名古屋 タトゥー',
      '日本 タトゥー',
      'トライバル',
      'ブラックワーク',
      'リアリスティック',
      'ニュースクール',
      'オールドスクール',
      'ドットワーク',
      'ファインライン',
      'タトゥー デザイン',
      'タトゥー 料金',
      'タトゥー 予約'
    ],
    openGraph: {
      title: 'Ink Finder - 日本のタトゥーアーティスト検索プラットフォーム',
      description: '日本全国のタトゥーアーティストを検索。スタイル、地域、価格帯から理想のアーティストを見つけよう。',
      locale: 'ja-JP'
    }
  },
  en: {
    title: {
      default: 'Ink Finder - Japanese Tattoo Artists Directory',
      template: '%s | Ink Finder'
    },
    description: 'Find the best tattoo artists in Japan. Search by location (Tokyo, Osaka, Kyoto), style (Japanese traditional, blackwork, realism), and read reviews. English-speaking artists available.',
    keywords: [
      'Japanese tattoo',
      'tattoo Japan',
      'Tokyo tattoo',
      'Osaka tattoo',
      'Kyoto tattoo',
      'Japanese tattoo artist',
      'irezumi',
      'traditional Japanese tattoo',
      'tattoo studio Japan',
      'English speaking tattoo Japan',
      'Japan tattoo convention',
      'yakuza tattoo',
      'Japanese sleeve tattoo',
      'koi tattoo',
      'dragon tattoo Japan',
      'cherry blossom tattoo',
      'samurai tattoo',
      'geisha tattoo',
      'tattoo price Japan',
      'tattoo booking Japan',
      'foreigner friendly tattoo Japan'
    ],
    openGraph: {
      title: 'Ink Finder - Find Tattoo Artists in Japan',
      description: 'Discover talented tattoo artists across Japan. English-speaking artists, traditional Japanese designs, and modern styles. Book your tattoo experience in Tokyo, Osaka, and beyond.',
      locale: 'en-US'
    }
  }
};

// Structured Data Templates
export const structuredData = {
  website: (locale: 'ja' | 'en') => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ink Finder',
    description: seoConfig[locale].description,
    url: locale === 'ja' ? 'https://www.ink-finder.com/ja' : 'https://www.ink-finder.com/en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://www.ink-finder.com/${locale}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: locale === 'ja' ? 'ja-JP' : 'en-US'
  }),

  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ink Finder',
    url: 'https://www.ink-finder.com',
    logo: 'https://www.ink-finder.com/logo.png',
    sameAs: [
      'https://www.instagram.com/inkfinder_jp',
      'https://twitter.com/inkfinder_jp',
      'https://www.facebook.com/inkfinderjapan'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Japanese', 'English']
    }
  },

  artist: (artist: any, locale: 'ja' | 'en') => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    jobTitle: locale === 'ja' ? 'タトゥーアーティスト' : 'Tattoo Artist',
    worksFor: {
      '@type': 'TattooParlor',
      name: artist.studio || 'Independent',
      address: {
        '@type': 'PostalAddress',
        addressLocality: artist.city,
        addressCountry: 'JP'
      }
    },
    image: artist.profileImage,
    sameAs: artist.instagram ? [`https://www.instagram.com/${artist.instagram}`] : [],
    knowsAbout: artist.styles,
    description: artist.bio
  }),

  blogPost: (post: any, locale: 'ja' | 'en') => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Ink Finder'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ink Finder',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ink-finder.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.ink-finder.com/${locale}/blog/${post.slug}`
    },
    inLanguage: locale === 'ja' ? 'ja-JP' : 'en-US'
  }),

  breadcrumb: (items: Array<{name: string, url: string}>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  })
};

// Meta tag generators
export function generateMetaTags(locale: 'ja' | 'en', page?: string) {
  const config = seoConfig[locale];
  
  return {
    title: page ? `${page} | Ink Finder` : config.title.default,
    description: config.description,
    keywords: config.keywords.join(', '),
    openGraph: {
      ...config.openGraph,
      type: 'website',
      url: `https://www.ink-finder.com/${locale}`,
      images: [
        {
          url: 'https://www.ink-finder.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: locale === 'ja' ? 'Ink Finder - 日本のタトゥーアーティスト検索' : 'Ink Finder - Japanese Tattoo Artists'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: config.openGraph.title,
      description: config.openGraph.description,
      images: ['https://www.ink-finder.com/og-image.jpg']
    },
    alternates: {
      canonical: `https://www.ink-finder.com/${locale}`,
      languages: {
        'ja': 'https://www.ink-finder.com/ja',
        'en': 'https://www.ink-finder.com/en',
        'x-default': 'https://www.ink-finder.com'
      }
    }
  };
}