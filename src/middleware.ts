import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = ['en', 'ja'].every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Skip middleware for API routes, static files, and special Next.js routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/local')
  ) {
    return NextResponse.next()
  }

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    // Redirect to the locale-prefixed path
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

function getLocale(request: NextRequest): string {
  // Check if user has a saved preference in cookies
  const cookieLocale = request.cookies.get('ink-finder-language')?.value
  if (cookieLocale === 'ja' || cookieLocale === 'en') {
    return cookieLocale
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  const isJapanese = acceptLanguage.toLowerCase().includes('ja')
  
  return isJapanese ? 'ja' : 'en'
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
}