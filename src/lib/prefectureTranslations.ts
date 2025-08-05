import { Language } from './i18n'

// 地域翻訳マップ（シンプル表記）
export const regionTranslations: { [key: string]: { en: string; ja: string } } = {
  '東京': { en: 'Tokyo', ja: '東京' },
  '京都': { en: 'Kyoto', ja: '京都' },
  '大阪': { en: 'Osaka', ja: '大阪' },
  '宮城': { en: 'Miyagi', ja: '宮城' },
  '福岡': { en: 'Fukuoka', ja: '福岡' },
  '愛知': { en: 'Aichi', ja: '愛知' },
  '埼玉': { en: 'Saitama', ja: '埼玉' },
  '神奈川': { en: 'Kanagawa', ja: '神奈川' },
  '千葉': { en: 'Chiba', ja: '千葉' },
  '兵庫': { en: 'Hyogo', ja: '兵庫' },
  '沖縄': { en: 'Okinawa', ja: '沖縄' },
  '滋賀': { en: 'Shiga', ja: '滋賀' },
  // 旧形式との互換性
  '東京都': { en: 'Tokyo', ja: '東京' },
  '京都府': { en: 'Kyoto', ja: '京都' },
  '大阪府': { en: 'Osaka', ja: '大阪' },
  '宮城県': { en: 'Miyagi', ja: '宮城' },
  '福岡県': { en: 'Fukuoka', ja: '福岡' },
  '愛知県': { en: 'Aichi', ja: '愛知' },
  '埼玉県': { en: 'Saitama', ja: '埼玉' },
  '神奈川県': { en: 'Kanagawa', ja: '神奈川' },
  '千葉県': { en: 'Chiba', ja: '千葉' },
  '兵庫県': { en: 'Hyogo', ja: '兵庫' },
  '沖縄県': { en: 'Okinawa', ja: '沖縄' },
  '滋賀県': { en: 'Shiga', ja: '滋賀' },
}

export function getPrefectureTranslation(region: string, language: Language): string {
  return regionTranslations[region] ? regionTranslations[region][language] : region
}