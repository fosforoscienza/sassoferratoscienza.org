import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookingHeader from '@/components/BookingHeader'
import CancellaPrenotazione from '@/components/CancellaPrenotazione'
import { generaQrDataUrl } from '@/lib/qr'
import { formatRangeOrario, formatDataIT } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ConfermaPage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient()
  const { data: prenotazione } = await supabase
    .from('sass_prenotazioni')
    .select('id, nome, cognome, email, n_persone, check_in_at, evento:sass_eventi(titolo, sottotitolo, categoria, colore, luogo, data, ora_inizio, ora_fine), turno:sass_turni(data, ora_inizio, ora_fine)')
    .eq('token', params.token)
    .single()

  if (!prenotazione) notFound()

  const ev = Array.isArray((prenotazione as any).evento)
    ? (prenotazione as any).evento[0]
    : (prenotazione as any).evento
  const turno = Array.isArray((prenotazione as any).turno)
    ? (prenotazione as any).turno[0]
    : (prenotazione as any).turno

  const dataEff = turno?.data ?? ev?.data
  const oraInizio = turno?.ora_inizio ?? ev?.ora_inizio
  const oraFine = turno?.ora_fine ?? ev?.ora_fine
  const colore = ev?.colore ?? '#0f9bd8'

  const qrDataUrl = await generaQrDataUrl(params.token)

  return (
    <main className="min-h-screen bg-[#ece2d0]">
      <BookingHeader />

      <section className="mx-auto max-w-xl px-5 py-8 md:py-12">
        <article className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
          <div className="bg-gradient-to-br from-sass-700 to-sass-500 px-6 py-8 text-center text-white">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-3 text-2xl font-black">
              {prenotazione.check_in_at ? 'Check-in già fatto' : 'Prenotazione confermata'}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {prenotazione.check_in_at
                ? 'Hai già fatto check-in a questo laboratorio.'
                : 'Mostra il QR code all\'ingresso del laboratorio.'}
            </p>
          </div>

          <div className="px-6 py-8 text-center">
            <div className="relative mx-auto inline-block rounded-2xl border-4 border-[#efe6d6] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR code prenotazione" className="block h-56 w-56" />
            </div>
            <a
              href={qrDataUrl}
              download={`sassoferrato-qr-${prenotazione.id}.png`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sass-700 hover:text-sass-900"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Scarica QR
            </a>
          </div>

          <div className="border-t border-black/[0.06] bg-[#fbf7ef] px-6 py-6">
            {ev?.categoria && (
              <p
                className="mb-2 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: colore }}
              >
                {ev.categoria}
              </p>
            )}
            <h2 className="text-lg font-black text-ink">{ev?.titolo}</h2>
            {ev?.sottotitolo && <p className="text-sm text-ink-soft">{ev.sottotitolo}</p>}
            <div className="mt-3 grid gap-1.5 text-sm text-ink-soft">
              <p>📅 <strong>{dataEff ? formatDataIT(dataEff) : ''}</strong></p>
              <p>🕐 <strong>{oraInizio ? formatRangeOrario(oraInizio, oraFine ?? null) : ''}</strong></p>
              <p>📍 <strong>{ev?.luogo ?? 'Piazza Bartolo'}</strong> · Sassoferrato (AN)</p>
              <p>👤 <strong>{prenotazione.nome} {prenotazione.cognome}</strong> · 👥 {prenotazione.n_persone}{' '}
                {prenotazione.n_persone === 1 ? 'persona' : 'persone'}</p>
            </div>
            <p className="mt-3 text-xs text-ink-faint">Email: {prenotazione.email}</p>
          </div>

          {!prenotazione.check_in_at && (
            <div className="border-t border-black/[0.06] px-6 py-4 text-center">
              <CancellaPrenotazione token={params.token} />
            </div>
          )}
        </article>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Riceverai una copia via email con il QR allegato. Se non arriva entro pochi minuti, controlla
          nello spam.
        </p>
        <div className="mt-2 text-center">
          <Link href="/prenota" className="text-sm font-semibold text-sass-700 hover:underline">
            ← Altri laboratori
          </Link>
        </div>
      </section>
    </main>
  )
}
