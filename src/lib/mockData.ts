import { Artist, Studio } from '@/types/database'

// Mock Studios
export const mockStudios: Studio[] = [
  {
    id: 'studio-001',
    name_ja: 'TOKYO THREE TIDES',
    name_en: 'TOKYO THREE TIDES',
    bio_ja: '渋谷の中心に位置する現代的なタトゥースタジオ。清潔で快適な環境で、様々なスタイルのタトゥーを提供しています。',
    bio_en: 'A modern tattoo studio located in the heart of Shibuya. We provide various tattoo styles in a clean and comfortable environment.',
    location: '東京都',
    address_ja: '〒150-0001 東京都渋谷区神宮前4-12-10',
    address_en: '4-12-10 Jingumae, Shibuya-ku, Tokyo 150-0001',
    instagram_handle: '@tokyothreetides',
    instagram_posts: [
      'https://www.instagram.com/p/DJ8wl4DzTlu/',
      'https://www.instagram.com/p/DFyEQstsZiD/',
      'https://www.instagram.com/p/DFHDwfBz-6B/'
    ],
    booking_url: 'https://booking.example.com/tokyo-three-tides',
    phone: '03-1234-5678',
    website: 'https://tokyothreetides.com',
    view_count: 2500,
    created_at: '2024-01-01T10:00:00Z',
    speaks_english: true,
    speaks_chinese: false,
    speaks_korean: true,
    lgbtq_friendly: true,
    same_day_booking: true,
    private_room: true,
    parking_available: false,
    credit_card_accepted: true,
    digital_payment_accepted: true,
    late_night_hours: false,
    weekend_hours: true,
    jagua_tattoo: false
  },
  {
    id: 'studio-002',
    name_ja: 'INK GARDEN大阪',
    name_en: 'INK GARDEN OSAKA',
    bio_ja: '大阪の繁華街にある老舗タトゥースタジオ。伝統的な和彫りから現代的なデザインまで幅広く対応。',
    bio_en: 'A well-established tattoo studio in Osaka\'s entertainment district. We handle everything from traditional Japanese tattoos to modern designs.',
    location: '大阪府',
    address_ja: '〒542-0081 大阪府大阪市中央区南船場3-10-15',
    address_en: '3-10-15 Minamisenba, Chuo-ku, Osaka 542-0081',
    instagram_handle: '@inkgarden_osaka',
    instagram_posts: [
      'https://www.instagram.com/p/C8QR9klSxvX/',
      'https://www.instagram.com/p/C8KLMN3Sytz/'
    ],
    booking_url: 'https://booking.example.com/ink-garden',
    phone: '06-1234-5678',
    view_count: 1800,
    created_at: '2024-01-10T10:00:00Z',
    speaks_english: true,
    speaks_chinese: true,
    speaks_korean: false,
    lgbtq_friendly: true,
    same_day_booking: false,
    private_room: true,
    parking_available: true,
    credit_card_accepted: true,
    digital_payment_accepted: true,
    late_night_hours: true,
    weekend_hours: true,
    jagua_tattoo: true
  },
  {
    id: 'studio-003',
    name_ja: 'MODERN INK横浜',
    name_en: 'MODERN INK YOKOHAMA',
    bio_ja: '横浜みなとみらいの新しいタトゥースタジオ。モダンなデザインと最新の設備が自慢です。',
    bio_en: 'A new tattoo studio in Yokohama Minato Mirai. We pride ourselves on modern designs and state-of-the-art equipment.',
    location: '神奈川県',
    address_ja: '〒220-0004 神奈川県横浜市西区北幸1-5-10',
    address_en: '1-5-10 Kitasaiwai, Nishi-ku, Yokohama, Kanagawa 220-0004',
    instagram_handle: '@modernink_yokohama',
    instagram_posts: [
      'https://www.instagram.com/p/STU901/',
      'https://www.instagram.com/p/VWX234/',
      'https://www.instagram.com/p/YZA567/'
    ],
    booking_url: 'https://booking.example.com/modern-ink',
    view_count: 1200,
    created_at: '2024-02-01T10:00:00Z',
    speaks_english: true,
    speaks_chinese: false,
    speaks_korean: false,
    lgbtq_friendly: true,
    same_day_booking: true,
    private_room: false,
    parking_available: true,
    credit_card_accepted: true,
    digital_payment_accepted: true,
    late_night_hours: false,
    weekend_hours: true,
    jagua_tattoo: false
  }
]

