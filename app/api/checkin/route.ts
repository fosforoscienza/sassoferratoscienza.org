import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isAllowedOrigin } from '@/lib/csrf'

const CheckinSchema = z.object({
  token: z.string().uuid(),
  turnoId: z.string().uuid().nullable().optional(),
  eventoId: z.string().uuid().nullable().optional(),
})

async function contaTurno(supabase: ReturnType<typeof createClient>, turnoId: string) {
  const { data: turno } = await supabase
    .from('sass_turni')
    .select('capienza')
    .eq('id', turnoId)
    .maybeSingle()
  const { data: righe } = await supabase
    .from('sass_prenotazioni')
    .select('n_persone, check_in_at')
    .eq('turno_id', turnoId)
  const prenotatiPersone = (righe ?? []).reduce((acc, r) => acc + (r.n_persone ?? 0), 0)
  const checkinPersone = (righe ?? [])
    .filter(r => r.check_in_at)
    .reduce((acc, r) => acc + (r.n_persone ?? 0), 0)
  return { capienza: turno?.capienza ?? null, prenotatiPersone, checkinPersone }
}

async function contaEvento(supabase: ReturnType<typeof createClient>, eventoId: string) {
  const { data: evento } = await supabase
    .from('sass_eventi')
    .select('capienza_max')
    .eq('id', eventoId)
    .maybeSingle()
  const { data: righe } = await supabase
    .from('sass_prenotazioni')
    .select('n_persone, check_in_at')
    .eq('evento_id', eventoId)
    .is('turno_id', null)
  const prenotatiPersone = (righe ?? []).reduce((acc, r) => acc + (r.n_persone ?? 0), 0)
  const checkinPersone = (righe ?? [])
    .filter(r => r.check_in_at)
    .reduce((acc, r) => acc + (r.n_persone ?? 0), 0)
  return { capienza: evento?.capienza_max ?? null, prenotatiPersone, checkinPersone }
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Origine non valida' }, { status: 403 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { data: adminRow } = await supabase
    .from('sass_admin_users')
    .select('email, ruolo')
    .ilike('email', user.email ?? '')
    .maybeSingle()
  if (!adminRow) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 })
  }

  const parsed = CheckinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token non valido' }, { status: 400 })
  }

  const { data: prenotazione, error: errRead } = await supabase
    .from('sass_prenotazioni')
    .select('id, nome, cognome, check_in_at, turno_id, evento_id, evento:sass_eventi(titolo)')
    .eq('token', parsed.data.token)
    .single()

  if (errRead || !prenotazione) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
  }

  const ev = (prenotazione as any).evento
  const titoloEvento = Array.isArray(ev) ? ev[0]?.titolo : ev?.titolo

  const turnoId = parsed.data.turnoId ?? null
  const eventoId = parsed.data.eventoId ?? null
  if (turnoId && prenotazione.turno_id !== turnoId) {
    let dettaglio = titoloEvento ?? ''
    if (prenotazione.turno_id) {
      const { data: t } = await supabase
        .from('sass_turni')
        .select('data, ora_inizio, ora_fine')
        .eq('id', prenotazione.turno_id)
        .maybeSingle()
      if (t) {
        const orario = `${(t.ora_inizio ?? '').slice(0, 5)}–${(t.ora_fine ?? '').slice(0, 5)}`
        dettaglio = `${titoloEvento ?? ''} · turno ${orario}`.trim()
      }
    }
    return NextResponse.json(
      { error: dettaglio ? `Questo QR è per un altro turno: ${dettaglio}` : 'Questo QR appartiene a un altro turno/laboratorio' },
      { status: 409 }
    )
  }
  if (eventoId && prenotazione.evento_id !== eventoId) {
    return NextResponse.json(
      { error: titoloEvento ? `Questo QR è per un altro laboratorio: ${titoloEvento}` : 'Questo QR appartiene a un altro laboratorio' },
      { status: 409 }
    )
  }

  async function conteggio() {
    if (turnoId) return contaTurno(supabase, turnoId)
    if (eventoId) return contaEvento(supabase, eventoId)
    return null
  }

  if (prenotazione.check_in_at) {
    return NextResponse.json({
      ok: true,
      gia: true,
      nome: prenotazione.nome,
      cognome: prenotazione.cognome,
      evento: titoloEvento,
      check_in_at: prenotazione.check_in_at,
      conteggio: await conteggio(),
    })
  }

  const { error: errUpd } = await supabase
    .from('sass_prenotazioni')
    .update({ check_in_at: new Date().toISOString(), check_in_by: user.email })
    .eq('id', prenotazione.id)

  if (errUpd) {
    return NextResponse.json({ error: 'Errore aggiornamento check-in' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    gia: false,
    nome: prenotazione.nome,
    cognome: prenotazione.cognome,
    evento: titoloEvento,
    conteggio: await conteggio(),
  })
}
