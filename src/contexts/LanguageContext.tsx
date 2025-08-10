'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations, TranslationKey } from '@/lib/i18n'
import { usePathname, useRouter } from 'next/navigation'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string | any
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Detect language from URL path
  const getLanguageFromPath = (): Language => {
    if (pathname.startsWith('/ja')) return 'ja'
    if (pathname.startsWith('/en')) return 'en'
    return 'en' // default to English
  }
  
  const [language, setLanguageState] = useState<Language>(getLanguageFromPath())

  useEffect(() => {
    // Update language when path changes
    setLanguageState(getLanguageFromPath())
  }, [pathname])

  const setLanguage = (lang: Language) => {
    // When language is changed, navigate to the new language path
    const currentPath = pathname.replace(/^\/(en|ja)/, '')
    router.push(`/${lang}${currentPath || ''}`)
    setLanguageState(lang)
    
    // Save preference in localStorage and cookie
    localStorage.setItem('ink-finder-language', lang)
    document.cookie = `ink-finder-language=${lang};path=/;max-age=31536000`
  }

  const t = (key: TranslationKey): string | any => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}