import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas que Google debe poder indexar
const publicRoutes = [
  '/q/',
  '/quiz/',
  '/explorar',
  '/ayuda',
  '/blog',
  '/usuario/',
  '/privacidad',
  '/terminos',
]

function isPublicRoute(pathname: string) {
  return publicRoutes.some(r => pathname.startsWith(r)) || pathname === '/'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que nunca bloqueamos
  const bypass = [
    '/bloqueado',
    '/auth',
    '/_next',
    '/favicon',
    '/api/auth',
  ]
  if (bypass.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('blocked')
      .eq('id', user.id)
      .single()

    if (profile?.blocked) {
      return NextResponse.redirect(new URL('/bloqueado', request.url))
    }
  }

  // Para rutas públicas sin usuario, forzar headers de cache públicos
  if (!user && isPublicRoute(pathname)) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}