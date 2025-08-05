import { NextRequest, NextResponse } from 'next/server'
import { syncStudiosToProduction } from '@/lib/api'
import { Studio } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studios } = body

    if (!studios || !Array.isArray(studios)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request: studios array is required' 
        },
        { status: 400 }
      )
    }

    if (studios.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No studios provided to sync' 
        },
        { status: 400 }
      )
    }

    console.log(`📊 API: Syncing ${studios.length} studios to production...`)

    // Validate each studio has minimum required fields
    const invalidStudios = studios.filter((studio: any) => 
      !studio || 
      typeof studio !== 'object' || 
      (!studio.name_ja && !studio.name_en) ||
      !studio.location
    )

    if (invalidStudios.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${invalidStudios.length} studios have invalid data (missing name or location)` 
        },
        { status: 400 }
      )
    }

    const results = await syncStudiosToProduction(studios as Studio[])

    console.log('📊 Studio sync results:', results)

    if (results.failed === 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${results.successful} studios`,
        results
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Sync completed with errors: ${results.successful} successful, ${results.failed} failed`,
        results
      }, { status: 207 }) // 207 Multi-Status for partial success
    }

  } catch (error: any) {
    console.error('❌ Studio sync API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown server error',
        details: error.stack?.split('\n')[0] || 'No stack trace available'
      },
      { status: 500 }
    )
  }
}