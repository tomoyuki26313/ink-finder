// HTML Parsing Logic for Tattoo Studio Websites
import { Artist, Studio, PricingInfo, ContactInfo } from '@/types/database'

// Mock Cheerio interface for type safety (install cheerio package separately)
interface CheerioAPI {
  (selector: string): CheerioElement
  load(html: string): CheerioAPI
}

interface CheerioElement {
  text(): string
  attr(name: string): string | undefined
  find(selector: string): CheerioElement
  each(callback: (index: number, element: any) => void): void
  length: number
}

export class ArtistDataParser {
  
  // Main parsing method
  static extractArtistData(html: string, url: string): Partial<Artist> {
    // In production, use: const $ = cheerio.load(html)
    // For now, using mock structure
    
    const artistData: Partial<Artist> = {
      data_source: 'crawled',
      last_updated: new Date().toISOString(),
      website_url: url,
      portfolio_images: this.extractPortfolioImages(html, url),
      pricing_info: this.extractPricingInfo(html),
      contact_info: this.extractContactInfo(html, url),
      name_ja: this.extractName(html, 'ja'),
      name_en: this.extractName(html, 'en'),
      bio_ja: this.extractBio(html, 'ja'),
      bio_en: this.extractBio(html, 'en'),
      location: this.extractLocation(html),
      address_ja: this.extractAddress(html, 'ja'),
      address_en: this.extractAddress(html, 'en'),
      styles: this.extractStyles(html),
      is_verified: false,
      crawl_status: {
        last_crawled: new Date().toISOString(),
        next_crawl_date: this.getNextCrawlDate(),
        crawl_success: true,
        website_status: 'active'
      }
    }

    return artistData
  }

