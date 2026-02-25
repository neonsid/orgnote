import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const pathname = request.nextUrl.pathname

  // Logged-in users trying to access / should be redirected to dashboard
  if (pathname === '/' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Non-logged-in users trying to access dashboard should be redirected to /
  if (pathname === '/dashboard' && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard'],
}
