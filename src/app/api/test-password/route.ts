import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const adminPassword = process.env.ADMIN_PASSWORD
    
    // Debug information
    const debug = {
      receivedPassword: password,
      receivedLength: password?.length,
      envPassword: adminPassword,
      envLength: adminPassword?.length,
      isEqual: password === adminPassword,
      trimmedEqual: password?.trim() === adminPassword?.trim(),
      envPasswordExists: !!adminPassword,
      // Character codes for debugging
      receivedChars: password ? Array.from(password).map(c => c.charCodeAt(0)) : [],
      envChars: adminPassword ? Array.from(adminPassword).map(c => c.charCodeAt(0)) : []
    }
    
    console.log('Password debug:', debug)
    
    return NextResponse.json({
      success: password === adminPassword,
      debug
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    envPasswordSet: !!process.env.ADMIN_PASSWORD,
    envPasswordLength: process.env.ADMIN_PASSWORD?.length,
    nodeEnv: process.env.NODE_ENV
  })
}