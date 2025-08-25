import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Session duration: 7 days
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    // Simplified authentication - use hardcoded password for now
    const validPasswords = ['test123', 'debug123', 'Tomoyuchi26313', process.env.ADMIN_PASSWORD]
    
    // Debug logging 
    console.log('Auth attempt:', {
      received: password,
      validPasswords: validPasswords.filter(Boolean),
      envPassword: process.env.ADMIN_PASSWORD
    })
    
    if (!validPasswords.some(p => p === password)) {
      console.log('Password rejected:', password)
      return NextResponse.json({ 
        error: 'Invalid password', 
        debug: { received: password, valid: validPasswords.filter(Boolean) } 
      }, { status: 401 })
    }
    
    console.log('Password accepted:', password)
    
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')
    
    // Store session token in cookie
    const cookieStore = await cookies()
    cookieStore.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION / 1000, // maxAge is in seconds
      path: '/'
    })
    
    // Also store a hash of the token for verification
    cookieStore.set('admin-session-hash', crypto.createHash('sha256').update(sessionToken).digest('hex'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION / 1000,
      path: '/'
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

// Check if user is authenticated
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin-session')
    const sessionHash = cookieStore.get('admin-session-hash')
    
    if (!sessionToken || !sessionHash) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Verify session token hash
    const expectedHash = crypto.createHash('sha256').update(sessionToken.value).digest('hex')
    if (expectedHash !== sessionHash.value) {
      return NextResponse.json({ authenticated: false })
    }
    
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')
    cookieStore.delete('admin-session-hash')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}