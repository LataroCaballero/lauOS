import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import PocketBase from 'pocketbase'

const PUBLIC_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // Create a fresh PocketBase instance per request — never share across requests
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)

  const cookieValue = request.cookies.get('pb_auth')?.value ?? ''
  if (cookieValue) {
    pb.authStore.loadFromCookie(`pb_auth=${cookieValue}`)
  }

  // Silent token refresh — keeps session alive indefinitely with daily use
  try {
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh()
      response.headers.append(
        'set-cookie',
        pb.authStore.exportToCookie({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
          path: '/',
        })
      )
    }
  } catch {
    pb.authStore.clear()
  }

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Redirect unauthenticated users to login
  if (!pb.authStore.isValid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login
  if (pb.authStore.isValid && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
