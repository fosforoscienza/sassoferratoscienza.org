import { createClient } from '@/lib/supabase/server'
import { edizioniDisponibili, risolviEdizione } from '@/lib/types'
import EdizioneSwitch from '@/components/EdizioneSwitch'
import { lookupCap } from '@/lib/cap-geo'
import { MARCHE_VIEWBOX_W, MARCHE_VIEWBOX_H, MARCHE_PATH_D, projectLonLatMarche, isInMarcheView } from '@/lib/marche-map'
import { clusterizzaPunti, type ClusterProvenienza } from '@/lib/geo-cluster'

export const revalidate = 0

type StatoLab = {
  prenotazioni: number
  persone: number
  scansioni: number
  personeScansionate: number
}

function statoVuoto(): StatoLab {
  return { prenotazioni: 0, persone: 0, scansioni: 0, personeScansionate: 0 }
}

function pctClass(pct: number) {
  if (pct >= 75) return 'text-emerald-600'
  if (pct >= 40) return 'text-amber-600'
  return 'text-slate-500'
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-brown">{value}</p>
    </div>
  )
}

export default async function AdminReportPage({
  searchParams,
}: {
  searchParams: { edizione?: string }
}) {
  const supabase = createClient()

  const [{ data: eventiTutti }, { data: prenotazioniTutte }] = await Promise.all([
    supabase
      .from('sass_eventi')
      .select('id, numero, categoria, colore, titolo, edizione')
      .order('numero'),
    supabase.from('sass_prenotazioni').select('evento_id, n_persone, check_in_at, cap'),
  ])

  const edizioni = edizioniDisponibili(eventiTutti ?? [])
  const edizioneAttiva = risolviEdizione(edizioni, searchParams.edizione)
  const eventi = (eventiTutti ?? []).filter(e => e.edizione === edizioneAttiva)
  const eventoIds = new Set(eventi.map(e => e.id))
  const prenotazioni = (prenotazioniTutte ?? []).filter(p => eventoIds.has(p.evento_id))

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

  const righe = (eventi ?? []).map(e => ({
    ...e,
    stat: statsByEvento.get(e.id) ?? statoVuoto(),
  }))

  const totali = righe.reduce((acc, r) => {
    acc.prenotazioni += r.stat.prenotazioni
    acc.persone += r.stat.persone
    acc.scansioni += r.stat.scansioni
    acc.personeScansionate += r.stat.personeScansionate
    return acc
  }, statoVuoto())

  const pctTotale = totali.persone > 0 ? Math.round((totali.personeScansionate / totali.persone) * 100) : 0

  // Provenienza (da CAP): persone iscritte per città, prime 10 + resto aggregato,
  // e una mappa delle Marche (dove arriva la stragrande maggioranza) coi comuni
  // vicini raggruppati in un unico pallino quando sono troppo ravvicinati.
  const personePerCitta = new Map<string, { nome: string; sigla: string; persone: number; lat: number; lon: number }>()
  for (const p of prenotazioni) {
    if (!p.cap) continue
    const geo = lookupCap(p.cap)
    if (!geo) continue
    const key = `${geo.c}|${geo.s}`
    const cur = personePerCitta.get(key) ?? { nome: geo.c, sigla: geo.s, persone: 0, lat: geo.lat, lon: geo.lng }
    cur.persone += p.n_persone ?? 0
    personePerCitta.set(key, cur)
  }
  const cittaOrdinate = Array.from(personePerCitta.values()).sort((a, b) => b.persone - a.persone)
  const cittaTop = cittaOrdinate.slice(0, 10)
  const cittaResto = cittaOrdinate.slice(10)
  const puntiMarche = cittaOrdinate
    .filter(c => isInMarcheView(c.lon, c.lat))
    .map(c => {
      const [x, y] = projectLonLatMarche(c.lon, c.lat)
      return { nome: c.nome, x, y, persone: c.persone }
    })
  const clusterMarche: ClusterProvenienza[] = clusterizzaPunti(puntiMarche, 16)
  const maxPersoneCluster = Math.max(1, ...clusterMarche.map(c => c.persone))
  const cittaFuoriRegione = cittaOrdinate.filter(c => !isInMarcheView(c.lon, c.lat))
  const fuoriRegioneLabel = cittaFuoriRegione.length
    ? `${cittaFuoriRegione.map(c => `${c.nome} (${c.persone})`).join(', ')} — ${cittaFuoriRegione.reduce((acc, c) => acc + c.persone, 0)} persone`
    : ''

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-brown md:text-3xl">Report evento</h1>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {edizioneAttiva ? `Edizione ${edizioneAttiva} · ` : ''}
            Prenotazioni effettuate e check-in scansionati durante la giornata, per laboratorio.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {edizioneAttiva && <EdizioneSwitch edizioni={edizioni} attiva={edizioneAttiva} basePath="/admin/report" />}
          <a
            href={`/api/admin/report/export${edizioneAttiva ? `?edizione=${edizioneAttiva}` : ''}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-sass-700 shadow-sm hover:border-sass-400"
            title="Scarica CSV con i totali per laboratorio"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span className="hidden sm:inline">Export</span> CSV
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Prenotazioni" value={totali.prenotazioni} />
        <StatCard label="Persone prenotate" value={totali.persone} />
        <StatCard label="Persone scansionate" value={totali.personeScansionate} />
        <StatCard label="% presenze" value={`${pctTotale}%`} />
      </div>

      {cittaOrdinate.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-xl font-bold text-brown">Da dove arrivano i partecipanti</h2>
          <p className="mt-1 text-xs text-slate-500">
            In base al CAP indicato in prenotazione. Mappa delle Marche, dove arriva la maggior parte dei partecipanti.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,320px)_1fr] md:p-6">
            <ol className="divide-y divide-slate-100 md:border-r md:border-slate-100 md:pr-6">
              {cittaTop.map((c, i) => (
                <li key={`${c.nome}-${c.sigla}`} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">
                    <span className="mr-1.5 font-mono text-xs font-bold text-slate-400">{i + 1}.</span>
                    {c.nome} <span className="font-mono text-xs font-bold text-slate-400">({c.sigla})</span>
                  </span>
                  <span className="shrink-0 font-mono font-bold text-sass-700">{c.persone}</span>
                </li>
              ))}
              {cittaResto.length > 0 && (
                <li className="flex items-baseline justify-between gap-3 py-2.5 text-sm text-slate-500">
                  <span className="font-semibold">
                    <span className="mr-1.5">•</span>Altre città ({cittaResto.length})
                  </span>
                  <span className="shrink-0 font-mono font-bold">
                    {cittaResto.reduce((acc, c) => acc + c.persone, 0)}
                  </span>
                </li>
              )}
            </ol>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative w-full" style={{ aspectRatio: `${MARCHE_VIEWBOX_W} / ${MARCHE_VIEWBOX_H}` }}>
                <svg
                  viewBox={`0 0 ${MARCHE_VIEWBOX_W} ${MARCHE_VIEWBOX_H}`}
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                >
                  <path d={MARCHE_PATH_D} fill="#ecf8fd" stroke="#7ec8ec" strokeWidth={1} />
                </svg>
                {clusterMarche.map((c, i) => {
                  const r = 6 + (24 - 6) * Math.sqrt(c.persone / maxPersoneCluster)
                  const label =
                    c.citta.length === 1
                      ? `${c.citta[0].nome} — ${c.citta[0].persone} persone`
                      : `${c.citta.map(ct => `${ct.nome} (${ct.persone})`).join(', ')} — ${c.persone} persone`
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={label}
                      className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white bg-sass-600 shadow-md transition-transform hover:z-10 hover:scale-110"
                      style={{
                        left: `${(c.x / MARCHE_VIEWBOX_W) * 100}%`,
                        top: `${(c.y / MARCHE_VIEWBOX_H) * 100}%`,
                        width: r * 2,
                        height: r * 2,
                      }}
                    >
                      <span className="pointer-events-none absolute bottom-[calc(100%+9px)] left-1/2 z-20 w-max max-w-[200px] -translate-x-1/2 translate-y-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-center font-mono text-[11px] font-bold leading-tight text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {cittaFuoriRegione.length > 0 && (
                <div className="absolute -top-2 right-0.5 flex flex-col items-center gap-0.5">
                  <svg className="h-[30px] w-[34px] text-slate-400" viewBox="0 0 50 44" fill="none" aria-hidden="true">
                    <path d="M6,4 C 34,4 34,26 25,38" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M25,38 L18,31 M25,38 L28,29" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <button
                    type="button"
                    aria-label={`Fuori regione: ${fuoriRegioneLabel}`}
                    className="group relative h-[15px] w-[15px] cursor-pointer rounded-full border-2 border-white bg-slate-400 shadow-md transition-transform hover:z-10 hover:scale-110"
                  >
                    <span className="pointer-events-none absolute bottom-[calc(100%+9px)] right-0 z-20 w-max max-w-[220px] translate-y-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-center font-mono text-[11px] font-bold leading-tight text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                      Fuori regione: {fuoriRegioneLabel}
                    </span>
                  </button>
                  <span className="whitespace-nowrap font-mono text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Fuori regione
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile */}
      <ul className="-mx-4 mt-6 divide-y divide-slate-100 border-y border-slate-200 bg-white shadow-sm md:hidden">
        {righe.length === 0 ? (
          <li className="px-4 py-10 text-center text-slate-400">Nessun laboratorio.</li>
        ) : (
          righe.map(r => {
            const pct = r.stat.persone > 0 ? Math.round((r.stat.personeScansionate / r.stat.persone) * 100) : 0
            return (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: r.colore ?? '#0f9bd8' }}
                  >
                    {r.categoria}
                  </span>
                  <span className="font-mono text-xs text-slate-400">#{r.numero}</span>
                </div>
                <p className="mt-1 font-semibold text-slate-900">{r.titolo}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>{r.stat.prenotazioni} prenotazion{r.stat.prenotazioni === 1 ? 'e' : 'i'} · {r.stat.persone} person{r.stat.persone === 1 ? 'a' : 'e'}</span>
                  <span className={`font-semibold ${pctClass(pct)}`}>
                    ✓ {r.stat.personeScansionate} scansionat{r.stat.personeScansionate === 1 ? 'a' : 'e'} ({pct}%)
                  </span>
                </div>
              </li>
            )
          })
        )}
      </ul>

      {/* Desktop */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Laboratorio</th>
              <th className="px-4 py-3 text-center">Prenotazioni</th>
              <th className="px-4 py-3 text-center">Persone prenotate</th>
              <th className="px-4 py-3 text-center">Scansionate</th>
              <th className="px-4 py-3 text-center">Persone scansionate</th>
              <th className="px-4 py-3 text-center">% presenze</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {righe.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Nessun laboratorio.</td>
              </tr>
            ) : (
              righe.map(r => {
                const pct = r.stat.persone > 0 ? Math.round((r.stat.personeScansionate / r.stat.persone) * 100) : 0
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: r.colore ?? '#0f9bd8' }}
                        >
                          {r.categoria}
                        </span>
                        <span className="font-mono text-xs text-slate-400">#{r.numero}</span>
                      </div>
                      <p className="mt-1 font-medium text-slate-900">{r.titolo}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">{r.stat.prenotazioni}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{r.stat.persone}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{r.stat.scansioni}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">{r.stat.personeScansionate}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${pctClass(pct)}`}>{pct}%</td>
                  </tr>
                )
              })
            )}
          </tbody>
          {righe.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <td className="px-4 py-3">Totale</td>
                <td className="px-4 py-3 text-center">{totali.prenotazioni}</td>
                <td className="px-4 py-3 text-center">{totali.persone}</td>
                <td className="px-4 py-3 text-center">{totali.scansioni}</td>
                <td className="px-4 py-3 text-center">{totali.personeScansionate}</td>
                <td className={`px-4 py-3 text-center ${pctClass(pctTotale)}`}>{pctTotale}%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </main>
  )
}
