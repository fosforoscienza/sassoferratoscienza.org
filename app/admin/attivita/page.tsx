import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatRangeOrario, edizioniDisponibili, risolviEdizione } from '@/lib/types'
import EdizioneSwitch from '@/components/EdizioneSwitch'

export const revalidate = 0

type Stat = { persone: number; prenotazioni: number; personeCheckin: number }

function semaforoClass(ratio: number) {
  if (ratio >= 1) return 'text-red-600'
  if (ratio >= 0.75) return 'text-orange-600'
  if (ratio >= 0.4) return 'text-amber-600'
  return 'text-emerald-600'
}

export default async function AdminAttivitaPage({
  searchParams,
}: {
  searchParams: { edizione?: string }
}) {
  const supabase = createClient()

  const [{ data: eventiTutti }, { data: turniTutti }, { data: prenotazioniTutte }] = await Promise.all([
    supabase
      .from('sass_eventi')
      .select('id, numero, categoria, colore, titolo, ora_inizio, ora_fine, luogo, capienza_max, a_turni, edizione')
      .order('numero'),
    supabase
      .from('sass_turni')
      .select('id, evento_id, ora_inizio, ora_fine, capienza, ordine')
      .order('ordine'),
    supabase.from('sass_prenotazioni').select('evento_id, turno_id, n_persone, check_in_at'),
  ])

  const edizioni = edizioniDisponibili(eventiTutti ?? [])
  const edizioneAttiva = risolviEdizione(edizioni, searchParams.edizione)
  const eventi = (eventiTutti ?? []).filter(e => e.edizione === edizioneAttiva)
  const eventoIds = new Set(eventi.map(e => e.id))
  const turni = (turniTutti ?? []).filter(t => eventoIds.has(t.evento_id))
  const prenotazioni = (prenotazioniTutte ?? []).filter(p => eventoIds.has(p.evento_id))

  const turniByEvento = new Map<string, NonNullable<typeof turni>>()
  for (const t of turni ?? []) {
    if (!turniByEvento.has(t.evento_id)) turniByEvento.set(t.evento_id, [])
    turniByEvento.get(t.evento_id)!.push(t)
  }

  const statsByKey = new Map<string, Stat>()
  for (const p of prenotazioni ?? []) {
    const key = p.turno_id ?? `evento:${p.evento_id}`
    const cur = statsByKey.get(key) ?? { persone: 0, prenotazioni: 0, personeCheckin: 0 }
    cur.persone += p.n_persone
    cur.prenotazioni += 1
    if (p.check_in_at) cur.personeCheckin += p.n_persone
    statsByKey.set(key, cur)
  }

  const totPrenotazioni = (prenotazioni ?? []).length
  const totPersone = (prenotazioni ?? []).reduce((acc, p) => acc + p.n_persone, 0)
  const totCheckin = (prenotazioni ?? []).reduce((acc, p) => acc + (p.check_in_at ? p.n_persone : 0), 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-brown md:text-3xl">Per attività</h1>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {edizioneAttiva ? `Edizione ${edizioneAttiva} · ` : ''}
            {totPrenotazioni} prenotazion{totPrenotazioni === 1 ? 'e' : 'i'} · {totPersone} person
            {totPersone === 1 ? 'a' : 'e'} · {totCheckin} check-in
          </p>
        </div>
        {edizioneAttiva && (
          <EdizioneSwitch edizioni={edizioni} attiva={edizioneAttiva} basePath="/admin/attivita" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(eventi ?? []).length === 0 ? (
          <p className="text-slate-400">Nessuna attività.</p>
        ) : (
          (eventi ?? []).map(ev => {
            const evTurni = turniByEvento.get(ev.id) ?? []
            const soloStats = statsByKey.get(`evento:${ev.id}`) ?? {
              persone: 0,
              prenotazioni: 0,
              personeCheckin: 0,
            }

            return (
              <div key={ev.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: ev.colore ?? '#0f9bd8' }}
                      >
                        {ev.categoria}
                      </span>
                      <span className="font-mono text-xs text-slate-400">#{ev.numero}</span>
                    </div>
                    <p className="mt-1 truncate font-semibold text-slate-900">{ev.titolo}</p>
                    {ev.luogo && <p className="truncate text-xs text-slate-500">{ev.luogo}</p>}
                  </div>
                  <Link
                    href={`/admin/prenotazioni?evento=${ev.id}`}
                    className="shrink-0 text-xs font-semibold text-sass-700 hover:underline"
                  >
                    Vedi →
                  </Link>
                </div>

                {ev.a_turni ? (
                  <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {evTurni.length === 0 ? (
                      <li className="text-xs text-slate-400">Nessun turno configurato.</li>
                    ) : (
                      evTurni.map(t => {
                        const s = statsByKey.get(t.id) ?? { persone: 0, prenotazioni: 0, personeCheckin: 0 }
                        const ratio = t.capienza > 0 ? s.persone / t.capienza : 0
                        return (
                          <li key={t.id}>
                            <Link
                              href={`/admin/prenotazioni?turno=${t.id}`}
                              className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1 text-sm transition-colors hover:bg-sass-50 active:bg-sass-100"
                            >
                              <span className="text-slate-600">{formatRangeOrario(t.ora_inizio, t.ora_fine)}</span>
                              <span className="flex items-center gap-2">
                                <span className={`font-mono text-xs font-semibold ${semaforoClass(ratio)}`}>
                                  {s.persone}/{t.capienza}
                                </span>
                                {s.personeCheckin > 0 && (
                                  <span className="text-[10px] text-slate-400">✓{s.personeCheckin}</span>
                                )}
                                <span aria-hidden className="text-slate-300">›</span>
                              </span>
                            </Link>
                          </li>
                        )
                      })
                    )}
                  </ul>
                ) : (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <Link
                      href={`/admin/prenotazioni?evento=${ev.id}`}
                      className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1 text-sm transition-colors hover:bg-sass-50 active:bg-sass-100"
                    >
                      <span className="text-slate-600">{formatRangeOrario(ev.ora_inizio, ev.ora_fine)}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            ev.capienza_max ? semaforoClass(soloStats.persone / ev.capienza_max) : 'text-slate-500'
                          }`}
                        >
                          {soloStats.persone}
                          {ev.capienza_max ? `/${ev.capienza_max}` : ''}
                        </span>
                        {soloStats.personeCheckin > 0 && (
                          <span className="text-[10px] text-slate-400">✓{soloStats.personeCheckin}</span>
                        )}
                        <span aria-hidden className="text-slate-300">›</span>
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
