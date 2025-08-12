'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Language } from '@/lib/i18n'

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-slate-800"
        title={t('language')}
      >
        <img src="/global.png" alt="Language" className="w-4 h-4" />
        <span>
          {language === 'en' ? 'English' : '日本語'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[100px]">
          <button
            onClick={() => handleLanguageSelect('en')}
            className={`w-full flex items-center justify-center px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 transition-colors ${
              language === 'en' ? 'bg-slate-100 font-medium' : ''
            }`}
          >
            <span>English</span>
          </button>
          <button
            onClick={() => handleLanguageSelect('ja')}
            className={`w-full flex items-center justify-center px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 transition-colors ${
              language === 'ja' ? 'bg-slate-100 font-medium' : ''
            }`}
          >
            <span>日本語</span>
          </button>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}