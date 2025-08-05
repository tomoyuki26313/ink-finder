import { NextRequest, NextResponse } from 'next/server'
import { Artist, Studio } from '@/types/database'
import { createSession, updateProgress } from './progress/route'

// サーバーサイドクローラーの設定
interface CrawlRequest {
  directories?: string[]
  maxStudios?: number
  sessionId?: string
}

interface CrawlResponse {
  success: boolean
  sessionId: string
  studios: Partial<Studio>[]
  artists: Partial<Artist>[]
  errors: { url: string; error: string }[]
  discoveredUrls: string[]
}

// 日本のタトゥースタジオディレクトリURL
const DEFAULT_DIRECTORIES = [
  // Studio directory sites
  'https://tattoo-studio.jp/tokyo/',
  'https://tattoo-studio.jp/osaka/',
  // Individual well-known studios
  'https://japan-tattoo.jp/',
  'https://kagerou-tattoo.co.jp/en/',
  'https://www.ichitattoo.com/',
  'https://www.three-tides-tattoo.com/',
  'https://www.reddragon-tattoo.com/'
]

export async function POST(request: NextRequest) {
  try {
    const body: CrawlRequest = await request.json()
    const directories = body.directories || DEFAULT_DIRECTORIES
    const maxStudios = body.maxStudios || 5  // Reduced default since each studio may have multiple artists
    const sessionId = body.sessionId || `crawl-${Date.now()}`

    console.log('🚀 Starting server-side studio crawl...')
    console.log(`📂 Directories: ${directories.length}`)
    console.log(`🏢 Max studios: ${maxStudios}`)
    console.log(`🆔 Session ID: ${sessionId}`)

    const result: CrawlResponse = {
      success: true,
      sessionId,
      studios: [],
      artists: [],
      errors: [],
      discoveredUrls: []
    }

    // 進捗セッションを作成（URLディスカバリー用）
    createSession(sessionId, directories.length + maxStudios)

    // ステップ1: ディレクトリからアーティストURLを発見
    for (let i = 0; i < directories.length; i++) {
      const directoryUrl = directories[i]
      try {
        console.log(`🔍 Crawling studio directory: ${directoryUrl}`)
        updateProgress(sessionId, { 
          currentUrl: directoryUrl,
          processedUrls: i
        })
        
        const urls = await crawlDirectory(directoryUrl)
        result.discoveredUrls.push(...urls)
        console.log(`✅ Found ${urls.length} studio URLs from ${directoryUrl}`)
        
        updateProgress(sessionId, { 
          processedUrls: i + 1,
          successfulCrawls: result.discoveredUrls.length
        })
        
        // レート制限
        await delay(2000)
      } catch (error: any) {
        console.error(`❌ Directory crawl failed: ${directoryUrl}`, error.message)
        result.errors.push({
          url: directoryUrl,
          error: error.message
        })
        
        updateProgress(sessionId, { 
          processedUrls: i + 1,
          failedCrawls: result.errors.length,
          errors: result.errors
        })
      }
    }

    // 重複削除
    result.discoveredUrls = [...new Set(result.discoveredUrls)]
    console.log(`🎯 Total unique studio URLs discovered: ${result.discoveredUrls.length}`)

    // 進捗を更新（スタジオ処理フェーズへ）
    const urlsToProcess = result.discoveredUrls.slice(0, maxStudios)
    updateProgress(sessionId, {
      totalUrls: directories.length + urlsToProcess.length,
      processedUrls: directories.length
    })

    // ステップ2: 個別スタジオページをクロール
    for (let i = 0; i < urlsToProcess.length; i++) {
      const url = urlsToProcess[i]
      try {
        console.log(`🏢 Crawling studio: ${url}`)
        updateProgress(sessionId, { 
          currentUrl: url,
          processedUrls: directories.length + i
        })
        
        const { studio, artists } = await crawlStudio(url)
        
        if (studio) {
          result.studios.push(studio)
          console.log(`✅ Successfully crawled studio: ${studio.name_ja || studio.name_en || 'Unknown Studio'}`)
        }
        
        if (artists && artists.length > 0) {
          result.artists.push(...artists)
          console.log(`👥 Found ${artists.length} artists in this studio`)
        }
        
        updateProgress(sessionId, { 
          processedUrls: directories.length + i + 1,
          successfulCrawls: result.studios.length
        })
        
        // レート制限（重要！）
        await delay(3000)
      } catch (error: any) {
        console.error(`❌ Studio crawl failed: ${url}`, error.message)
        result.errors.push({
          url,
          error: error.message
        })
        
        updateProgress(sessionId, { 
          processedUrls: directories.length + i + 1,
          failedCrawls: result.errors.length,
          errors: result.errors
        })
      }
    }

    // 最終進捗更新
    updateProgress(sessionId, { 
      status: 'completed',
      processedUrls: directories.length + urlsToProcess.length
    })

    console.log(`🎉 Crawl complete! Studios: ${result.studios.length}, Artists: ${result.artists.length}, Errors: ${result.errors.length}`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('💥 Server-side crawl failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ディレクトリページからスタジオURLを抽出
async function crawlDirectory(url: string): Promise<string[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  return extractStudioUrls(html, url)
}

// HTMLからスタジオURLを抽出
function extractStudioUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = []

  try {
    if (baseUrl.includes('tattoo-studio.jp')) {
      // タトゥースタジオディレクトリ
      const studioLinkRegex = /href="([^"]*\/studio\/[^"]+)"/g
      let match
      while ((match = studioLinkRegex.exec(html)) !== null) {
        try {
          const fullUrl = new URL(match[1], baseUrl).href
          urls.push(fullUrl)
        } catch (e) {
          // 無効なURLをスキップ
        }
      }
    } else if (baseUrl.includes('japan-tattoo.jp')) {
      // 単一スタジオの場合はメインページを使用
      urls.push(baseUrl)
    } else if (baseUrl.includes('kagerou-tattoo.co.jp')) {
      // Kagerouスタジオ
      urls.push(baseUrl)
    } else if (baseUrl.includes('ichitattoo.com')) {
      // Ichi Tattoo スタジオ
      urls.push(baseUrl)
    } else if (baseUrl.includes('three-tides-tattoo.com')) {
      // Three Tides スタジオ
      urls.push(baseUrl)
    } else if (baseUrl.includes('reddragon-tattoo.com')) {
      // Red Dragon スタジオ
      urls.push(baseUrl)
    } else {
      // 汎用的なパターン（スタジオ向け）
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
          } catch (e) {
            // 無効なURLをスキップ
          }
        }
      })
    }
  } catch (error) {
    console.error('URL extraction error:', error)
  }

  return [...new Set(urls)] // 重複削除
}

