import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function AdminPrenotazioniPage({
  searchParams,
}: {
  searchParams: { checkin?: string; q?: string }
}) {
  const supabase = createClient()

  const rawQ = searchParams.q?.toLowerCase().replace(/[,:()*.\\%]/g, '').slice(0, 80).trim() ?? ''

  let matchingEventiIds: string[] = []
  if (rawQ) {
    const { data: ev } = await supabase
      .from('sass_eventi')
      .select('id')
      .ilike('titolo', `%${rawQ}%`)
    matchingEventiIds = (ev ?? []).map(e => e.id)
  }

  let query = supabase
    .from('sass_prenotazioni')
    .select(
      'id, nome, cognome, email, telefono, cap, n_persone, check_in_at, created_at, evento:sass_eventi(titolo, categoria, colore), turno:sass_turni(data, ora_inizio, ora_fine)'
    )
    .order('created_at', { ascending: false })
    .limit(500)

  if (searchParams.checkin === '1') {
    query = query.not('check_in_at', 'is', null)
  }
  if (rawQ) {
    const personFilter = `nome.ilike.%${rawQ}%,cognome.ilike.%${rawQ}%,email.ilike.%${rawQ}%`
    if (matchingEventiIds.length > 0) {
      query = query.or(`${personFilter},evento_id.in.(${matchingEventiIds.join(',')})`)
    } else {
      query = query.or(personFilter)
    }
  }

  const { data } = await query
  const prenotazioni = data ?? []
  const totPersone = prenotazioni.reduce((acc: number, p: any) => acc + (p.n_persone ?? 0), 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-brown md:text-3xl">Prenotazioni</h1>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {prenotazioni.length} prenotazion{prenotazioni.length === 1 ? 'e' : 'i'} · {totPersone} person{totPersone === 1 ? 'a' : 'e'}
            {searchParams.checkin === '1' ? ' · solo con check-in' : ''}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form className="flex flex-1 gap-2 sm:flex-none" method="get">
            <input
              type="search"
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Cerca nome, email o laboratorio…"
              className="input-base flex-1 sm:w-64 sm:flex-none"
            />
            {searchParams.checkin === '1' && <input type="hidden" name="checkin" value="1" />}
            <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-sm">Cerca</button>
          </form>
          <a
            href={`/api/admin/prenotazioni/export?${new URLSearchParams({
              ...(searchParams.q ? { q: searchParams.q } : {}),
              ...(searchParams.checkin ? { checkin: searchParams.checkin } : {}),
            }).toString()}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-sass-700 shadow-sm hover:border-sass-400"
            title="Scarica CSV con tutti i campi"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span className="hidden sm:inline">Export</span> CSV
          </a>
        </div>
      </div>

      {/* Mobile */}
      <ul className="-mx-4 mt-6 divide-y divide-slate-100 border-y border-slate-200 bg-white shadow-sm md:hidden">
        {prenotazioni.length === 0 ? (
          <li className="px-4 py-10 text-center text-slate-400">Nessuna prenotazione.</li>
        ) : (
          prenotazioni.map((p: any) => {
            const ev = Array.isArray(p.evento) ? p.evento[0] : p.evento
            const turno = Array.isArray(p.turno) ? p.turno[0] : p.turno
            const turnoLabel = turno
              ? `${String(turno.ora_inizio).slice(0, 5)}–${String(turno.ora_fine).slice(0, 5)}`
              : null
            return (
              <li key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{p.nome} {p.cognome}</p>
                    <p className="truncate text-xs text-slate-500">{p.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      p.check_in_at ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.check_in_at ? '✓ check-in' : 'in attesa'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-800">{ev?.titolo ?? '—'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {ev?.categoria && (
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: ev.colore ?? '#0f9bd8' }}
                    >
                      {ev.categoria}
                    </span>
                  )}
                  {turnoLabel && (
                    <span className="inline-block rounded-full bg-sass-100 px-2 py-0.5 font-mono text-[10px] font-bold text-sass-800">
                      🕐 {turnoLabel}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span>👥 {p.n_persone}</span>
                  {p.telefono && <span>📞 {p.telefono}</span>}
                  {p.cap && <span className="font-mono">CAP {p.cap}</span>}
                  <span className="text-slate-400">
                    {new Date(p.created_at).toLocaleString('it-IT', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
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
              <th className="px-4 py-3">Ospite</th>
              <th className="px-4 py-3">Laboratorio</th>
              <th className="px-4 py-3 text-center">Persone</th>
              <th className="px-4 py-3 text-center">CAP</th>
              <th className="hidden px-4 py-3 lg:table-cell">Telefono</th>
              <th className="px-4 py-3">Prenotato</th>
              <th className="px-4 py-3">Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prenotazioni.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nessuna prenotazione.</td>
              </tr>
            ) : (
              prenotazioni.map((p: any) => {
                const ev = Array.isArray(p.evento) ? p.evento[0] : p.evento
                const turno = Array.isArray(p.turno) ? p.turno[0] : p.turno
                const turnoLabel = turno
                  ? `${String(turno.ora_inizio).slice(0, 5)}–${String(turno.ora_fine).slice(0, 5)}`
                  : null
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.nome} {p.cognome}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{ev?.titolo ?? '—'}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {ev?.categoria && (
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: ev.colore ?? '#0f9bd8' }}
                          >
                            {ev.categoria}
                          </span>
                        )}
                        {turnoLabel && (
                          <span className="inline-block rounded-full bg-sass-100 px-2 py-0.5 font-mono text-[10px] font-bold text-sass-800">
                            🕐 {turnoLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">{p.n_persone}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-700">{p.cap ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{p.telefono ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleString('it-IT')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {p.check_in_at ? (
                        <span className="font-semibold text-green-600">✓</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
