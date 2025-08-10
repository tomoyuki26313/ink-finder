import { Language } from './i18n'

// スタイル翻訳マップ
export const styleTranslations: { [key: string]: { en: string; ja: string } } = {
  '和彫り': { en: 'Traditional Japanese', ja: '和彫り' },
  'アニメ': { en: 'Anime', ja: 'アニメ' },
  'アメリカントラディショナル': { en: 'American Traditional', ja: 'アメリカントラディショナル' },
  'リアリズム': { en: 'Realism', ja: 'リアリズム' },
  'ウォーターカラー': { en: 'Watercolor', ja: 'ウォーターカラー' },
  'ジオメトリック': { en: 'Geometric', ja: 'ジオメトリック' },
  'ファインライン': { en: 'Fine Line', ja: 'ファインライン' },
  'ブラックワーク': { en: 'Blackwork', ja: 'ブラックワーク' },
  'ネオジャパニーズ': { en: 'Neo Japanese', ja: 'ネオジャパニーズ' },
  'ポートレート': { en: 'Portrait', ja: 'ポートレート' },
  'ミニマル': { en: 'Minimal', ja: 'ミニマル' },
  'ドットワーク': { en: 'Dotwork', ja: 'ドットワーク' },
  'トライバル': { en: 'Tribal', ja: 'トライバル' },
  'アブストラクト': { en: 'Abstract', ja: 'アブストラクト' },
  'ボタニカル': { en: 'Botanical', ja: 'ボタニカル' },
  'ブラック&グレー': { en: 'Black & Grey', ja: 'ブラック&グレー' },
  'オールドスクール': { en: 'Old School', ja: 'オールドスクール' },
  'ニュースクール': { en: 'New School', ja: 'ニュースクール' },
  'マンダラ': { en: 'Mandala', ja: 'マンダラ' },
  'セイクリッドジオメトリー': { en: 'Sacred Geometry', ja: 'セイクリッドジオメトリー' },
  'ボールドライン': { en: 'Bold Line', ja: 'ボールドライン' },
  'チカーノ': { en: 'Chicano', ja: 'チカーノ' },
  'カラータトゥー': { en: 'Color Tattoo', ja: 'カラータトゥー' },
  '幾何学模様': { en: 'Geometric', ja: '幾何学模様' },
  '水彩画': { en: 'Watercolor', ja: '水彩画' }
}

export function getStyleTranslation(style: string, language: Language): string {
  return styleTranslations[style] ? styleTranslations[style][language] : style
}