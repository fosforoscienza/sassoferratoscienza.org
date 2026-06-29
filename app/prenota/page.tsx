import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import BookingHeader from '@/components/BookingHeader'
import { formatRangeOrario } from '@/lib/types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Prenota un laboratorio — Sassoferrato Scienza 2026',
  description:
    'Prenota gratuitamente uno dei laboratori di Sassoferrato Scienza, venerdì 24 luglio 2026. Posti limitati.',
  alternates: { canonical: '/prenota' },
}

type EventoRow = {
  id: string
  numero: number
  categoria: string
  colore: string
  titolo: string
  sottotitolo: string | null
  eta: string | null
  ora_inizio: string
  ora_fine: string | null
  a_turni: boolean
  capienza_max: number | null
  prenotazioni_attive: boolean
  posti_esauriti: boolean
}

export default async function PrenotaIndexPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('sass_eventi')
    .select('id, numero, categoria, colore, titolo, sottotitolo, eta, ora_inizio, ora_fine, a_turni, capienza_max, prenotazioni_attive, posti_esauriti')
    .order('numero', { ascending: true })

  const eventi = (data ?? []) as EventoRow[]

  // Disponibilità aggregata (vista, via service role per evitare blocchi RLS sui join).
  // Se la service role key non è configurata, i conteggi sono omessi senza errori.
  const residuiTurniPerEvento = new Map<string, number>()
  const residuiEvento = new Map<string, number | null>()
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      const [{ data: turniDisp }, { data: evDisp }] = await Promise.all([
        admin.from('sass_turni_disponibilita').select('evento_id, posti_residui'),
        admin.from('sass_eventi_disponibilita').select('id, posti_residui'),
      ])
      for (const t of turniDisp ?? []) {
        residuiTurniPerEvento.set(t.evento_id, (residuiTurniPerEvento.get(t.evento_id) ?? 0) + (t.posti_residui ?? 0))
      }
      for (const e of evDisp ?? []) residuiEvento.set(e.id, e.posti_residui)
    } catch (err) {
      console.error('[prenota] disponibilità non calcolata:', err)
    }
  }

  return (
    <main className="min-h-screen bg-[#ece2d0]">
      <BookingHeader />

      <section className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-sass-700">
          Prenotazioni · 24 luglio 2026
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink md:text-4xl">
          Prenota un laboratorio
        </h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          I laboratori sono gratuiti ma a posti limitati. Scegli un laboratorio, indica i tuoi dati e
          riceverai un&apos;email con il QR code di accesso.
        </p>

        <div className="mt-8 grid gap-4">
          {eventi.length === 0 && (
            <p className="rounded-2xl border border-black/10 bg-white px-5 py-8 text-center text-ink-soft">
              Le prenotazioni apriranno a breve.
            </p>
          )}

          {eventi.map(ev => {
            const residui = ev.a_turni
              ? residuiTurniPerEvento.get(ev.id) ?? null
              : residuiEvento.has(ev.id)
                ? residuiEvento.get(ev.id)!
                : ev.capienza_max
            const esaurito =
              ev.posti_esauriti || (typeof residui === 'number' && residui <= 0)
            const chiuso = !ev.prenotazioni_attive

            return (
              <Link
                key={ev.id}
                href={`/prenota/${ev.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-black/[0.07] bg-[#fbf7ef] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderTopColor: ev.colore, borderTopWidth: 3 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className="font-mono text-[11px] font-bold uppercase tracking-[0.13em]"
                      style={{ color: ev.colore }}
                    >
                      {String(ev.numero).padStart(2, '0')} · {ev.categoria}
                    </span>
                    <h2 className="mt-1 text-xl font-extrabold leading-tight text-ink">{ev.titolo}</h2>
                    {ev.sottotitolo && (
                      <p className="mt-0.5 text-sm font-semibold" style={{ color: ev.colore }}>
                        {ev.sottotitolo}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/10 px-2.5 py-1 font-mono text-[11px] font-bold text-ink-soft">
                        {formatRangeOrario(ev.ora_inizio, ev.ora_fine)}
                      </span>
                      {ev.eta && (
                        <span className="rounded-full bg-black/5 px-2.5 py-1 font-mono text-[11px] font-bold text-ink-soft">
                          ETÀ {ev.eta}
                        </span>
                      )}
                      {ev.a_turni && (
                        <span className="rounded-full bg-sass-100 px-2.5 py-1 font-mono text-[11px] font-bold text-sass-700">
                          A TURNI
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {chiuso ? (
                      <span className="font-mono text-[11px] font-bold uppercase text-emerald-700">
                        Libero
                      </span>
                    ) : esaurito ? (
                      <span className="font-mono text-[11px] font-bold uppercase text-red-600">
                        Esaurito
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-sass-700">
                        Prenota
                        <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                      </span>
                    )}
                    {!chiuso && typeof residui === 'number' && residui > 0 && (
                      <p className="mt-1 text-[11px] text-ink-faint">{residui} posti</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ink-faint">
          Hai già prenotato? Trovi il QR nell&apos;email di conferma. Per modifiche puoi cancellare e
          riprenotare.
        </p>
      </section>
    </main>
  )
}