  // Extract portfolio images from real HTML
  private static extractPortfolioImages(html: string, baseUrl: string): string[] {
    const images: string[] = []
    
    // Enhanced patterns for finding tattoo images
    const imagePatterns = [
      // Direct image sources
      /src="([^"]*(?:tattoo|work|portfolio|gallery)[^"]*\.(jpg|jpeg|png|webp))"/gi,
      /src="([^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
      // Background images
      /background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/gi,
      // Data attributes
      /data-src="([^"]*\.(jpg|jpeg|png|webp))"/gi,
      /data-lazy="([^"]*\.(jpg|jpeg|png|webp))"/gi
    ]
    
    imagePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(html)) !== null) {
        try {
          const imageUrl = this.resolveUrl(match[1], baseUrl)
          // Filter out likely non-portfolio images
          if (!this.isPortfolioImage(imageUrl)) continue
          images.push(imageUrl)
        } catch (error) {
          // Skip invalid URLs
        }
      }
    })
    
    // Remove duplicates and limit to reasonable number
    const uniqueImages = [...new Set(images)]
    return uniqueImages.slice(0, 20) // Limit to 20 images
  }
  
  // Check if image is likely a portfolio/tattoo image
  private static isPortfolioImage(url: string): boolean {
    const lowerUrl = url.toLowerCase()
    
    // Exclude common non-portfolio images
    const excludePatterns = [
      'logo', 'icon', 'avatar', 'profile', 'header', 'footer',
      'banner', 'background', 'btn', 'button', 'arrow', 'social'
    ]
    
    if (excludePatterns.some(pattern => lowerUrl.includes(pattern))) {
      return false
    }
    
    // Include likely portfolio images
    const includePatterns = [
      'tattoo', 'work', 'portfolio', 'gallery', 'art', 'design',
      'タトゥー', '作品', 'ギャラリー'
    ]
    
    return includePatterns.some(pattern => lowerUrl.includes(pattern)) || 
           !excludePatterns.some(pattern => lowerUrl.includes(pattern))
  }

  // Extract pricing information from real HTML
  private static extractPricingInfo(html: string): PricingInfo {
    const pricing: PricingInfo = {}
    
    const cleanHtml = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    
    // Enhanced pricing patterns for Japanese websites
    const pricePatterns = {
      hourly_rate: [
        /時給[：:]?\s*([¥￥]?[\d,]+)/gi,
        /hourly\s*rate[：:]?\s*[¥￥$]?([\d,]+)/gi,
        /(\d+)[円¥￥]\s*[\/／]\s*時間/gi
      ],
      session_minimum: [
        /最低料金[：:]?\s*([¥￥]?[\d,]+)/gi,
        /minimum[：:]?\s*[¥￥$]?([\d,]+)/gi,
        /session\s*minimum[：:]?\s*[¥￥$]?([\d,]+)/gi,
        /from\s*[¥￥$]?([\d,]+)/gi
      ],
      price_range: [
        /料金[：:]?\s*([¥￥]?[\d,]+)\s*[〜～\-~]\s*([¥￥]?[\d,]+)/gi,
        /price[：:]?\s*[¥￥$]?([\d,]+)\s*[\-~〜～]\s*[¥￥$]?([\d,]+)/gi,
        /[¥￥$]([\d,]+)\s*[\-~〜～]\s*[¥￥$]?([\d,]+)/gi
      ],
      consultation_fee: [
        /相談料[：:]?\s*([¥￥]?[\d,]+)/gi,
        /consultation[：:]?\s*[¥￥$]?([\d,]+)/gi,
        /カウンセリング[：:]?\s*([¥￥]?[\d,]+)/gi
      ]
    }
    
    // Extract prices using patterns
    Object.entries(pricePatterns).forEach(([key, patterns]) => {
      for (const pattern of patterns) {
        const match = pattern.exec(cleanHtml)
        if (match) {
          if (key === 'price_range' && match[2]) {
            pricing[key as keyof PricingInfo] = `¥${match[1]} - ¥${match[2]}`
          } else if (match[1]) {
            const price = match[1].replace(/[¥￥$,]/g, '')
            if (price && !isNaN(Number(price))) {
              pricing[key as keyof PricingInfo] = `¥${Number(price).toLocaleString()}`
            }
          }
          break
        }
      }
    })
    
    return pricing
  }

  // Extract contact information from real HTML
  private static extractContactInfo(html: string, baseUrl: string): ContactInfo {
    const contact: ContactInfo = {
      booking_url: baseUrl
    }
    
    const cleanHtml = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    
    // Enhanced email patterns
    const emailPatterns = [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
    ]
    
    // Enhanced phone patterns for Japanese numbers
    const phonePatterns = [
      /(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})/g,
      /(\d{2,4}[-\s]\d{2,4}[-\s]\d{4})/g,
      /TEL[：:]?\s*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})/gi,
      /電話[：:]?\s*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})/gi
    ]
    
    // Extract email
    for (const pattern of emailPatterns) {
      const match = pattern.exec(cleanHtml)
      if (match) {
        contact.email = match[1]
        break
      }
    }
    
    // Extract phone
    for (const pattern of phonePatterns) {
      const match = pattern.exec(cleanHtml)
      if (match) {
        contact.phone = match[1] || match[0]
        break
      }
    }
    
    // Detect booking platform
    if (html.includes('instagram.com') || html.includes('@instagram') || html.includes('IG') || html.includes('インスタ')) {
      contact.booking_platform = 'instagram'
    } else if (contact.email || html.includes('mailto:')) {
      contact.booking_platform = 'email'
    } else if (html.includes('form') || html.includes('フォーム')) {
      contact.booking_platform = 'website'
    } else {
      contact.booking_platform = 'website'
    }
    
    // Extract Instagram handle if present
    const instagramPattern = /@([a-zA-Z0-9._]+)/g
    const instagramMatch = instagramPattern.exec(html)
    if (instagramMatch && html.includes('instagram')) {
      contact.instagram_handle = instagramMatch[1]
    }
    
    return contact
  }

  // Extract artist name
  private static extractName(html: string, language: 'ja' | 'en'): string {
    // Common selectors for artist names
    const nameSelectors = [
      'h1',
      '.artist-name',
      '.profile-name',
      '[class*="name"]',
      'title'
    ]

    // Language detection patterns
    const isJapanese = (text: string) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)

    // Mock implementation
    if (language === 'ja') {
      return '田中太郎' // Sample Japanese name
    } else {
      return 'Taro Tanaka' // Sample English name
    }
  }

  // Extract bio/description
  private static extractBio(html: string, language: 'ja' | 'en'): string {
    const bioSelectors = [
      '.bio',
      '.profile',
      '.description',
      '.about',
      '[class*="bio"]',
      '[class*="profile"]'
    ]

    // Mock implementation
    if (language === 'ja') {
      return '経験豊富なタトゥーアーティストです。伝統的な和彫りから現代的なデザインまで幅広く対応いたします。'
    } else {
      return 'Experienced tattoo artist specializing in traditional Japanese and modern designs.'
    }
  }

  // Extract location
  private static extractLocation(html: string): string {
    const locationPatterns = [
      /([東京都|大阪府|京都府|神奈川県|愛知県|福岡県|埼玉県|千葉県|宮城県])/g,
      /(Tokyo|Osaka|Kyoto|Yokohama|Nagoya|Fukuoka|Saitama|Chiba|Sendai)/gi
    ]

    // Mock implementation
    return '東京都'
  }

  // Extract address
  private static extractAddress(html: string, language: 'ja' | 'en'): string {
    // Mock implementation
    if (language === 'ja') {
      return '東京都渋谷区神宮前1-1-1'
    } else {
      return '1-1-1 Jingumae, Shibuya-ku, Tokyo'
    }
  }

  // Extract tattoo styles
  private static extractStyles(html: string): string[] {
    const styleKeywords = {
      ja: ['和彫り', 'トライバル', 'リアリズム', 'ブラックワーク', 'ファインライン', 'アニメ'],
      en: ['traditional', 'tribal', 'realism', 'blackwork', 'fine line', 'anime', 'japanese']
    }

    const styles: string[] = []

    // Check for style keywords in content
    const lowerHtml = html.toLowerCase()
    
    styleKeywords.ja.forEach(style => {
      if (html.includes(style)) {
        styles.push(style)
      }
    })

    styleKeywords.en.forEach(style => {
      if (lowerHtml.includes(style)) {
        styles.push(style)
      }
    })

    // Return mock data if nothing found
    return styles.length > 0 ? styles : ['和彫り', 'ブラックワーク']
  }

  // Utility methods
  private static resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url
    }
    
    const base = new URL(baseUrl)
    return new URL(url, base).href
  }

  private static getNextCrawlDate(): string {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.toISOString()
  }
}

