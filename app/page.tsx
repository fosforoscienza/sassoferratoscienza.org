import fs from 'node:fs'
import path from 'node:path'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/server'
import LandingInteractions from './LandingInteractions'
import { LANDING_HTML } from './landing-html'
import { edizioniDisponibili, risolviEdizione } from '@/lib/types'
import { lookupCap } from '@/lib/cap-geo'
import { ITALY_VIEWBOX_W, ITALY_VIEWBOX_H, ITALY_PATH_D, clusterizzaProvenienza, type ProvenienzaCluster } from '@/lib/italy-map'

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
        name: 'Bisognava prenotare i laboratori?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "L'evento si è svolto il 24 luglio 2026 e si è ormai concluso: le prenotazioni non sono più disponibili. Durante la manifestazione i laboratori erano gratuiti e a posti limitati, prenotabili in anticipo; lo Science Show e il concerto erano invece a ingresso libero senza prenotazione.",
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

type EventoLite = { id: string; numero: number; titolo: string; colore: string; a_turni: boolean; edizione: number }
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
            ? `<td><span class="orari-dot" style="background:${e.colore}" aria-label="${e.titolo} — ${t}"></span></td>`
            : `<td><span class="orari-dot orari-dot--empty" aria-hidden="true"></span></td>`
        })
        .join('')
      return `<tr style="--c:${e.colore}"><th scope="row"><span class="orari-lab">${e.titolo}</span></th>${cells}</tr>`
    })
    .join('')

  return `<div class="orari" data-reveal>
      <div class="orari__title">Gli orari · venerdì 24 luglio<span class="orari__title-note"> • Tutte le attività sono state gratuite.</span></div>
      <div class="orari__scroll">
        <table class="orari-table">
          <thead><tr><th scope="col">Laboratorio</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`
}

const GALLERY_DIR = path.join(process.cwd(), 'public', 'galleria')
const GALLERY_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export type ProvenienzaRiga = { nome: string; persone: number }
export type ProvenienzaReport = {
  top: ProvenienzaRiga[]
  altreCitta: number
  altrePersone: number
  cluster: ProvenienzaCluster[]
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Report grafico + galleria foto dell'edizione conclusa: numeri, provenienza
// dei partecipanti (da CAP) e foto.
function buildEdizioneHtml(
  attivitaSvolte: number,
  personeIscritte: number | null,
  provenienza: ProvenienzaReport | null
): string {
  let files: string[] = []
  try {
    files = fs
      .readdirSync(GALLERY_DIR)
      .filter(f => GALLERY_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'it'))
  } catch {
    files = []
  }

  const items = files
    .map((f, i) => {
      const src = `/galleria/${encodeURIComponent(f)}`
      return `<a class="gallery__item" href="${src}" data-lightbox-trigger data-reveal data-reveal-delay="${(i % 6) * 60}">
            <img src="${src}" alt="Foto della festa della scienza a Sassoferrato" loading="lazy">
          </a>`
    })
    .join('')

  const provenienzaHtml = provenienza ? buildProvenienzaHtml(provenienza) : ''

  return `<section id="edizione" class="section edizione">
      <div class="container">
        <div class="section-head" data-reveal>
          <div class="eyebrow">L'edizione conclusa</div>
          <h2>Edizione 2026</h2>
          <p>Un venerdì di laboratori, spettacolo e musica in piazza: i numeri e gli scatti di questa edizione.</p>
        </div>

        <div class="edizione-stats" data-reveal>
          <div class="edizione-stat">
            <span class="edizione-stat__value">${attivitaSvolte}</span>
            <span class="edizione-stat__label">Attività svolte</span>
          </div>
          ${personeIscritte !== null
            ? `<div class="edizione-stat">
            <span class="edizione-stat__value">${personeIscritte}</span>
            <span class="edizione-stat__label">Persone iscritte</span>
          </div>`
            : ''}
        </div>

        ${provenienzaHtml}

        ${items ? `<div class="gallery__grid">${items}</div>` : ''}
      </div>
    </section>`
}

function buildProvenienzaHtml(p: ProvenienzaReport): string {
  const righeLista = p.top
    .map(
      r => `<li><span class="provenienza-list__citta">${escapeHtml(r.nome)}</span><span class="provenienza-list__persone">${r.persone}</span></li>`
    )
    .join('')
  const altraRiga =
    p.altreCitta > 0
      ? `<li class="provenienza-list__altre"><span class="provenienza-list__citta">Altre città (${p.altreCitta})</span><span class="provenienza-list__persone">${p.altrePersone}</span></li>`
      : ''

  const maxPersone = Math.max(1, ...p.cluster.map(c => c.persone))
  const minR = 6
  const maxR = 24
  const dotsHtml = p.cluster
    .map(c => {
      const r = minR + (maxR - minR) * Math.sqrt(c.persone / maxPersone)
      const leftPct = (c.x / ITALY_VIEWBOX_W) * 100
      const topPct = (c.y / ITALY_VIEWBOX_H) * 100
      const label =
        c.citta.length === 1
          ? `${escapeHtml(c.citta[0].nome)} — ${c.citta[0].persone} persone`
          : `${c.citta.map(ct => `${escapeHtml(ct.nome)} (${ct.persone})`).join(', ')} — ${c.persone} persone`
      return `<button type="button" class="provenienza-dot" style="left:${leftPct.toFixed(2)}%;top:${topPct.toFixed(2)}%;width:${(r * 2).toFixed(1)}px;height:${(r * 2).toFixed(1)}px" aria-label="${label}">
          <span class="provenienza-dot__tooltip">${label}</span>
        </button>`
    })
    .join('')

  return `<div class="provenienza" data-reveal>
      <div class="provenienza__head">
        <div class="eyebrow">Da dove arrivano i partecipanti</div>
        <p>In base al CAP indicato in fase di prenotazione.</p>
      </div>
      <div class="provenienza__grid">
        <ol class="provenienza-list">${righeLista}${altraRiga}</ol>
        <div class="provenienza-map">
          <svg class="provenienza-map__outline" viewBox="0 0 ${ITALY_VIEWBOX_W} ${ITALY_VIEWBOX_H}" aria-hidden="true">
            <path d="${ITALY_PATH_D}" />
          </svg>
          ${dotsHtml}
        </div>
      </div>
    </div>`
}