// Mock Artists (updated to reference studios)
export const mockArtists: Artist[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    studio_id: 'studio-001',
    name_ja: '田中雪絵',
    name_en: 'Yukie Tanaka',
    bio_ja: '伝統的な和彫りを専門とし、現代的な解釈も取り入れたタトゥーアーティスト。15年以上の経験を持つ。',
    bio_en: 'A tattoo artist specializing in traditional Japanese Irezumi with modern interpretations. Over 15 years of experience.',
    styles: ['和彫り', 'ブラックワーク', 'ネオジャパニーズ'],
    price_range: '¥20,000 - ¥100,000',
    instagram_handle: '@yukitattoo',
    instagram_posts: [
      'https://www.instagram.com/p/DJ8wl4DzTlu/',
      'https://www.instagram.com/p/DFyEQstsZiD/',
      'https://www.instagram.com/p/DFHDwfBz-6B/'
    ],
    view_count: 1234,
    created_at: '2024-01-15T10:00:00Z',
    female_artist: true,
    beginner_friendly: true,
    custom_design_allowed: true,
    cover_up_available: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    studio_id: 'studio-002',
    name_ja: '佐藤美咲',
    name_en: 'Misaki Sato',
    bio_ja: 'ファインライン専門で、繊細な植物モチーフやミニマルなデザインを得意とするアーティスト。',
    bio_en: 'An artist specializing in fine line work, excelling in delicate botanical motifs and minimal designs.',
    styles: ['ファインライン', 'ミニマル', 'ボタニカル'],
    price_range: '¥15,000 - ¥80,000',
    instagram_handle: '@misakifineline',
    instagram_posts: [
      'https://www.instagram.com/p/C8QR9klSxvX/',
      'https://www.instagram.com/p/C8KLMN3Sytz/',
      'https://www.instagram.com/p/C7OPQR8STuv/'
    ],
    view_count: 892,
    created_at: '2024-02-20T10:00:00Z',
    female_artist: true,
    beginner_friendly: true,
    custom_design_allowed: true,
    cover_up_available: false
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    studio_id: 'studio-003',
    name_ja: '金田アレックス',
    name_en: 'Alex Kaneda',
    bio_ja: 'ジオメトリックパターンとウォーターカラー技法を融合させたコンテンポラリーアーティスト。',
    bio_en: 'A contemporary artist who fuses geometric patterns with watercolor techniques.',
    styles: ['ジオメトリック', 'ウォーターカラー', 'アブストラクト', 'アニメ'],
    price_range: '¥25,000 - ¥150,000',
    instagram_handle: '@alexgeo_ink',
    instagram_posts: [
      'https://www.instagram.com/p/STU901/',
      'https://www.instagram.com/p/VWX234/',
      'https://www.instagram.com/p/YZA567/'
    ],
    view_count: 567,
    created_at: '2024-03-10T10:00:00Z',
    female_artist: false,
    beginner_friendly: true,
    custom_design_allowed: true,
    cover_up_available: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    studio_id: 'studio-001',
    name_ja: '高橋ジェームス',
    name_en: 'James Takahashi',
    bio_ja: 'アメリカントラディショナル専門で15年の経験を持つ。オールドスクールスタイルの第一人者。',
    bio_en: 'Specializes in American Traditional with 15 years of experience. A leading figure in old school style.',
    styles: ['アメリカントラディショナル', 'オールドスクール', 'ボールドライン'],
    price_range: '¥18,000 - ¥120,000',
    instagram_handle: '@jamestrad_nagoya',
    images: [
      'https://images.unsplash.com/photo-1565058379802-2755a80ba2f0',
      'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28',
      'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d'
    ],
    instagram_posts: [],
    view_count: 2341,
    created_at: '2024-01-05T10:00:00Z',
    female_artist: false,
    beginner_friendly: false,
    custom_design_allowed: true,
    cover_up_available: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    studio_id: 'studio-002',
    name_ja: '陳ソフィー',
    name_en: 'Sophie Chen',
    bio_ja: 'リアリズム専門で、ポートレートや自然のシーンを得意とするアーティスト。国際的な賞も受賞。',
    bio_en: 'A realism specialist excelling in portraits and natural scenes. Winner of international awards.',
    styles: ['リアリズム', 'ポートレート', 'ブラック&グレー', 'アニメ'],
    price_range: '¥30,000 - ¥200,000',
    instagram_handle: '@sophie_realism_kobe',
    images: [
      'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d',
      'https://images.unsplash.com/photo-1565058379802-2755a80ba2f0',
      'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28'
    ],
    instagram_posts: [],
    view_count: 1678,
    created_at: '2024-02-01T10:00:00Z',
    female_artist: true,
    beginner_friendly: true,
    custom_design_allowed: true,
    cover_up_available: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    studio_id: 'studio-003',
    name_ja: 'パテル・ラヴィ',
    name_en: 'Ravi Patel',
    bio_ja: 'ドットワークとマンダラを専門とし、精神的なデザインを得意とするアーティスト。瞑想的なアプローチ。',
    bio_en: 'An artist specializing in dotwork and mandalas, excelling in spiritual designs with a meditative approach.',
    styles: ['ドットワーク', 'マンダラ', 'セイクリッドジオメトリー'],
    price_range: '¥22,000 - ¥130,000',
    instagram_handle: '@ravi_dotwork_fukuoka',
    images: [
      'https://images.unsplash.com/photo-1567701554261-fcc4171c4948',
      'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d',
      'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28'
    ],
    instagram_posts: [],
    view_count: 923,
    created_at: '2024-03-15T10:00:00Z',
    female_artist: false,
    beginner_friendly: true,
    custom_design_allowed: true,
    cover_up_available: false
  }
]