// 個別スタジオページをクロール
async function crawlStudio(url: string): Promise<{
  studio: Partial<Studio> | null
  artists: Partial<Artist>[]
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    return extractStudioData(html, url)

  } catch (error) {
    console.error(`Studio crawl error for ${url}:`, error)
    return { studio: null, artists: [] }
  }
}

// HTMLからスタジオデータを抽出
function extractStudioData(html: string, url: string): {
  studio: Partial<Studio>
  artists: Partial<Artist>[]
} {
  const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
  
  // スタジオ基本データ
  const studio: Partial<Studio> = {
    id: `studio-${Date.now()}`,
    created_at: new Date().toISOString(),
    view_count: 0,
    website: url,
    name_ja: extractStudioName(cleanText, 'ja'),
    name_en: extractStudioName(cleanText, 'en'),
    bio_ja: extractStudioBio(cleanText, 'ja'),
    bio_en: extractStudioBio(cleanText, 'en'),
    location: extractLocation(cleanText),
    address_ja: extractAddress(cleanText, 'ja'),
    address_en: extractAddress(cleanText, 'en'),
    instagram_handle: extractInstagramHandle(html),
    instagram_posts: extractInstagramPosts(html),
    booking_url: url,
    phone: extractPhone(cleanText),
    speaks_english: checkAmenity(cleanText, ['english', '英語', 'english speaking']),
    lgbtq_friendly: checkAmenity(cleanText, ['lgbtq', 'lgbt', 'friendly', 'welcome']),
    private_room: checkAmenity(cleanText, ['private', 'プライベート', '個室'])
  }
  
  // アーティストデータ（スタジオから抽出）
  const artists: Partial<Artist>[] = extractArtistsFromStudio(html, url, studio.id!)
  
  return { studio, artists }
}

