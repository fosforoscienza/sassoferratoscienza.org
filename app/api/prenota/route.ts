import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { inviaEmailPrenotazione } from '@/lib/email'
import { rateLimitPrenota, getIP, checkRateLimit } from '@/lib/ratelimit'

/**
 * Massimo numero di posti che una singola email può prenotare per uno stesso
 * scope (evento per i lab non a turni; turno per i lab a turni).
 */
const MAX_POSTI_PER_EMAIL_SCOPE = 5

const PrenotaSchema = z.object({
  evento_id: z.string().uuid(),
  turno_id: z.string().uuid().nullable().optional(),
  nome: z.string().trim().min(1).max(80),
  cognome: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  telefono: z.string().trim().max(40).optional().nullable(),
  cap: z.string().trim().regex(/^\d{5}$/, 'CAP non valido: 5 cifre'),
  n_persone: z.coerce.number().int().min(1).max(20),
  note: z.string().trim().max(500).optional().nullable(),
  privacy_consent: z.literal(true, { errorMap: () => ({ message: 'Devi accettare l\'informativa privacy' }) }),
})

export async function POST(req: Request) {
  const ip = getIP(req)
  const limited = await checkRateLimit(rateLimitPrenota, ip, 'prenota')
  if (limited) {
    return NextResponse.json(
      { error: 'Troppe prenotazioni dallo stesso IP. Riprova più tardi.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 })
  }

  const parsed = PrenotaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dati non validi', issues: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const supabase = createAdminClient()

  const { data: evento, error: errEvento } = await supabase
    .from('sass_eventi')
    .select('id, titolo, sottotitolo, categoria, data, ora_inizio, ora_fine, luogo, capienza_max, prenotazioni_attive, posti_esauriti, a_turni')
    .eq('id', data.evento_id)
    .single()

  if (errEvento || !evento) {
    return NextResponse.json({ error: 'Laboratorio non trovato' }, { status: 404 })
  }
  if (!evento.prenotazioni_attive) {
    return NextResponse.json({ error: 'Prenotazioni chiuse per questo laboratorio' }, { status: 403 })
  }
  if (evento.posti_esauriti) {
    return NextResponse.json({ error: 'Posti esauriti per questo laboratorio' }, { status: 409 })
  }

  if (evento.a_turni && !data.turno_id) {
    return NextResponse.json({ error: 'Seleziona un turno per prenotare questo laboratorio' }, { status: 400 })
  }
  const turnoIdEffettivo: string | null = evento.a_turni ? data.turno_id! : null

  let turno: { id: string; evento_id: string; capienza: number; data: string; ora_inizio: string; ora_fine: string } | null = null
  if (turnoIdEffettivo) {
    const { data: t, error: errTurno } = await supabase
      .from('sass_turni')
      .select('id, evento_id, capienza, data, ora_inizio, ora_fine')
      .eq('id', turnoIdEffettivo)
      .single()
    if (errTurno || !t) {
      return NextResponse.json({ error: 'Turno non trovato' }, { status: 404 })
    }
    if (t.evento_id !== evento.id) {
      return NextResponse.json({ error: 'Turno non appartiene a questo laboratorio' }, { status: 400 })
    }
    turno = t
  }

  const emailNorm = data.email.toLowerCase()

  // Limite cumulativo per email (max 5 posti per scope)
  let prenEmailQuery = supabase
    .from('sass_prenotazioni')
    .select('n_persone')
    .ilike('email', emailNorm)
  if (turnoIdEffettivo) {
    prenEmailQuery = prenEmailQuery.eq('turno_id', turnoIdEffettivo)
  } else {
    prenEmailQuery = prenEmailQuery.eq('evento_id', data.evento_id).is('turno_id', null)
  }
  const { data: prenEmail } = await prenEmailQuery
  const giaPrenotati = (prenEmail ?? []).reduce((acc, p) => acc + (p.n_persone ?? 0), 0)
  if (giaPrenotati + data.n_persone > MAX_POSTI_PER_EMAIL_SCOPE) {
    const rimasti = Math.max(MAX_POSTI_PER_EMAIL_SCOPE - giaPrenotati, 0)
    const scope = turnoIdEffettivo ? 'questo turno' : 'questo laboratorio'
    return NextResponse.json(
      {
        error: rimasti === 0
          ? `Hai già prenotato il massimo di ${MAX_POSTI_PER_EMAIL_SCOPE} posti per ${scope} con questa email.`
          : `Con questa email puoi prenotare ancora ${rimasti} ${rimasti === 1 ? 'posto' : 'posti'} per ${scope} (ne hai già ${giaPrenotati}, limite ${MAX_POSTI_PER_EMAIL_SCOPE}).`,
      },
      { status: 409 }
    )
  }

  // Controllo capienza
  if (turno) {
    const { data: occupati } = await supabase
      .from('sass_prenotazioni')
      .select('n_persone')
      .eq('turno_id', turno.id)
    const sum = (occupati ?? []).reduce((acc, p) => acc + p.n_persone, 0)
    if (sum + data.n_persone > turno.capienza) {
      return NextResponse.json(
        { error: `Posti esauriti per il turno selezionato. Disponibili: ${Math.max(turno.capienza - sum, 0)}` },
        { status: 409 }
      )
    }
  } else if (evento.capienza_max != null) {
    const { data: occupati } = await supabase
      .from('sass_prenotazioni')
      .select('n_persone')
      .eq('evento_id', data.evento_id)
      .is('turno_id', null)
    const sum = (occupati ?? []).reduce((acc, p) => acc + p.n_persone, 0)
    if (sum + data.n_persone > evento.capienza_max) {
      return NextResponse.json(
        { error: `Posti esauriti. Disponibili: ${Math.max(evento.capienza_max - sum, 0)}` },
        { status: 409 }
      )
    }
  }

  const { data: prenotazione, error: errInsert } = await supabase
    .from('sass_prenotazioni')
    .insert({
      evento_id: data.evento_id,
      turno_id: turnoIdEffettivo,
      nome: data.nome,
      cognome: data.cognome,
      email: emailNorm,
      telefono: data.telefono ?? null,
      cap: data.cap,
      n_persone: data.n_persone,
      note: data.note ?? null,
    })
    .select('token')
    .single()

  if (errInsert || !prenotazione) {
    console.error('[prenota] Errore insert:', errInsert)
    return NextResponse.json({ error: 'Errore nel salvataggio della prenotazione' }, { status: 500 })
  }

  // Se lab a turni, data/orario sono quelli del turno scelto
  const dataEmail = turno ? turno.data : evento.data
  const oraInizioEmail = turno ? turno.ora_inizio : evento.ora_inizio
  const oraFineEmail = turno ? turno.ora_fine : evento.ora_fine
  await inviaEmailPrenotazione({
    to: data.email,
    nome: data.nome,
    cognome: data.cognome,
    token: prenotazione.token,
    n_persone: data.n_persone,
    evento: {
      titolo: evento.titolo,
      sottotitolo: evento.sottotitolo,
      categoria: evento.categoria,
      data: dataEmail,
      ora_inizio: oraInizioEmail,
      ora_fine: oraFineEmail,
      luogo: evento.luogo,
    },
  }).catch(err => console.error('[prenota] Email error:', err))

  return NextResponse.json({ token: prenotazione.token }, { status: 201 })
}
