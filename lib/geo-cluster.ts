/**
 * Clustering (single-linkage) di punti geografici già proiettati in
 * coordinate SVG: unisce i punti a distanza inferiore a `sogliaPx` in un
 * unico pallino più grande, centrato sul baricentro pesato per persone.
 * Indipendente dalla proiezione usata (Italia, Marche, ...).
 */

export type PuntoProiettato = { nome: string; x: number; y: number; persone: number }
export type ClusterProvenienza = {
  x: number
  y: number
  persone: number
  citta: { nome: string; persone: number }[]
}

export function clusterizzaPunti(punti: PuntoProiettato[], sogliaPx: number): ClusterProvenienza[] {
  let cluster: ClusterProvenienza[] = punti.map(p => ({
    x: p.x,
    y: p.y,
    persone: p.persone,
    citta: [{ nome: p.nome, persone: p.persone }],
  }))

  for (;;) {
    let best: { i: number; j: number; d: number } | null = null
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        const dx = cluster[i].x - cluster[j].x
        const dy = cluster[i].y - cluster[j].y
        const d = Math.hypot(dx, dy)
        if (d <= sogliaPx && (!best || d < best.d)) best = { i, j, d }
      }
    }
    if (!best) break
    const a = cluster[best.i]
    const b = cluster[best.j]
    const persone = a.persone + b.persone
    const merged: ClusterProvenienza = {
      x: (a.x * a.persone + b.x * b.persone) / persone,
      y: (a.y * a.persone + b.y * b.persone) / persone,
      persone,
      citta: [...a.citta, ...b.citta].sort((c1, c2) => c2.persone - c1.persone),
    }
    cluster = cluster.filter((_, idx) => idx !== best!.i && idx !== best!.j)
    cluster.push(merged)
  }

  return cluster.sort((a, b) => b.persone - a.persone)
}
