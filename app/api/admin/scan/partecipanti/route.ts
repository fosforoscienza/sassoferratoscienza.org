import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Elenco partecipanti di un turno o di un laboratorio (non a turni), con stato
// check-in, per la pagina admin/scan. Solo admin loggati.
export async function GET(req: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }
  const { data: adminRow } = await supabase
    .from('sass_admin_users')
    .select('email')
    .ilike('email', user.email ?? '')
    .maybeSingle()
  if (!adminRow) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const turnoId = searchParams.get('turnoId')
  const eventoId = searchParams.get('eventoId')
  if (!turnoId && !eventoId) {
    return NextResponse.json({ error: 'Manca turnoId o eventoId' }, { status: 400 })
  }

  const admin = createAdminClient()
  let query = admin
    .from('sass_prenotazioni')
    .select('id, nome, cognome, n_persone, check_in_at')
  if (turnoId) query = query.eq('turno_id', turnoId)
  else query = query.eq('evento_id', eventoId!).is('turno_id', null)

  const { data, error } = await query
    .order('cognome', { ascending: true })
    .order('nome', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Errore lettura partecipanti' }, { status: 500 })
  }

  const partecipanti = (data ?? []).map(p => ({
    id: p.id,
    nome: p.nome,
    cognome: p.cognome,
    n_persone: p.n_persone ?? 1,
    checkedIn: !!p.check_in_at,
  }))

  return NextResponse.json({ partecipanti })
}
