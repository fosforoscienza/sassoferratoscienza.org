// ============================================================
// Tipi del dominio Sassoferrato Scienza
// (tabelle Supabase prefissate sass_, vedi supabase/schema_sassoferrato.sql)
// ============================================================

/** Un laboratorio del programma (tabella sass_eventi). */
export type Evento = {
  id: string
  numero: number
  categoria: string
  colore: string
  data: string // YYYY-MM-DD
  ora_inizio: string // HH:MM:SS
  ora_fine: string | null
  titolo: string
  sottotitolo: string | null
  descrizione: string | null
  eta: string | null
  luogo: string | null
  capienza_max: number | null
  prenotazioni_attive: boolean
  posti_esauriti: boolean
  a_turni: boolean
  durata_turno_min: number | null
  capienza_turno: number | null
}

export type Turno = {
  id: string
  evento_id: string
  data: string // YYYY-MM-DD
  ora_inizio: string // HH:MM:SS
  ora_fine: string // HH:MM:SS
  capienza: number
  ordine: number
}

export type TurnoConDisponibilita = Turno & {
  posti_prenotati: number
  posti_residui: number
}

export type Prenotazione = {
  id: string
  evento_id: string
  turno_id: string | null
  nome: string
  cognome: string
  email: string
  telefono: string | null
  cap: string | null
  n_persone: number
  note: string | null
  token: string
  check_in_at: string | null
  check_in_by: string | null
  created_at: string
}

export type AdminUser = {
  email: string
  ruolo: 'admin' | 'super_admin' | 'scanner'
  nome: string | null
  created_at: string
}

// ============================================================
// HELPER FORMATTAZIONE
// ============================================================

const MESI = [
  '', 'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

export function formatOra(ora: string | null): string {
  if (!ora) return ''
  return ora.slice(0, 5)
}

export function formatRangeOrario(ora_inizio: string, ora_fine: string | null): string {
  const inizio = formatOra(ora_inizio)
  if (!ora_fine) return inizio
  return `${inizio}–${formatOra(ora_fine)}`
}

export function formatDataIT(data: string): string {
  const [y, m, d] = data.split('-')
  return `${parseInt(d, 10)} ${MESI[parseInt(m, 10)]} ${y}`
}

export function labelGiorno(data: string): string {
  const d = new Date(data + 'T00:00:00')
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ============================================================
// HELPER TURNI
// ============================================================

/** Converte 'HH:MM' o 'HH:MM:SS' in minuti dall'inizio del giorno. */
export function oraToMin(ora: string): number {
  const [h, m] = ora.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

/** Converte minuti in 'HH:MM' (con padding zero). */
export function minToOra(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
