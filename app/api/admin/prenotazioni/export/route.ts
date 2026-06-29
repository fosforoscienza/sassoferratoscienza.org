import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false as const, status: 401 }
  const { data: adminRow } = await supabase
    .from('sass_admin_users')
    .select('email')
    .ilike('email', user.email ?? '')
    .maybeSingle()
  if (!adminRow) return { supabase, ok: false as const, status: 403 }
  return { supabase, ok: true as const }
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",;\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export async function GET(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: auth.status })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '')
    .toLowerCase()
    .replace(/[,:()*.\\%]/g, '')
    .trim()
    .slice(0, 80)
  const onlyCheckin = url.searchParams.get('checkin') === '1'

  let matchingEventiIds: string[] = []
  if (q) {
    const { data: ev } = await auth.supabase
      .from('sass_eventi')
      .select('id')
      .ilike('titolo', `%${q}%`)
    matchingEventiIds = (ev ?? []).map((e: { id: string }) => e.id)
  }

  let query = auth.supabase
    .from('sass_prenotazioni')
    .select(
      'id, nome, cognome, email, telefono, cap, n_persone, note, check_in_at, check_in_by, created_at, evento:sass_eventi(titolo, categoria, data, ora_inizio), turno:sass_turni(data, ora_inizio, ora_fine)',
    )
    .order('created_at', { ascending: false })
    .limit(10000)

  if (onlyCheckin) query = query.not('check_in_at', 'is', null)
  if (q) {
    const personFilter = `nome.ilike.%${q}%,cognome.ilike.%${q}%,email.ilike.%${q}%`
    if (matchingEventiIds.length > 0) {
      query = query.or(`${personFilter},evento_id.in.(${matchingEventiIds.join(',')})`)
    } else {
      query = query.or(personFilter)
    }
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Errore export' }, { status: 500 })
  }

  const header = [
    'data_prenotazione', 'nome', 'cognome', 'email', 'telefono', 'cap',
    'n_persone', 'laboratorio', 'categoria', 'data_evento', 'ora_evento',
    'turno', 'check_in', 'check_in_by', 'note',
  ]
  const rows = (data ?? []).map((p: any) => {
    const ev = Array.isArray(p.evento) ? p.evento[0] : p.evento
    const turno = Array.isArray(p.turno) ? p.turno[0] : p.turno
    const turnoLabel = turno
      ? `${turno.data ?? ''} ${String(turno.ora_inizio).slice(0, 5)}-${String(turno.ora_fine).slice(0, 5)}`.trim()
      : ''
    return [
      p.created_at,
      p.nome,
      p.cognome,
      p.email,
      p.telefono ?? '',
      p.cap ?? '',
      p.n_persone,
      ev?.titolo ?? '',
      ev?.categoria ?? '',
      ev?.data ?? '',
      ev ? String(ev.ora_inizio).slice(0, 5) : '',
      turnoLabel,
      p.check_in_at ?? '',
      p.check_in_by ?? '',
      p.note ?? '',
    ].map(csvEscape).join(',')
  })

  const csv = [header.join(','), ...rows].join('\n')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filename = `sassoferrato-prenotazioni-${stamp}.csv`

  return new Response('﻿' + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
