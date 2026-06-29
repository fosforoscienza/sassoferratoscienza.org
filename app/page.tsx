import { createServerClient } from '@supabase/ssr'
import LandingInteractions from './LandingInteractions'
import { LANDING_HTML } from './landing-html'

// Rivalida la home (e quindi la griglia orari) ogni 5 minuti.
export const revalidate = 300

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
      <div class="orari__title">Gli orari · venerdì 24 luglio</div>
      <div class="orari__scroll">
        <table class="orari-table">
          <thead><tr><th scope="col">Laboratorio</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="orari__note">Clicca il <strong>nome</strong> per vedere tutti i turni, o un <strong>pallino</strong> per prenotare direttamente quel turno. Negli altri orari l'accesso ai laboratori è libero.</p>
    </div>`
}

export default async function Home() {
  let gridHtml = ''
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
    gridHtml = buildOrariGrid((eventi ?? []) as EventoLite[], turniByEvento)
  } catch (err) {
    console.error('[home] griglia orari non generata:', err)
  }

  const html = LANDING_HTML.replace('<!--ORARI_GRID-->', gridHtml)

  return (
    <div className="landing-root">
      <div className="paper" aria-hidden="true" />
      <div className="page" dangerouslySetInnerHTML={{ __html: html }} />
      <LandingInteractions />
    </div>
  )
}
