import { NextRequest, NextResponse } from 'next/server'

interface TranslationRequest {
  text: string
  fromLanguage?: 'ja' | 'en'
  toLanguage?: 'ja' | 'en'
  targetLanguage?: 'ja' | 'en' // backward compatibility
  context?: 'bio' | 'name' | 'style' | 'general'
}

// Context-specific prompts for better translation quality
const getTranslationPrompt = (context: string, fromLang: string, toLang: string) => {
  const contextPrompts = {
    bio: {
      'ja-en': 'You are a professional translator specializing in tattoo industry content. Translate this Japanese tattoo artist biography to natural, engaging English. Preserve the artistic style and personality while making it sound professional for English-speaking clients. Focus on their experience, style specialties, and artistic approach.',
      'en-ja': 'あなたはタトゥー業界のコンテンツに特化したプロの翻訳者です。この英語のタトゥーアーティストの経歴を自然で魅力的な日本語に翻訳してください。芸術的なスタイルと個性を保ちながら、日本語話者のクライアントにとって専門的に聞こえるようにしてください。経験、スタイルの専門性、芸術的アプローチに焦点を当ててください。'
    },
    name: {
      'ja-en': 'Translate this Japanese artist name to English. If it\'s a Japanese personal name, provide the proper romanized version (e.g., 田中 → Tanaka). If it\'s an artistic alias or studio name, translate appropriately while maintaining the artistic meaning.',
      'en-ja': 'この英語のアーティスト名を日本語に翻訳してください。個人名の場合は適切な日本語表記を、芸術的な別名やスタジオ名の場合は芸術的な意味を保ちながら適切に翻訳してください。'
    },
    style: {
      'ja-en': 'Translate this Japanese tattoo style name to English, maintaining the technical accuracy of tattoo terminology. Use standard industry terms.',
      'en-ja': 'この英語のタトゥースタイル名を日本語に翻訳してください。タトゥー用語の技術的な正確性を保ち、業界標準の用語を使用してください。'
    },
    general: {
      'ja-en': 'Translate this Japanese text to natural, fluent English.',
      'en-ja': 'この英語のテキストを自然で流暢な日本語に翻訳してください。'
    }
  }
  
  const key = `${fromLang}-${toLang}` as keyof typeof contextPrompts.bio
  return contextPrompts[context as keyof typeof contextPrompts]?.[key] || contextPrompts.general[key]
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json()
    const { 
      text, 
      fromLanguage,
      toLanguage,
      targetLanguage, // backward compatibility
      context = 'general' 
    } = body
    
    // Handle backward compatibility
    const finalToLanguage = toLanguage || targetLanguage || 'en'
    const finalFromLanguage = fromLanguage || (finalToLanguage === 'en' ? 'ja' : 'en')
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ translatedText: '' })
    }

    console.log('🔍 AI Translating text:', text)
    console.log('📍 From:', finalFromLanguage, 'To:', finalToLanguage, 'Context:', context)

    // Skip translation if languages are the same
    if (finalFromLanguage === finalToLanguage) {
      return NextResponse.json({ translatedText: text })
    }
    
    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('⚠️ OpenAI API key not configured, falling back to simple translation')
      return fallbackTranslation(text, finalFromLanguage, finalToLanguage)
    }
    
    // Create context-specific prompt
    const systemPrompt = getTranslationPrompt(context, finalFromLanguage, finalToLanguage)
    
    console.log('🤖 Using OpenAI for translation...')
    
    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use the more cost-effective model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent translations
      }),
    })
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', errorText)
      console.log('🔄 Falling back to simple translation')
      return fallbackTranslation(text, finalFromLanguage, finalToLanguage)
    }
    
    const openaiData = await openaiResponse.json()
    const translatedText = openaiData.choices[0]?.message?.content?.trim()
    
    if (!translatedText) {
      console.error('❌ No translation received from OpenAI')
      return fallbackTranslation(text, finalFromLanguage, finalToLanguage)
    }
    
    console.log('✅ AI Translation successful:', translatedText)
    return NextResponse.json({ translatedText })
    
  } catch (error) {
    console.error('❌ Translation API error:', error)
    // Fall back to simple translation on error
    const { text, fromLanguage = 'ja', toLanguage = 'en' } = await request.json()
    return fallbackTranslation(text, fromLanguage, toLanguage)
  }
}

