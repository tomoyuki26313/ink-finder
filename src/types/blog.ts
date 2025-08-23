export interface BlogPost {
  id: string
  slug: string
  title_ja: string
  title_en: string
  content_ja: string
  content_en: string
  excerpt_ja: string
  excerpt_en: string
  featured_image?: string
  category: BlogCategory
  tags: string[]
  author: string
  published: boolean
  published_at?: string
  view_count: number
  created_at: string
  updated_at: string
}

export type BlogCategory = 
  | 'news'           // ニュース
  | 'artist-feature' // アーティスト特集
  | 'style-guide'    // スタイルガイド
  | 'care-tips'      // ケア方法
  | 'culture'        // タトゥー文化
  | 'event'          // イベント
  | 'other'          // その他

export interface BlogFormData extends Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'view_count'> {}