import type { MetadataRoute } from 'next'
import { createServerClient } from '@supabase/ssr'

const SITE = 'https://sassoferratoscienza.org'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/prenota`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Pagine dei singoli laboratori (lettura pubblica)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data } = await supabase.from('sass_eventi').select('id').order('numero')
    for (const e of data ?? []) {
      routes.push({ url: `${SITE}/prenota/${e.id}`, changeFrequency: 'daily', priority: 0.7 })
    }
  } catch {
    /* se il DB non è raggiungibile, resta la sitemap base */
  }

  return routes
}
