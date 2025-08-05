import { useState, useEffect } from 'react'
import { Style } from '@/types/database'
import { getStyleNamesByIds } from '@/lib/styleHelpers'

export function useStyleNames(styleIds: number[], styles: Style[], language: 'ja' | 'en' = 'ja') {
  const [styleNames, setStyleNames] = useState<string[]>([])

  useEffect(() => {
    if (styleIds && Array.isArray(styleIds) && styleIds.every(id => typeof id === 'number')) {
      // Convert IDs to names
      const names = getStyleNamesByIds(styleIds, styles, language)
      setStyleNames(names)
    } else if (styleIds && Array.isArray(styleIds) && styleIds.every(id => typeof id === 'string')) {
      // Already style names
      setStyleNames(styleIds as string[])
    } else {
      setStyleNames([])
    }
  }, [styleIds, styles, language])

  return styleNames
}