// Fallback translation function (original logic)
function fallbackTranslation(text: string, fromLang: string, toLang: string) {
  console.log('🔄 Using fallback translation')
  
  if (fromLang === 'ja' && toLang === 'en') {
    // Check if text contains Japanese characters
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
    
    if (!hasJapanese) {
      return NextResponse.json({ translatedText: text })
    }

    // Simple romanization and basic translation
    let translatedText = romanizeJapanese(text)

    // Enhanced translation mapping for common tattoo terms and names
    const translationMap: { [key: string]: string } = {
      // Common surnames
      '田中': 'Tanaka',
      '山田': 'Yamada', 
      '佐藤': 'Sato',
      '鈴木': 'Suzuki',
      '高橋': 'Takahashi',
      '渡辺': 'Watanabe',
      '伊藤': 'Ito',
      '中村': 'Nakamura',
      '小林': 'Kobayashi',
      '加藤': 'Kato',
      '山本': 'Yamamoto',
      '吉田': 'Yoshida',
      '松本': 'Matsumoto',
      
      // Common first names
      'ゆき': 'Yuki',
      '裕樹': 'Hiroki',
      '健二': 'Kenji',
      '美咲': 'Misaki',
      '翔太': 'Shota',
      '彩': 'Aya',
      
      // Tattoo terms
      '彫師': 'tattoo artist',
      'タトゥーアーティスト': 'tattoo artist',
      '刺青師': 'tattoo artist',
      '和彫り': 'Japanese traditional tattooing',
      'イレズミ': 'traditional Japanese tattoo',
      '刺青': 'tattoo',
      'タトゥー': 'tattoo',
      '経験': 'experience',
      '年間': 'years',
      '年': 'years',
      '専門': 'specializing in',
      '得意': 'skilled in',
      'スタイル': 'style',
      'デザイン': 'design',
      'アート': 'art',
      '作品': 'artwork',
      '技術': 'technique',
      '伝統的': 'traditional',
      'モダン': 'modern',
      '現代的': 'contemporary',
      
      // Locations
      '東京': 'Tokyo',
      '大阪': 'Osaka',
      '京都': 'Kyoto',
      '神奈川': 'Kanagawa',
      '愛知': 'Aichi',
      '福岡': 'Fukuoka',

      // Common phrases
      'です': '',
      'である': '',
      'している': 'ing',
      'します': 's',
      'の': "'s",
      'を': '',
      'に': 'in',
      'で': 'at',
      'から': 'from',
      'まで': 'to',
      'と': 'and'
    }

    // Apply translations for whole words/phrases first
    Object.entries(translationMap).forEach(([japanese, english]) => {
      const regex = new RegExp(japanese, 'g')
      translatedText = translatedText.replace(regex, english)
    })

    console.log('📝 After word translation:', translatedText)

    // Clean up the text
    translatedText = translatedText
      .replace(/、/g, ', ')
      .replace(/。/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/\s+,/g, ',')
      .replace(/\s+\./g, '.')
      .trim()

    console.log('📝 After cleanup:', translatedText)

    // If still contains significant Japanese or is very short, provide fallback
    const stillHasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(translatedText)
    
    if (stillHasJapanese || translatedText.length < 3) {
      if (text.length < 20) {
        // Likely a name - use romanization
        translatedText = romanizeJapanese(text)
        console.log('📝 Used romanization for name:', translatedText)
      } else {
        // Likely a bio - provide template
        translatedText = `Japanese tattoo artist with expertise in various tattoo styles. Skilled in both traditional and modern techniques.`
        console.log('📝 Used template for bio')
      }
    }

    // Capitalize first letter and clean up
    translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1)
    translatedText = translatedText.replace(/\s+/g, ' ').trim()

    return NextResponse.json({ translatedText })
  }
  
  // Handle other language combinations
  return NextResponse.json({ translatedText: text })
}

// Enhanced romanization function
function romanizeJapanese(text: string): string {
  console.log('🔤 Romanizing:', text)
  
  // First handle common kanji names
  const kanjiNames: { [key: string]: string } = {
    '田中': 'Tanaka',
    '山田': 'Yamada',
    '佐藤': 'Sato',
    '鈴木': 'Suzuki',
    '高橋': 'Takahashi',
    '渡辺': 'Watanabe',
    '伊藤': 'Ito',
    '中村': 'Nakamura',
    '小林': 'Kobayashi',
    '加藤': 'Kato',
    '山本': 'Yamamoto',
    '吉田': 'Yoshida',
    '松本': 'Matsumoto',
    '花子': 'Hanako',
    '太郎': 'Taro',
    '裕樹': 'Hiroki',
    '健二': 'Kenji',
    '美咲': 'Misaki',
    '翔太': 'Shota',
    '彩': 'Aya',
    'ゆき': 'Yuki',
    'みき': 'Miki',
    'あき': 'Aki'
  }

  let result = text

  // Apply kanji name translations first
  Object.entries(kanjiNames).forEach(([kanji, romanized]) => {
    result = result.replace(new RegExp(kanji, 'g'), romanized)
  })

  const hiraganaMap: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n'
  }

  const katakanaMap: { [key: string]: string } = {
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヰ': 'wi', 'ヱ': 'we', 'ヲ': 'wo', 'ン': 'n'
  }

  // Apply hiragana romanization
  Object.entries(hiraganaMap).forEach(([jp, en]) => {
    result = result.replace(new RegExp(jp, 'g'), en)
  })
  
  // Apply katakana romanization
  Object.entries(katakanaMap).forEach(([jp, en]) => {
    result = result.replace(new RegExp(jp, 'g'), en)
  })

  // Clean up and capitalize
  result = result.replace(/\s+/g, ' ').trim()
  
  // Capitalize first letter of each word
  result = result.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')

  console.log('🔤 Romanization result:', result)
  return result
}