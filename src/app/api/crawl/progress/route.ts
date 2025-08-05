import { NextRequest, NextResponse } from 'next/server'

// サーバーサイドクローリング進捗管理
interface CrawlProgress {
  sessionId: string
  totalUrls: number
  processedUrls: number
  successfulCrawls: number
  failedCrawls: number
  currentUrl?: string
  status: 'idle' | 'running' | 'completed' | 'error'
  startTime: string
  errors: { url: string; error: string }[]
}

// メモリ内進捗ストレージ（本番環境ではRedisやDBを使用）
const progressStore = new Map<string, CrawlProgress>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    )
  }

  const progress = progressStore.get(sessionId)
  
  if (!progress) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(progress)
}

export async function POST(request: NextRequest) {
  try {
    const progress: CrawlProgress = await request.json()
    progressStore.set(progress.sessionId, progress)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid progress data' },
      { status: 400 }
    )
  }
}

// 進捗を更新するヘルパー関数（他のAPIから使用）
export function updateProgress(sessionId: string, updates: Partial<CrawlProgress>) {
  const existing = progressStore.get(sessionId)
  if (existing) {
    const updated = { ...existing, ...updates }
    progressStore.set(sessionId, updated)
    return updated
  }
  return null
}

// 新しいセッションを作成
export function createSession(sessionId: string, totalUrls: number): CrawlProgress {
  const progress: CrawlProgress = {
    sessionId,
    totalUrls,
    processedUrls: 0,
    successfulCrawls: 0,
    failedCrawls: 0,
    status: 'running',
    startTime: new Date().toISOString(),
    errors: []
  }
  
  progressStore.set(sessionId, progress)
  return progress
}

// セッションをクリーンアップ（1時間後に自動削除）
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  
  progressStore.forEach((progress, sessionId) => {
    if (new Date(progress.startTime).getTime() < oneHourAgo) {
      progressStore.delete(sessionId)
    }
  })
}, 60 * 60 * 1000) // 1時間ごとにクリーンアップ