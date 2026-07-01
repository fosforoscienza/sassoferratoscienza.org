import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Le query Supabase server-side NON devono essere messe in cache da Next
// (altrimenti conferma, disponibilità posti e controlli capienza mostrano dati
// stantii — es. una prenotazione cancellata resterebbe visibile).
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' })

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: noStoreFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In Server Components read-only — ignorato
          }
        },
      },
    }
  )
}

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: { fetch: noStoreFetch },
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
