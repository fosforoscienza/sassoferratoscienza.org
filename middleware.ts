import { createServerClient } from '@supabase/ssr'
import { NextResponse, NextRequest } from 'next/server'

const AUTH_PATHS = ['/login']
const PROTECTED_PATHS = ['/admin']

const ALLOWED_HOSTS = new Set<string>([
  'sassoferratoscienza.org',
  'www.sassoferratoscienza.org',
  'localhost',
  '127.0.0.1',
])

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function buildCsp(): string {
  return [
    "default-src 'self'",
    // 'unsafe-inline' negli script serve solo per gli inline minimi della landing;
    // in alternativa si può passare a nonce. Tailwind/Next iniettano stili inline.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(p => pathname.startsWith(p))
}

function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')?.split(':')[0] ?? null

  let sourceHost: string | null = null
  try {
    if (origin) sourceHost = new URL(origin).hostname
    else if (referer) sourceHost = new URL(referer).hostname
  } catch {
    return false
  }
  if (!sourceHost) return false

  if (ALLOWED_HOSTS.has(sourceHost)) return true
  if (sourceHost.endsWith('.vercel.app')) return true
  if (host && sourceHost === host) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CSRF guard sulle mutating API
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    if (!isOriginAllowed(request)) {
      return new NextResponse('Forbidden: bad origin', { status: 403 })
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } })
  response.headers.set('Content-Security-Policy', buildCsp())

  // Auth check sulle route protette
  if (isProtected(pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const redirect = new URL('/login', request.url)
      redirect.searchParams.set('next', pathname)
      return NextResponse.redirect(redirect)
    }
  }

  // Se già loggato e prova ad accedere a /login, lo mando in /admin
  if (AUTH_PATHS.includes(pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
