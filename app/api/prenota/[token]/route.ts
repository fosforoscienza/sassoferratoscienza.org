import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimitPrenota, getIP, checkRateLimit } from '@/lib/ratelimit'

const TokenSchema = z.string().uuid()

export async function DELETE(_req: Request, { params }: { params: { token: string } }) {
  const ip = getIP(_req)
  const limited = await checkRateLimit(rateLimitPrenota, ip, 'prenota-cancel')
  if (limited) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova più tardi.' }, { status: 429 })
  }

  const parsed = TokenSchema.safeParse(params.token)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token non valido' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: prenotazione, error: readErr } = await supabase
    .from('sass_prenotazioni')
    .select('id, check_in_at')
    .eq('token', parsed.data)
    .maybeSingle()

  if (readErr) {
    console.error('[prenota:cancel] Read error:', readErr)
    return NextResponse.json({ error: 'Errore di lettura' }, { status: 500 })
  }
  if (!prenotazione) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
  }
  if (prenotazione.check_in_at) {
    return NextResponse.json(
      { error: 'Il check-in è già stato effettuato, non è possibile cancellare.' },
      { status: 409 },
    )
  }

  const { error: delErr } = await supabase.from('sass_prenotazioni').delete().eq('id', prenotazione.id)
  if (delErr) {
    console.error('[prenota:cancel] Delete error:', delErr)
    return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
