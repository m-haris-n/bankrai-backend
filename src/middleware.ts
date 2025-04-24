import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose' // You'll need to install this package

// List of public routes that don't require authentication
const publicRoutes = [
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/health',
  '/api/v1/auth-email/:path*'
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  if (isPublicRoute) {
    return res
  }

  // Try to get the session from Supabase first
  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's a Supabase session, use it
  if (session?.user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.user.id)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // If no Supabase session, try Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      // Verify the JWT token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      )
      const { data: { user } } = await supabase.auth.getUser(token)
      if (payload.sub) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', payload.sub)
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
    } catch (error) {
      console.error('Token verification failed:', error)
    }
  }

  // If neither authentication method works, return unauthorized
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/v1/chats/:path*',
    '/api/v1/users/:path*',
    '/api/v1/auth/:path*',
    '/api/v1/plaid/:path*'
  ]
}