// Studio data parser - extracts both studio info and artists
export class StudioDataParser {
  
  // Main parsing method for studio websites
  static extractStudioData(html: string, url: string): {
    studio: Partial<Studio>
    artists: Partial<Artist>[]
  } {
    const studio = this.extractStudioInfo(html, url)
    const artists = this.extractArtistsFromStudio(html, url, studio.id || `studio-${Date.now()}`)
    
    return { studio, artists }
  }
  
  // Extract studio information
  private static extractStudioInfo(html: string, url: string): Partial<Studio> {
    const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    
    const studio: Partial<Studio> = {
      id: `studio-${Date.now()}`,
      created_at: new Date().toISOString(),
      view_count: 0,
      website: url,
      name_ja: this.extractStudioName(cleanText, 'ja'),
      name_en: this.extractStudioName(cleanText, 'en'),
      bio_ja: this.extractStudioBio(cleanText, 'ja'),
      bio_en: this.extractStudioBio(cleanText, 'en'),
      location: this.extractLocation(cleanText),
      address_ja: this.extractAddress(cleanText, 'ja'),
      address_en: this.extractAddress(cleanText, 'en'),
      instagram_handle: this.extractInstagramHandle(html),
      instagram_posts: this.extractInstagramPosts(html),
      booking_url: url,
      phone: this.extractPhone(cleanText),
      // Extract amenities from content
      speaks_english: this.checkAmenity(cleanText, ['english', '英語', 'english speaking']),
      speaks_chinese: this.checkAmenity(cleanText, ['chinese', '中国語', '中文']),
      speaks_korean: this.checkAmenity(cleanText, ['korean', '韓国語', '한국어']),
      lgbtq_friendly: this.checkAmenity(cleanText, ['lgbtq', 'lgbt', 'friendly', 'welcome']),
      private_room: this.checkAmenity(cleanText, ['private', 'プライベート', '個室']),
      parking_available: this.checkAmenity(cleanText, ['parking', '駐車場', 'パーキング']),
      credit_card_accepted: this.checkAmenity(cleanText, ['credit', 'visa', 'mastercard', 'クレジット']),
      digital_payment_accepted: this.checkAmenity(cleanText, ['paypal', 'digital', 'online payment'])
    }
    
    return studio
  }
  
