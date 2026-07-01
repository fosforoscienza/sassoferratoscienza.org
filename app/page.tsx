import { createServerClient } from '@supabase/ssr'
import LandingInteractions from './LandingInteractions'
import { LANDING_HTML } from './landing-html'

// Rivalida la home (e quindi la griglia orari) ogni 5 minuti.
export const revalidate = 300

const SITE = 'https://sassoferratoscienza.org'

// Dati strutturati (schema.org) per SEO/GEO: evento + FAQ.
const JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: 'Fosforo · la festa della scienza — Sassoferrato',
    startDate: '2026-07-24T17:00:00+02:00',
    endDate: '2026-07-24T22:00:00+02:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description:
      'Una giornata di laboratori scientifici, Science Show e gran finale in musica per tutta la famiglia, tra le piazze di Sassoferrato. Ingresso libero.',
    image: `${SITE}/assets/logo-fosforo.png`,
    url: SITE,
    isAccessibleForFree: true,
    inLanguage: 'it',
    location: {
      '@type': 'Place',
      name: 'Piazza Bartolo e Corso Cavour',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Piazza Gaspare Bartolo, Corso Cavour',
        addressLocality: 'Sassoferrato',
        addressRegion: 'AN',
        postalCode: '60041',
        addressCountry: 'IT',
      },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${SITE}/prenota`,
    },
    organizer: { '@type': 'Organization', name: 'Sassoferrato Scienza', url: SITE },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: "Quanto costa l'ingresso?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "L'ingresso è completamente libero e gratuito, per tutta la durata della manifestazione. Non serve biglietto.",
        },
      },
      {
        '@type': 'Question',
        name: 'Devo prenotare i laboratori?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sì, è possibile prenotare i laboratori su sassoferratoscienza.org. I posti sono limitati: ti consigliamo di prenotare in anticipo. Lo Science Show e il concerto sono a ingresso libero senza prenotazione.',
        },
      },
      {
        '@type': 'Question',
        name: 'A che età sono adatte le attività?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Ci sono attività dai 6 anni in su. Ogni laboratorio indica l'età consigliata (6+ o 8+). Lo spettacolo del Dottor Brown è adatto a partire dai 6 anni ed è pensato per tutta la famiglia.",
        },
      },
      {
        '@type': 'Question',
        name: 'Si può mangiare sul posto?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sì! Saranno presenti stand gastronomici con la tradizionale polenta Ottofile di Mais Rosso di Roccacontrada e altre specialità locali lungo tutto il percorso della festa.',
        },
      },
      {
        '@type': 'Question',
        name: 'Dove si svolge la festa?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "In Piazza Bartolo e lungo Corso Cavour, nel cuore del centro storico di Sassoferrato (AN), uno dei Borghi più belli d'Italia.",
        },
      },
    ],
  },
]

// Client Supabase pubblico (senza cookie) per la lettura dei laboratori/turni:
// le tabelle sass_eventi e sass_turni hanno policy di lettura pubblica.
function publicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

type EventoLite = { id: string; numero: number; titolo: string; colore: string; a_turni: boolean }
type TurnoLite = { time: string; id: string }

function buildOrariGrid(eventi: EventoLite[], turniByEvento: Map<string, TurnoLite[]>): string {
  // Laboratori a turni, in ordine; colonne = unione degli orari di inizio turno
  const labs = eventi.filter(e => (turniByEvento.get(e.id)?.length ?? 0) > 0)
  const allTimes = new Set<string>()
  for (const lab of labs) for (const t of turniByEvento.get(lab.id) ?? []) allTimes.add(t.time)
  const times = Array.from(allTimes).sort()
  if (!labs.length || !times.length) return ''

  const head = times.map(t => `<th>${t}</th>`).join('')
  const rows = labs
    .map(e => {
      const byTime = new Map((turniByEvento.get(e.id) ?? []).map(t => [t.time, t.id]))
      const cells = times
        .map(t => {
          const tid = byTime.get(t)
          return tid
            ? `<td><a class="orari-dot" href="/prenota/${e.id}?turno=${tid}" style="background:${e.colore}" aria-label="${e.titolo} — prenota il turno delle ${t}"></a></td>`
            : `<td><span class="orari-dot orari-dot--empty" aria-hidden="true"></span></td>`
        })
        .join('')
      return `<tr style="--c:${e.colore}"><th scope="row"><a class="orari-lab" href="/prenota/${e.id}">${e.titolo}</a></th>${cells}</tr>`
    })
    .join('')

  return `<div class="orari" data-reveal>
      <div class="orari__title">Gli orari · venerdì 24 luglio<span class="orari__title-note"> • Tutte le attività sono gratuite, alcune a prenotazione obbligatoria. Prenotate il posto solo per bambini.</span></div>
      <div class="orari__scroll">
        <table class="orari-table">
          <thead><tr><th scope="col">Laboratorio</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`
}

export default async function Home() {
  let gridHtml = ''
  // Mappa numero laboratorio → id evento, per far puntare i pulsanti "Prenota"
  // delle card direttamente alla prenotazione del singolo laboratorio.
  const idByNumero = new Map<number, string>()
  try {
    const supabase = publicClient()
    const [{ data: eventi }, { data: turni }] = await Promise.all([
      supabase.from('sass_eventi').select('id, numero, titolo, colore, a_turni').order('numero', { ascending: true }),
      supabase.from('sass_turni').select('id, evento_id, ora_inizio').order('ora_inizio', { ascending: true }),
    ])
    const turniByEvento = new Map<string, TurnoLite[]>()
    for (const t of turni ?? []) {
      const hhmm = String(t.ora_inizio).slice(0, 5)
      const arr = turniByEvento.get(t.evento_id) ?? []
      if (!arr.some(x => x.time === hhmm)) arr.push({ time: hhmm, id: t.id })
      turniByEvento.set(t.evento_id, arr)
    }
    for (const e of (eventi ?? []) as EventoLite[]) idByNumero.set(e.numero, e.id)
    gridHtml = buildOrariGrid((eventi ?? []) as EventoLite[], turniByEvento)
  } catch (err) {
    console.error('[home] griglia orari non generata:', err)
  }

  // Sostituisci i token __LABn__ con l'id reale del laboratorio.
  // Fallback a /prenota (elenco) se l'evento non è stato caricato.
  const html = LANDING_HTML
    .replace('<!--ORARI_GRID-->', gridHtml)
    .replace(/\/prenota\/__LAB(\d+)__/g, (_, n: string) => {
      const id = idByNumero.get(Number(n))
      return id ? `/prenota/${id}` : '/prenota'
    })

  return (
    <div className="landing-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
      />
      <div className="paper" aria-hidden="true" />
      <div className="page" dangerouslySetInnerHTML={{ __html: html }} />
      <LandingInteractions />
    </div>
  )
}
