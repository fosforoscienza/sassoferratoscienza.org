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

type StatoLab = { prenotazioni: number; persone: number; scansioni: number; personeScansionate: number }
function statoVuoto(): StatoLab {
  return { prenotazioni: 0, persone: 0, scansioni: 0, personeScansionate: 0 }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: auth.status })
  }

  const [{ data: eventi }, { data: prenotazioni }] = await Promise.all([
    auth.supabase
      .from('sass_eventi')
      .select('id, numero, categoria, titolo')
      .order('numero'),
    auth.supabase.from('sass_prenotazioni').select('evento_id, n_persone, check_in_at'),
  ])

  const statsByEvento = new Map<string, StatoLab>()
  for (const p of prenotazioni ?? []) {
    const cur = statsByEvento.get(p.evento_id) ?? statoVuoto()
    cur.prenotazioni += 1
    cur.persone += p.n_persone
    if (p.check_in_at) {
      cur.scansioni += 1
      cur.personeScansionate += p.n_persone
    }
    statsByEvento.set(p.evento_id, cur)
  }

  const header = [
    'numero', 'categoria', 'laboratorio', 'prenotazioni', 'persone_prenotate',
    'prenotazioni_scansionate', 'persone_scansionate', 'percentuale_presenze',
  ]

  const righe = (eventi ?? []).map(e => {
    const s = statsByEvento.get(e.id) ?? statoVuoto()
    const pct = s.persone > 0 ? Math.round((s.personeScansionate / s.persone) * 100) : 0
    return [e.numero, e.categoria, e.titolo, s.prenotazioni, s.persone, s.scansioni, s.personeScansionate, pct]
      .map(csvEscape)
      .join(',')
  })

  const totali = (eventi ?? []).reduce((acc, e) => {
    const s = statsByEvento.get(e.id) ?? statoVuoto()
    acc.prenotazioni += s.prenotazioni
    acc.persone += s.persone
    acc.scansioni += s.scansioni
    acc.personeScansionate += s.personeScansionate
    return acc
  }, statoVuoto())
  const pctTotale = totali.persone > 0 ? Math.round((totali.personeScansionate / totali.persone) * 100) : 0
  const rigaTotale = ['', '', 'TOTALE', totali.prenotazioni, totali.persone, totali.scansioni, totali.personeScansionate, pctTotale]
    .map(csvEscape)
    .join(',')

  const csv = [header.join(','), ...righe, rigaTotale].join('\n')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filename = `sassoferrato-report-${stamp}.csv`

  return new Response('﻿' + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
