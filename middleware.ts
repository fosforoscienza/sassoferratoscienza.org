import { NextResponse, NextRequest } from 'next/server'

// Middleware Edge-safe: solo guard CSRF sulle API mutanti + header CSP.
// L'autenticazione admin è garantita server-side in app/admin/layout.tsx
// (Node runtime) e nelle route API, quindi qui NON usiamo @supabase/ssr
// (che non è compatibile con l'Edge runtime e farebbe fallire il middleware).

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CSRF guard sulle mutating API
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    if (!isOriginAllowed(request)) {
      return new NextResponse('Forbidden: bad origin', { status: 403 })
    }
  }

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', buildCsp())
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
