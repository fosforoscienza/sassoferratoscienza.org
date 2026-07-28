/**
 * Lookup CAP italiano → geografia (regione, provincia, sigla, coordinate).
 *
 * Sorgenti dati (open data, join sul codice ISTAT del comune):
 *  - CAP per comune: https://github.com/matteocontrini/comuni-json
 *  - Regione/provincia/sigla/coordinate: https://github.com/Samurai016/Comuni-ITA
 *
 * 4678 CAP unici mappati. Per i CAP condivisi da più comuni si usa il comune
 * più popoloso (capofila). Le coordinate sono quelle del comune capofila.
 *
 * NOTA: import del JSON solo lato server. Tieni questo modulo fuori dal bundle
 * client (è usato per analisi/mappe di provenienza geografica server-side).
 */

import capGeoData from './cap-geo.json'

export interface CapGeo {
  /** Comune capofila (es. "Senigallia") */
  c: string
  /** Regione (es. "Marche") */
  r: string
  /** Nome provincia (es. "Ancona") */
  p: string
  /** Sigla provincia, 2 lettere (es. "AN") */
  s: string
  /** Latitudine */
  lat: number
  /** Longitudine */
  lng: number
}

const CAP_GEO = capGeoData as Record<string, CapGeo>

/**
 * Ritorna i dati geografici per un CAP, oppure null se non trovato/invalido.
 * Effettua il trim e valida il formato (5 cifre).
 */
export function lookupCap(cap: string): CapGeo | null {
  if (typeof cap !== 'string') return null
  const trimmed = cap.trim()
  if (!/^[0-9]{5}$/.test(trimmed)) return null
  return CAP_GEO[trimmed] ?? null
}

/**
 * Ritorna la regione per un CAP, oppure null se non trovato/invalido.
 */
export function regioneFromCap(cap: string): string | null {
  return lookupCap(cap)?.r ?? null
}

/**
 * Ritorna il nome del comune capofila per un CAP, oppure null se non trovato/invalido.
 */
export function comuneFromCap(cap: string): string | null {
  return lookupCap(cap)?.c ?? null
}
