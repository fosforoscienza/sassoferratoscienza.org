// Controllo CSRF leggero: accetta solo richieste con Origin/Referer coerenti
// (host del sito, *.vercel.app, o stesso host della richiesta). Sostituisce il
// guard che prima stava nel middleware. Da usare nelle route API mutanti.

const ALLOWED_HOSTS = new Set<string>([
  'sassoferratoscienza.org',
  'www.sassoferratoscienza.org',
  'localhost',
  '127.0.0.1',
])

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')?.split(':')[0] ?? null

  // Nessun Origin/Referer (es. alcuni client server-to-server): non blocchiamo.
  if (!origin && !referer) return true

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
