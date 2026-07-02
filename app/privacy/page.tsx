import type { Metadata } from 'next'
import BookingHeader from '@/components/BookingHeader'

export const metadata: Metadata = {
  title: 'Informativa privacy — Sassoferrato Scienza',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#ece2d0]">
      <BookingHeader />
      <section className="mx-auto max-w-2xl px-5 py-10 md:py-14">
        <h1 className="font-display text-4xl font-black text-brown">Informativa privacy</h1>
        <p className="mt-2 text-sm text-ink-faint">
          Trattamento dei dati per le prenotazioni dei laboratori di Sassoferrato Scienza.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <div>
            <h2 className="text-base font-bold text-ink">Titolare del trattamento</h2>
            <p className="mt-1">
              I dati raccolti tramite il modulo di prenotazione sono trattati dagli organizzatori di
              Sassoferrato Scienza. Per qualsiasi richiesta puoi scrivere a{' '}
              <a href="mailto:info@fosforoscienza.it" className="font-semibold text-sass-700 underline">
                info@fosforoscienza.it
              </a>.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Dati raccolti e finalità</h2>
            <p className="mt-1">
              Raccogliamo nome, cognome, email, e (facoltativamente) telefono, CAP e note, al solo
              scopo di gestire la prenotazione ai laboratori, inviarti la conferma con il QR code di
              accesso e gestire il check-in all&apos;inizio.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Conservazione</h2>
            <p className="mt-1">
              I dati sono conservati per il tempo necessario alla gestione dell&apos;evento e cancellati
              al termine della manifestazione, salvo diversi obblighi di legge.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">I tuoi diritti</h2>
            <p className="mt-1">
              Puoi cancellare in autonomia la tua prenotazione (e quindi i relativi dati) tramite il
              link presente nell&apos;email di conferma, oppure richiedere accesso, rettifica o
              cancellazione scrivendo all&apos;indirizzo sopra indicato.
            </p>
          </div>
          <p className="text-xs text-ink-faint">
            Questo testo è una bozza informativa da adeguare/validare con il titolare del trattamento
            prima della pubblicazione.
          </p>
        </div>
      </section>
    </main>
  )
}