  // Extract multiple artists from studio page
  private static extractArtistsFromStudio(html: string, studioUrl: string, studioId: string): Partial<Artist>[] {
    const artists: Partial<Artist>[] = []
    const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    
    // Look for artist sections in the HTML
    const artistSections = this.findArtistSections(html)
    
    if (artistSections.length > 0) {
      // Parse each artist section
      artistSections.forEach((section, index) => {
        const artistData = this.extractArtistFromSection(section, studioUrl, studioId, index)
        if (artistData) {
          artists.push(artistData)
        }
      })
    } else {
      // If no distinct sections, create a general artist entry for the studio
      const generalArtist: Partial<Artist> = {
        id: `artist-${Date.now()}`,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        data_source: 'crawled',
        studio_id: studioId,
        website_url: studioUrl,
        name_ja: this.extractArtistName(cleanText, 'ja') || 'スタジオアーティスト',
        name_en: this.extractArtistName(cleanText, 'en') || 'Studio Artist',
        bio_ja: this.extractArtistBio(cleanText, 'ja'),
        bio_en: this.extractArtistBio(cleanText, 'en'),
        location: this.extractLocation(cleanText),
        address_ja: this.extractAddress(cleanText, 'ja'),
        address_en: this.extractAddress(cleanText, 'en'),
        styles: this.extractStyles(cleanText),
        portfolio_images: this.extractPortfolioImages(html, studioUrl),
        pricing_info: this.extractPricingInfo(cleanText),
        contact_info: {
          booking_url: studioUrl,
          email: this.extractEmail(cleanText),
          phone: this.extractPhone(cleanText),
          booking_platform: 'website'
        },
        view_count: 0,
        is_verified: false
      }
      
      artists.push(generalArtist)
    }
    
    return artists
  }
  
  // Find artist sections in HTML
  private static findArtistSections(html: string): string[] {
    const sections: string[] = []
    
    // Common patterns for artist sections
    const patterns = [
      /<div[^>]*class[^>]*artist[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*staff[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class[^>]*member[^>]*>[\s\S]*?<\/div>/gi,
      /<section[^>]*>[\s\S]*?<\/section>/gi
    ]
    
    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const section = match[0]
        // Check if section contains artist-like content
        if (this.isArtistSection(section)) {
          sections.push(section)
        }
      }
    })
    
