import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Crea un rate limiter Upstash.
 * Se le env vars non sono configurate restituisce null (degradazione graceful —
 * l'app funziona senza Redis ma senza protezione rate limit).
 */
function makeRatelimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const redis = new Redis({ url, token })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  })
}

// Limiti per endpoint sensibili
export const rateLimitPrenota = makeRatelimiter(10, '1 h') // 10 prenotazioni/IP/ora

/**
 * Estrae l'IP dal request header (Vercel/proxy mette x-forwarded-for).
 * Fallback a '127.0.0.1' se non trovato (dev locale).
 */
export function getIP(req: Request): string {
  const xff = (req.headers as Headers).get('x-forwarded-for')
  return xff ? xff.split(',')[0].trim() : '127.0.0.1'
}

/**
 * Controlla il rate limit per un dato limiter e IP.
 * Restituisce null se ok, oppure un oggetto se limitato.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  ip: string,
  identifier: string,
): Promise<{ limited: true; reset: number } | null> {
  if (!limiter) return null // Redis non configurato → passa

  const { success, reset } = await limiter.limit(`${identifier}:${ip}`)
  if (!success) return { limited: true, reset }
  return null
}