// ポートフォリオ画像の抽出
function extractPortfolioImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  
  const imagePatterns = [
    /src="([^"]*(?:tattoo|work|portfolio|gallery)[^"]*\.(jpg|jpeg|png|webp))"/gi,
    /src="([^"]*\.(jpg|jpeg|png|webp))"/gi,
    /data-src="([^"]*\.(jpg|jpeg|png|webp))"/gi
  ]
  
  imagePatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(html)) !== null) {
      try {
        const imageUrl = new URL(match[1], baseUrl).href
        if (isPortfolioImage(imageUrl)) {
          images.push(imageUrl)
        }
      } catch (e) {
        // 無効なURLをスキップ
      }
    }
  })
  
  return [...new Set(images)].slice(0, 10) // 重複削除 & 制限
}

// ポートフォリオ画像かどうかの判定
function isPortfolioImage(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  const excludePatterns = ['logo', 'icon', 'avatar', 'header', 'footer', 'banner', 'btn']
  const includePatterns = ['tattoo', 'work', 'portfolio', 'gallery', 'art']
  
  if (excludePatterns.some(pattern => lowerUrl.includes(pattern))) {
    return false
  }
  
  return includePatterns.some(pattern => lowerUrl.includes(pattern)) || 
         !excludePatterns.some(pattern => lowerUrl.includes(pattern))
}

// 価格情報の抽出
function extractPricingInfo(text: string) {
  const pricing: any = {}
  
  // 日本語の価格パターン
  const pricePatterns = [
    /料金[\s：:]*([¥￥]?[\d,]+)[\s]*[〜～\-][\s]*([¥￥]?[\d,]+)/g,
    /価格[\s：:]*([¥￥]?[\d,]+)/g,
    /最低料金[\s：:]*([¥￥]?[\d,]+)/g,
    /from[\s]*([¥￥$]?[\d,]+)/gi
  ]
  
  pricePatterns.forEach(pattern => {
    const match = pattern.exec(text)
    if (match) {
      if (match[2]) {
        pricing.price_range = `¥${match[1]} - ¥${match[2]}`
      } else if (match[1]) {
        pricing.session_minimum = `¥${match[1].replace(/[¥￥$,]/g, '')}`
      }
    }
  })
  
  return pricing
}

// 連絡先情報の抽出
function extractContactInfo(text: string, url: string) {
  const contact: any = { booking_url: url }
  
  // メールアドレス
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
  if (emailMatch) {
    contact.email = emailMatch[0]
  }
  
  // 電話番号（日本）
  const phoneMatch = text.match(/(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4})/g)
  if (phoneMatch) {
    contact.phone = phoneMatch[0]
  }
  
  // Instagram
  if (text.includes('instagram') || text.includes('IG')) {
    contact.booking_platform = 'instagram'
  } else if (contact.email) {
    contact.booking_platform = 'email'
  } else {
    contact.booking_platform = 'website'
  }
  
  return contact
}

// スタジオ名の抽出
function extractStudioName(text: string, language: 'ja' | 'en'): string {
  if (language === 'ja') {
    const jaMatch = text.match(/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+(?:スタジオ|タトゥー|刺青))/)
    return jaMatch?.[1] || 'タトゥースタジオ'
  } else {
    const enMatch = text.match(/([A-Z][a-zA-Z\s]+(?:Studio|Tattoo|Shop))/)
    return enMatch?.[1] || 'Tattoo Studio'
  }
}

// スタジオ説明の抽出
function extractStudioBio(text: string, language: 'ja' | 'en'): string {
  if (language === 'ja') {
    return 'プロフェッショナルなタトゥースタジオです。経験豊富なアーティストが在籍しています。'
  } else {
    return 'Professional tattoo studio with experienced artists.'
  }
}