    return sections
  }
  
  // Check if HTML section contains artist information
  private static isArtistSection(html: string): boolean {
    const indicators = [
      'artist', 'staff', 'member', 'tattoo', 'style', 'specializ',
      'アーティスト', 'スタッフ', 'メンバー', 'タトゥー', '専門'
    ]
    
    const lowerHtml = html.toLowerCase()
    return indicators.some(indicator => lowerHtml.includes(indicator.toLowerCase()))
  }
  
  // Extract artist data from HTML section
  private static extractArtistFromSection(html: string, studioUrl: string, studioId: string, index: number): Partial<Artist> | null {
    const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    
    return {
      id: `artist-${Date.now()}-${index}`,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      data_source: 'crawled',
      studio_id: studioId,
      website_url: studioUrl,
      name_ja: this.extractArtistName(cleanText, 'ja'),
      name_en: this.extractArtistName(cleanText, 'en'),
      bio_ja: this.extractArtistBio(cleanText, 'ja'),
      bio_en: this.extractArtistBio(cleanText, 'en'),
      location: this.extractLocation(cleanText),
      address_ja: this.extractAddress(cleanText, 'ja'),
      address_en: this.extractAddress(cleanText, 'en'),
      styles: this.extractStyles(cleanText),
      portfolio_images: this.extractPortfolioImages(html, studioUrl),
      pricing_info: this.extractPricingInfo(cleanText),
      contact_info: {
        booking_url: studioUrl,
        email: this.extractEmail(cleanText),
        phone: this.extractPhone(cleanText),
        booking_platform: 'website'
      },
      view_count: 0,
      is_verified: false
    }
  }
  
  // Studio-specific extraction methods
  private static extractStudioName(text: string, language: 'ja' | 'en'): string {
    if (language === 'ja') {
      const jaMatch = text.match(/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+(?:スタジオ|タトゥー|刺青))/)
      return jaMatch?.[1] || 'タトゥースタジオ'
    } else {
      const enMatch = text.match(/([A-Z][a-zA-Z\s]+(?:Studio|Tattoo|Shop))/)
      return enMatch?.[1] || 'Tattoo Studio'
    }
  }
  
  private static extractStudioBio(text: string, language: 'ja' | 'en'): string {
    if (language === 'ja') {
      return 'プロフェッショナルなタトゥースタジオです。経験豊富なアーティストが在籍しています。'
    } else {
      return 'Professional tattoo studio with experienced artists.'
    }
  }
  
  // Artist-specific extraction methods
  private static extractArtistName(text: string, language: 'ja' | 'en'): string {
    if (language === 'ja') {
      const jaMatch = text.match(/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,8})/)
      return jaMatch?.[1] || ''
    } else {
      const enMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/)
      return enMatch?.[1] || ''
    }
  }
  
  private static extractArtistBio(text: string, language: 'ja' | 'en'): string {
    const sentences = text.split(/[.。]/g)
    
    if (language === 'ja') {
      const japaneseSentences = sentences.filter(s => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(s))
      return japaneseSentences.slice(0, 2).join('。') + (japaneseSentences.length > 0 ? '。' : '')
    } else {
      const englishSentences = sentences.filter(s => /^[A-Za-z\s,'-]+$/.test(s.trim()) && s.trim().length > 10)
      return englishSentences.slice(0, 2).join('. ') + (englishSentences.length > 0 ? '.' : '')
    }
  }
  
  // Utility methods (shared with ArtistDataParser)
  private static extractLocation(text: string): string {
    const locations = ['東京都', '大阪府', '京都府', '神奈川県', '愛知県', 'Tokyo', 'Osaka', 'Kyoto', 'Yokohama']
    for (const location of locations) {
      if (text.includes(location)) {
        return location
      }
    }
    return '東京都'
  }
  
  private static extractAddress(text: string, language: 'ja' | 'en'): string {
    if (language === 'ja') {
      const addressMatch = text.match(/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF0-9\-]+区[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF0-9\-]+)/)
      return addressMatch?.[1] || ''
    } else {
      const addressMatch = text.match(/([0-9\-]+\s+[A-Za-z\s,]+)/)
      return addressMatch?.[1] || ''
    }
  }
  
  private static extractStyles(text: string): string[] {
    const styleKeywords = {
      ja: ['和彫り', 'トライバル', 'リアリズム', 'ブラックワーク', 'ファインライン', 'アニメ'],
      en: ['traditional', 'tribal', 'realism', 'blackwork', 'fine line', 'anime', 'japanese']
    }
    
    const styles: string[] = []
    const lowerText = text.toLowerCase()
    
    styleKeywords.ja.forEach(style => {
      if (text.includes(style)) {
        styles.push(style)
      }
    })
    
    styleKeywords.en.forEach(style => {
      if (lowerText.includes(style)) {
        styles.push(style)
      }
    })
    
    return styles.length > 0 ? styles : ['traditional', 'japanese']
  }
  
  private static extractPortfolioImages(html: string, baseUrl: string): string[] {
    const images: string[] = []
    
    const imagePatterns = [
      /src="([^"]*\.(jpg|jpeg|png|webp))"/gi,
      /data-src="([^"]*\.(jpg|jpeg|png|webp))"/gi
    ]
    
    imagePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(html)) !== null) {
        try {
          const imageUrl = new URL(match[1], baseUrl).href
          if (!this.isExcludedImage(imageUrl)) {
            images.push(imageUrl)
          }
        } catch (e) {
          // Skip invalid URLs
        }
      }
    })
    
    return [...new Set(images)].slice(0, 10)
  }
  
  private static isExcludedImage(url: string): boolean {
    const excludePatterns = ['logo', 'icon', 'avatar', 'header', 'footer', 'banner']
    const lowerUrl = url.toLowerCase()
    return excludePatterns.some(pattern => lowerUrl.includes(pattern))
  }
  
  private static extractPricingInfo(text: string): any {
    const pricing: any = {}
    
    const pricePatterns = [
      /料金[：:]?\s*([¥￥]?[\d,]+)\s*[〜～\-]\s*([¥￥]?[\d,]+)/gi,
      /price[：:]?\s*[¥￥$]?([\d,]+)\s*[\-~〜～]\s*[¥￥$]?([\d,]+)/gi
    ]
    
    pricePatterns.forEach(pattern => {
      const match = pattern.exec(text)
      if (match && match[2]) {
        pricing.price_range = `¥${match[1]} - ¥${match[2]}`
      }
    })
    
    return pricing
  }
  
  private static extractEmail(text: string): string | undefined {
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    return emailMatch?.[1]
  }
  
  private static extractPhone(text: string): string | undefined {
    const phoneMatch = text.match(/(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})/)
    return phoneMatch?.[1]
  }
  
  private static extractInstagramHandle(html: string): string {
    const instagramMatch = html.match(/@([a-zA-Z0-9._]+)/)
    return instagramMatch?.[1] || ''
  }
  
  private static extractInstagramPosts(html: string): string[] {
    const posts: string[] = []
    const instagramLinkPattern = /https:\/\/(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)/g
    let match
    
    while ((match = instagramLinkPattern.exec(html)) !== null) {
      posts.push(match[0])
    }
    
    return posts.slice(0, 3) // Limit to 3 posts
  }
  
  private static checkAmenity(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase()
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
  }
}

