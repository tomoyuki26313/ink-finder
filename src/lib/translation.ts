// AI-powered translation service for tattoo artist content

interface TranslationRequest {
  text: string
  fromLanguage: 'ja' | 'en'
  toLanguage: 'ja' | 'en'
  context?: 'bio' | 'name' | 'style' | 'general'
}

interface TranslationResponse {
  translatedText: string
  success: boolean
  error?: string
}

export async function translateWithAI({
  text,
  fromLanguage,
  toLanguage,
  context = 'general'
}: TranslationRequest): Promise<TranslationResponse> {
  try {
    // Skip translation if text is empty or languages are the same
    if (!text.trim() || fromLanguage === toLanguage) {
      return {
        translatedText: text,
        success: true
      }
    }

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        fromLanguage,
        toLanguage,
        context
      })
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      translatedText: data.translatedText,
      success: true
    }
  } catch (error) {
    console.error('Translation error:', error)
    return {
      translatedText: text, // Fallback to original text
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    }
  }
}

// Batch translation for multiple fields
export async function translateArtistData(artistData: {
  name_ja?: string
  name_en?: string
  bio_ja?: string
  bio_en?: string
}, targetLanguage: 'ja' | 'en') {
  const sourceLanguage = targetLanguage === 'ja' ? 'en' : 'ja'
  
  const translations: { [key: string]: string } = {}
  
  // Determine which fields need translation
  const fieldsToTranslate: Array<{
    sourceField: string
    targetField: string
    context: 'name' | 'bio'
  }> = []
  
  if (targetLanguage === 'ja') {
    if (artistData.name_en && !artistData.name_ja) {
      fieldsToTranslate.push({
        sourceField: 'name_en',
        targetField: 'name_ja',
        context: 'name'
      })
    }
    if (artistData.bio_en && !artistData.bio_ja) {
      fieldsToTranslate.push({
        sourceField: 'bio_en',
        targetField: 'bio_ja', 
        context: 'bio'
      })
    }
  } else {
    if (artistData.name_ja && !artistData.name_en) {
      fieldsToTranslate.push({
        sourceField: 'name_ja',
        targetField: 'name_en',
        context: 'name'
      })
    }
    if (artistData.bio_ja && !artistData.bio_en) {
      fieldsToTranslate.push({
        sourceField: 'bio_ja',
        targetField: 'bio_en',
        context: 'bio'
      })
    }
  }
  
  // Perform translations
  for (const field of fieldsToTranslate) {
    const sourceText = (artistData as any)[field.sourceField]
    if (sourceText) {
      const result = await translateWithAI({
        text: sourceText,
        fromLanguage: sourceLanguage,
        toLanguage: targetLanguage,
        context: field.context
      })
      
      if (result.success) {
        translations[field.targetField] = result.translatedText
      }
    }
  }
  
  return translations
}