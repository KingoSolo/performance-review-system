import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Get session token from cookie
  const token = request.cookies.get('sb-access-token')?.value

  // Public routes (auth pages)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isPublicRoute = isAuthPage || request.nextUrl.pathname === '/'

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If has token, verify it's valid
  if (token) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user }, error } = await supabase.auth.getUser(token)

      // If token is invalid and not on public route, redirect to login
      if (error || !user) {
        if (!isPublicRoute) {
          const loginUrl = new URL('/login', request.url)
          return NextResponse.redirect(loginUrl)
        }
      }

      // If authenticated and on auth page, redirect to appropriate dashboard
      if (user && isAuthPage) {
        // Fetch user details to determine role
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          const dashboardPath = getRoleDashboard(userData.role)
          return NextResponse.redirect(new URL(dashboardPath, request.url))
        }
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      // On error, allow public routes but redirect protected routes to login
      if (!isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'MANAGER':
      return '/manager'
    case 'EMPLOYEE':
      return '/employee'
    default:
      return '/employee'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