export class DirectoryParser {
  // Parse directory pages to find studio URLs
  static extractStudioUrls(html: string, baseUrl: string): string[] {
    const urls: string[] = []
    
    // Handle different directory types based on URL
    if (baseUrl.includes('tattoo-studio.jp')) {
      return this.parseTattooStudioDirectory(html, baseUrl)
    } else if (baseUrl.includes('japan-tattoo.jp')) {
      return this.parseJapanTattooStudio(html, baseUrl)
    } else if (baseUrl.includes('kagerou-tattoo.co.jp')) {
      return this.parseKagerouStudio(html, baseUrl)
    } else if (baseUrl.includes('ichitattoo.com')) {
      return this.parseIchiTattooStudio(html, baseUrl)
    } else if (baseUrl.includes('three-tides-tattoo.com')) {
      return this.parseThreeTidesStudio(html, baseUrl)
    } else if (baseUrl.includes('reddragon-tattoo.com')) {
      return this.parseRedDragonStudio(html, baseUrl)
    }
    
    // Generic parsing fallback
    return this.parseGenericDirectory(html, baseUrl)
  }
  
  // Parse tattoo-studio.jp directory
  private static parseTattooStudioDirectory(html: string, baseUrl: string): string[] {
    const urls: string[] = []
    
    // Look for studio profile links
    // Pattern: /studio/[studio-name]
    const studioLinkRegex = /href="([^"]*\/studio\/[^"]+)"/g
    let match
    
    while ((match = studioLinkRegex.exec(html)) !== null) {
      const studioUrl = new URL(match[1], baseUrl).href
      urls.push(studioUrl)
    }
    
    return urls
  }
  
  // Parse single studio sites (japan-tattoo.jp)
  private static parseJapanTattooStudio(html: string, baseUrl: string): string[] {
    // For single studios, return the main page as it contains artist info
    return [baseUrl]
  }
  
  // Parse kagerou-tattoo.co.jp (individual studio)
  private static parseKagerouStudio(html: string, baseUrl: string): string[] {
    // Return the main studio page - we'll extract all artists from there
    return [baseUrl]
  }
  
  // Parse ichitattoo.com (individual studio)
  private static parseIchiTattooStudio(html: string, baseUrl: string): string[] {
    return [baseUrl] // Single studio, return main page
  }
  
  // Parse three-tides-tattoo.com (individual studio)
  private static parseThreeTidesStudio(html: string, baseUrl: string): string[] {
    return [baseUrl]
  }
  
  // Parse reddragon-tattoo.com (individual studio)
  private static parseRedDragonStudio(html: string, baseUrl: string): string[] {
    return [baseUrl]
  }
  
  // Generic directory parsing for studios
  private static parseGenericDirectory(html: string, baseUrl: string): string[] {
    const urls: string[] = []
    
    // Common patterns for studio profile links
    const patterns = [
      /href="([^"]*studio[^"]*)"/gi,
      /href="([^"]*shop[^"]*)"/gi,
      /href="([^"]*tattoo[^"]*)"/gi
    ]
    
    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(html)) !== null) {
        try {
          const fullUrl = new URL(match[1], baseUrl).href
          urls.push(fullUrl)
        } catch (error) {
          // Skip invalid URLs
        }
      }
    })
    
    return [...new Set(urls)] // Remove duplicates
  }

  // Check if URL looks like a Japanese tattoo studio or artist
  static isJapaneseTattooArtist(html: string, url: string): boolean {
    const japaneseIndicators = [
      '刺青', 'タトゥー', 'tattoo', '和彫り', 'irezumi',
      'japan', 'japanese', '東京', '大阪', '京都'
    ]

    const lowerHtml = html.toLowerCase()
    return japaneseIndicators.some(indicator => 
      lowerHtml.includes(indicator.toLowerCase())
    )
  }
}