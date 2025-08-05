export type Language = 'en' | 'ja'

export const translations = {
  en: {
    // Header
    appName: 'INK FINDER',
    tagline: 'Find Japanese tattoo artists',
    searchPlaceholder: 'Search by artist name, style, or keyword...',
    description: 'Find authentic Japanese tattoo artists and studios. Browse portfolios, read reviews, and book appointments with verified irezumi masters and contemporary tattoo artists across Japan.',
    heroText: 'Your gateway to Japan\'s finest tattoo artists. From traditional irezumi masters to cutting-edge contemporary artists, discover the perfect artist for your next tattoo in Japan.',
    
    // Demo Mode
    demoMode: 'Demo Mode - Using Sample Data',
    demoModeDescription: 'To connect to your Supabase database, follow the setup guide in',
    
    // Filters
    filters: 'Filters',
    clearAll: 'Clear all',
    style: 'Style',
    location: 'Region',
    allLocations: 'All Regions',
    selected: 'selected',
    showMore: '+ Show more',
    showLess: '− Close',
    
    // Results
    artistsFound: 'Artists Found',
    demoData: '(Demo Data)',
    sortBy: 'Sort by',
    sortMostPopular: 'Sort by: Most Popular',
    sortNewest: 'Sort by: Newest',
    
    // No Results
    noArtistsFound: 'No artists found matching your criteria.',
    adjustFilters: 'Try adjusting your filters or search terms.',
    
    // Loading
    loadingArtists: 'Loading artists...',
    
    // Artist Modal
    about: 'About',
    styles: 'Styles',
    studioAddress: 'Studio Address',
    bookAppointment: 'Book Appointment',
    views: 'views',
    
    // Common
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    search: 'Search',
    
    // Tags
    regionLabel: 'Region:',
    styleLabel: 'Style:',
    
    // Language
    language: 'Language',
    english: 'English',
    japanese: '日本語',
    
    // Disclaimer
    disclaimer: 'This website is operated for the purpose of introducing tattoo artists and studios, and has no direct affiliation with any of the artists or studios listed. For bookings and consultations, please contact the artists or studios directly.',
    
    // Prefectures
    tokyo: 'Tokyo',
    kyoto: 'Kyoto',
    osaka: 'Osaka',
    miyagi: 'Miyagi',
    fukuoka: 'Fukuoka',
    aichi: 'Aichi',
    saitama: 'Saitama',
    kanagawa: 'Kanagawa',
    chiba: 'Chiba',
    
    // Advanced Filters
    advancedFilters: 'Advanced Filters',
    languageSupport: 'Language Support',
    speaksEnglish: 'English speaking',
    speaksChinese: 'Chinese speaking',
    speaksKorean: 'Korean speaking',
    staffFeatures: 'Staff Features',
    hasFemaleArtist: 'Female artist available',
    lgbtqFriendly: 'LGBTQ+ friendly',
    beginnerFriendly: 'Beginner friendly',
    servicesAmenities: 'Services & Amenities',
    sameDayBooking: 'Same day booking',
    privateRoom: 'Private room available',
    parkingAvailable: 'Parking available',
    creditCardAccepted: 'Credit card accepted',
    digitalPaymentAccepted: 'Digital payment accepted',
    lateNightHours: 'Late night hours (after 8pm)',
    weekendHours: 'Weekend hours',
    specializedServices: 'Specialized Services',
    customDesignAllowed: 'Custom design allowed',
    coverUpAvailable: 'Cover-up available',
    jaguaTattoo: 'Jagua tattoo available'
  },
  ja: {
    // Header
    appName: 'INK FINDER',
    tagline: 'タトゥーアーティスト検索',
    searchPlaceholder: 'アーティスト名、スタイル、キーワードで検索...',
    description: '日本全国のタトゥーアーティストとスタジオを検索できます。ポートフォリオの閲覧、レビューの確認、予約まで一つのプラットフォームで完結。',
    heroText: '日本最大級のタトゥーアーティスト検索サイト。伝統的な和彫りから現代的なスタイルまで、あなたにぴったりのアーティストを見つけてください。',
    
    // Demo Mode
    demoMode: 'デモモード - サンプルデータを使用中',
    demoModeDescription: 'Supabaseデータベースに接続するには、セットアップガイドをご覧ください',
    
    // Filters
    filters: 'フィルター',
    clearAll: 'すべてクリア',
    style: 'スタイル',
    location: '地域',
    allLocations: 'すべての地域',
    selected: '選択中',
    showMore: '+ もっと見る',
    showLess: '− 閉じる',
    
    // Results
    artistsFound: '人のアーティストが見つかりました',
    demoData: '(デモデータ)',
    sortBy: '並び順',
    sortMostPopular: '人気順',
    sortNewest: '新着順',
    
    // No Results
    noArtistsFound: '条件に一致するアーティストが見つかりませんでした。',
    adjustFilters: 'フィルターや検索条件を調整してみてください。',
    
    // Loading
    loadingArtists: '検索中...',
    
    // Artist Modal
    about: '概要',
    styles: 'スタイル',
    studioAddress: 'スタジオ住所',
    bookAppointment: '予約する',
    views: '回閲覧',
    
    // Common
    close: '閉じる',
    loading: '読み込み中...',
    error: 'エラー',
    search: '検索する',
    
    // Tags
    regionLabel: '地域:',
    styleLabel: 'スタイル:',
    
    // Language
    language: '言語',
    english: 'English',
    japanese: '日本語',
    
    // Disclaimer
    disclaimer: '本サイトはタトゥーアーティストやスタジオの情報紹介を目的としており、各掲載先とは直接の関係はありません。ご予約・ご相談は、各アーティストまたはスタジオへ直接ご連絡ください。',
    
    // Prefectures
    tokyo: '東京都',
    kyoto: '京都府',
    osaka: '大阪府',
    miyagi: '宮城県',
    fukuoka: '福岡県',
    aichi: '愛知県',
    saitama: '埼玉県',
    kanagawa: '神奈川県',
    chiba: '千葉県',
    
    // Advanced Filters
    advancedFilters: '詳細フィルター',
    languageSupport: '言語対応',
    speaksEnglish: '英語対応可能',
    speaksChinese: '中国語対応可能',
    speaksKorean: '韓国語対応可能',
    staffFeatures: 'スタッフ特性',
    hasFemaleArtist: '女性アーティスト在籍',
    lgbtqFriendly: 'LGBTQ+フレンドリー',
    beginnerFriendly: '初心者歓迎',
    servicesAmenities: 'サービス・設備',
    sameDayBooking: '当日予約可能',
    privateRoom: 'プライベートルームあり',
    parkingAvailable: '駐車場あり',
    creditCardAccepted: 'クレジットカード対応',
    digitalPaymentAccepted: '電子マネー対応',
    lateNightHours: '深夜営業（20時以降）',
    weekendHours: '土日営業',
    specializedServices: '専門サービス',
    customDesignAllowed: '持ち込みデザイン対応',
    coverUpAvailable: 'カバーアップ（修正）対応',
    jaguaTattoo: 'ジャグアタトゥー対応'
  }
} as const

export type TranslationKey = keyof typeof translations.en