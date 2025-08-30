import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ink Finder - 日本のタトゥーアーティスト検索',
  description: '日本全国のタトゥーアーティストとスタジオを検索。ポートフォリオを閲覧し、レビューを読んで、認証された彫師や現代タトゥーアーティストの予約が可能です。',
  openGraph: {
    locale: 'ja-JP',
  },
}

export default function JapaneseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}