export default async function Home() {
  let gridHtml = ''
  let edizioneHtml = ''
  // Mappa numero laboratorio → id evento, per far puntare i pulsanti "Prenota"
  // delle card direttamente alla prenotazione del singolo laboratorio.
  const idByNumero = new Map<number, string>()
  let eventi: EventoLite[] = []
  const turniByEvento = new Map<string, TurnoLite[]>()
  try {
    const supabase = publicClient()
    const [{ data: eventiTutti }, { data: turni }] = await Promise.all([
      supabase.from('sass_eventi').select('id, numero, titolo, colore, a_turni, edizione').order('numero', { ascending: true }),
      supabase.from('sass_turni').select('id, evento_id, ora_inizio').order('ora_inizio', { ascending: true }),
    ])
    // Solo l'edizione più recente: le edizioni passate restano nel database
    // per lo storico ma non devono comparire sulla home pubblica.
    const edizioneCorrente = risolviEdizione(edizioniDisponibili((eventiTutti ?? []) as EventoLite[]))
    eventi = ((eventiTutti ?? []) as EventoLite[]).filter(e => e.edizione === edizioneCorrente)
    for (const t of turni ?? []) {
      const hhmm = String(t.ora_inizio).slice(0, 5)
      const arr = turniByEvento.get(t.evento_id) ?? []
      if (!arr.some(x => x.time === hhmm)) arr.push({ time: hhmm, id: t.id })
      turniByEvento.set(t.evento_id, arr)
    }
    for (const e of eventi) idByNumero.set(e.numero, e.id)
    gridHtml = buildOrariGrid(eventi, turniByEvento)
  } catch (err) {
    console.error('[home] griglia orari non generata:', err)
  }

  if (eventi.length) {
    try {
      // Persone iscritte e provenienza (CAP): conteggi aggregati, non dati
      // personali (niente nome/cognome/email). sass_prenotazioni è leggibile
      // solo dagli admin, quindi serve la service role — come già per la
      // disponibilità in /prenota.
      let personeIscritte: number | null = null
      let provenienza: ProvenienzaReport | null = null
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminClient()
        const eventoIds = eventi.map(e => e.id)
        const { data: pren } = await admin.from('sass_prenotazioni').select('n_persone, cap').in('evento_id', eventoIds)
        const righe = pren ?? []
        personeIscritte = righe.reduce((acc, p) => acc + (p.n_persone ?? 0), 0)

        const personePerCitta = new Map<string, { persone: number; lat: number; lon: number }>()
        for (const r of righe) {
          if (!r.cap) continue
          const geo = lookupCap(r.cap)
          if (!geo) continue
          const cur = personePerCitta.get(geo.c) ?? { persone: 0, lat: geo.lat, lon: geo.lng }
          cur.persone += r.n_persone ?? 0
          personePerCitta.set(geo.c, cur)
        }
        const cittaOrdinate = Array.from(personePerCitta.entries())
          .map(([nome, v]) => ({ nome, ...v }))
          .sort((a, b) => b.persone - a.persone)

        if (cittaOrdinate.length) {
          const top = cittaOrdinate.slice(0, 10).map(c => ({ nome: c.nome, persone: c.persone }))
          const resto = cittaOrdinate.slice(10)
          provenienza = {
            top,
            altreCitta: resto.length,
            altrePersone: resto.reduce((acc, c) => acc + c.persone, 0),
            cluster: clusterizzaProvenienza(
              cittaOrdinate.map(c => ({ citta: c.nome, lat: c.lat, lon: c.lon, persone: c.persone }))
            ),
          }
        }
      }

      const attivitaSvolte =
        eventi.reduce((acc, e) => acc + (e.a_turni ? turniByEvento.get(e.id)?.length ?? 0 : 1), 0) + 2 // + Science Show e concerto

      edizioneHtml = buildEdizioneHtml(attivitaSvolte, personeIscritte, provenienza)
    } catch (err) {
      console.error('[home] report edizione non generato:', err)
    }
  }

  // Sostituisci i token __LABn__ con l'id reale del laboratorio.
  // Fallback a /prenota (elenco) se l'evento non è stato caricato.
  const html = LANDING_HTML
    .replace('<!--ORARI_GRID-->', gridHtml)
    .replace('<!--EDIZIONE-->', edizioneHtml)
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
