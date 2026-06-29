import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookingHeader from '@/components/BookingHeader'
import PrenotaForm from '@/components/PrenotaForm'
import type { Evento, TurnoConDisponibilita } from '@/lib/types'
import { formatRangeOrario, formatDataIT } from '@/lib/types'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('sass_eventi')
    .select('titolo, sottotitolo, descrizione')
    .eq('id', params.id)
    .single()
  if (!data) return { title: 'Laboratorio non trovato' }
  return {
    title: `${data.titolo} — Prenota a Sassoferrato Scienza 2026`,
    description: data.descrizione?.slice(0, 160) ?? data.sottotitolo ?? undefined,
    alternates: { canonical: `/prenota/${params.id}` },
  }
}

export default async function PrenotaEventoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('sass_eventi')
    .select('id, numero, categoria, colore, data, ora_inizio, ora_fine, titolo, sottotitolo, descrizione, eta, luogo, capienza_max, prenotazioni_attive, posti_esauriti, a_turni, durata_turno_min, capienza_turno')
    .eq('id', params.id)
    .single()

  if (!data) notFound()
  const evento = data as Evento

  // Turni (via service role: la vista fa join con sass_prenotazioni la cui RLS
  // chiama is_admin_sass(), non eseguibile da anon)
  let turni: TurnoConDisponibilita[] = []
  if (evento.a_turni && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      const { data: turniData } = await admin
        .from('sass_turni_disponibilita')
        .select('id, evento_id, data, ora_inizio, ora_fine, capienza, ordine, posti_prenotati, posti_residui')
        .eq('evento_id', evento.id)
        .order('data', { ascending: true })
        .order('ora_inizio', { ascending: true })
      turni = (turniData ?? []) as TurnoConDisponibilita[]
    } catch (err) {
      console.error('[prenota/id] turni non caricati:', err)
    }
  }

  const colore = evento.colore

  return (
    <main className="min-h-screen bg-[#ece2d0]">
      <BookingHeader />

      <section className="mx-auto max-w-2xl px-5 py-8 md:py-12">
        <Link
          href="/prenota"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sass-700 hover:text-sass-900"
        >
          <span aria-hidden>←</span> Tutti i laboratori
        </Link>

        <article className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
          <div className="h-2 w-full" style={{ backgroundColor: colore }} aria-hidden />
          <div className="p-6 md:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: colore }}
              >
                {String(evento.numero).padStart(2, '0')} · {evento.categoria}
              </span>
              {evento.eta && (
                <span className="rounded-full bg-black/5 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  Età {evento.eta}
                </span>
              )}
              {evento.a_turni && (
                <span className="rounded-full bg-sass-100 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-sass-700">
                  A turni
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-ink md:text-4xl">
              {evento.titolo}
            </h1>
            {evento.sottotitolo && (
              <p className="mt-1 text-base font-bold" style={{ color: colore }}>
                {evento.sottotitolo}
              </p>
            )}
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                <span className="text-xl" aria-hidden>📅</span>
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Data</dt>
                  <dd className="text-sm font-semibold text-ink">{formatDataIT(evento.data)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                <span className="text-xl" aria-hidden>🕐</span>
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Orario</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {formatRangeOrario(evento.ora_inizio, evento.ora_fine)}
                  </dd>
                </div>
              </div>
              {evento.luogo && (
                <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3 sm:col-span-2">
                  <span className="text-xl" aria-hidden>📍</span>
                  <div>
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">Luogo</dt>
                    <dd className="text-sm font-semibold text-ink">{evento.luogo} · Sassoferrato (AN)</dd>
                  </div>
                </div>
              )}
            </dl>
            {evento.descrizione && (
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">{evento.descrizione}</p>
            )}
          </div>
        </article>

        {!evento.prenotazioni_attive ? (
          <article className="mt-6 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              A fruizione libera
            </p>
            <h2 className="mt-1 text-xl font-black text-emerald-950 md:text-2xl">
              Nessuna prenotazione richiesta
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
              Vieni quando vuoi: questo laboratorio è ad accesso libero.
              Ti aspettiamo <strong>{formatDataIT(evento.data)}</strong> dalle{' '}
              <strong>{formatRangeOrario(evento.ora_inizio, evento.ora_fine)}</strong>.
            </p>
            <Link href="/prenota" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
              Vedi gli altri laboratori <span aria-hidden>→</span>
            </Link>
          </article>
        ) : evento.posti_esauriti ? (
          <article className="mt-6 overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
              Posti esauriti
            </p>
            <h2 className="mt-1 text-xl font-black text-red-950 md:text-2xl">Laboratorio al completo</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
              Le prenotazioni per questo laboratorio sono esaurite. Ti aspettiamo agli altri laboratori
              del programma!
            </p>
            <Link href="/prenota" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900">
              Vedi gli altri laboratori <span aria-hidden>→</span>
            </Link>
          </article>
        ) : (
          <article className="mt-6 rounded-3xl border border-black/[0.07] bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-black text-sass-900">I tuoi dati</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Riceverai un&apos;email all&apos;indirizzo che inserisci qui sotto, con il QR code da mostrare
              all&apos;ingresso.
            </p>
            <div className="mt-5">
              <PrenotaForm eventoId={evento.id} turni={evento.a_turni ? turni : undefined} />
            </div>
          </article>
        )}
      </section>
    </main>
  )
}