// 名前の抽出（アーティスト用）
function extractName(text: string, language: 'ja' | 'en'): string {
  if (language === 'ja') {
    // 日本語名のパターン
    const japaneseNameMatch = text.match(/([あ-ん]{1,4}[\s　]*[あ-ん]{1,4}|[ァ-ヴ]{1,6}[\s　]*[ァ-ヴ]{1,6}|[一-龯]{1,4}[\s　]*[一-龯]{1,4})/g)
    return japaneseNameMatch?.[0] || ''
  } else {
    // 英語名のパターン
    const englishNameMatch = text.match(/([A-Z][a-z]+[\s]+[A-Z][a-z]+)/g)
    return englishNameMatch?.[0] || ''
  }
}

// スタジオからアーティストを抽出
function extractArtistsFromStudio(html: string, studioUrl: string, studioId: string): Partial<Artist>[] {
  const artists: Partial<Artist>[] = []
  const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
  
  // 一般的なアーティスト情報として単一エントリを作成
  const generalArtist: Partial<Artist> = {
    id: `artist-${Date.now()}`,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    data_source: 'crawled',
    studio_id: studioId,
    website_url: studioUrl,
    name_ja: extractName(cleanText, 'ja') || 'スタジオアーティスト',
    name_en: extractName(cleanText, 'en') || 'Studio Artist',
    bio_ja: extractBio(cleanText, 'ja'),
    bio_en: extractBio(cleanText, 'en'),
    location: extractLocation(cleanText),
    address_ja: extractAddress(cleanText, 'ja'),
    address_en: extractAddress(cleanText, 'en'),
    styles: extractStyles(cleanText),
    portfolio_images: extractPortfolioImages(html, studioUrl),
    pricing_info: extractPricingInfo(cleanText),
    contact_info: extractContactInfo(cleanText, studioUrl),
    view_count: 0,
    is_verified: false
  }
  
  artists.push(generalArtist)
  return artists
}

// 経歴・説明の抽出
function extractBio(text: string, language: 'ja' | 'en'): string {
  const sentences = text.split(/[.。]/g)
  
  if (language === 'ja') {
    const japaneseSentences = sentences.filter(s => /[ひらがなカタカナ漢字]/.test(s))
    return japaneseSentences.slice(0, 3).join('。') + (japaneseSentences.length > 0 ? '。' : '')
  } else {
    const englishSentences = sentences.filter(s => /^[A-Za-z\s,'-]+$/.test(s.trim()) && s.trim().length > 10)
    return englishSentences.slice(0, 2).join('. ') + (englishSentences.length > 0 ? '.' : '')
  }
}

// 場所の抽出
function extractLocation(text: string): string {
  const locations = ['東京都', '大阪府', '京都府', '神奈川県', '愛知県', 'Tokyo', 'Osaka', 'Kyoto', 'Yokohama']
  for (const location of locations) {
    if (text.includes(location)) {
      return location
    }
  }
  return ''
}

// スタイルの抽出
function extractStyles(text: string): string[] {
  const styles = ['和彫り', 'traditional', 'tribal', 'realism', 'blackwork', 'japanese', 'anime', 'ファインライン']
  return styles.filter(style => text.toLowerCase().includes(style.toLowerCase()))
}

// インスタグラムハンドルの抽出
function extractInstagramHandle(html: string): string {
  const instagramMatch = html.match(/@([a-zA-Z0-9._]+)/)
  return instagramMatch?.[1] || ''
}

// インスタグラム投稿の抽出
function extractInstagramPosts(html: string): string[] {
  const posts: string[] = []
  const instagramLinkPattern = /https:\/\/(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)/g
  let match
  
  while ((match = instagramLinkPattern.exec(html)) !== null) {
    posts.push(match[0])
  }
  
  return posts.slice(0, 3) // 3投稿まで
}

// アメニティチェック
function checkAmenity(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase()
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
}

// 次回クロール日時
function getNextCrawlDate(): string {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return nextMonth.toISOString()
}

// 遅延ユーティリティ
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}