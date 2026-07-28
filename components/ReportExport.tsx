'use client'

import { useRef, useState } from 'react'
import { MARCHE_VIEWBOX_W, MARCHE_VIEWBOX_H, MARCHE_PATH_D } from '@/lib/marche-map'

type StatoLab = {
  prenotazioni: number
  persone: number
  scansioni: number
  personeScansionate: number
}

type LabRow = {
  id: string
  numero: number
  categoria: string
  colore: string | null
  titolo: string
  stat: StatoLab
}

type CittaRow = { nome: string; sigla: string; persone: number }

type ClusterPoint = {
  x: number
  y: number
  persone: number
  citta: { nome: string; persone: number }[]
}

type Props = {
  edizioneAttiva: number | null
  totali: StatoLab
  pctTotale: number
  righe: LabRow[]
  cittaTop: CittaRow[]
  altreCittaCount: number
  altrePersone: number
  clusterMarche: ClusterPoint[]
  fuoriRegioneLabel: string
}

// Dimensioni "carta" del riquadro catturato: proporzioni vicine a un A4
// verticale, così lo scarto tra pagina e contenuto resta minimo quando viene
// adattato (scala-per-adattare, mantenendo le proporzioni) al foglio finale.
const PAPER_WIDTH = 900

export default function ReportExport(props: Props) {
  const { edizioneAttiva, totali, pctTotale, righe, cittaTop, altreCittaCount, altrePersone, clusterMarche, fuoriRegioneLabel } = props
  const printRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'pdf' | 'jpeg' | null>(null)

  const fileBase = `report-sassoferrato-scienza${edizioneAttiva ? `-${edizioneAttiva}` : ''}`
  const maxPersoneCluster = Math.max(1, ...clusterMarche.map(c => c.persone))
  const generatoIl = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

  async function catturaCanvas() {
    const node = printRef.current
    if (!node) return null
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  }

  async function scaricaJpeg() {
    setBusy('jpeg')
    try {
      const canvas = await catturaCanvas()
      if (!canvas) return
      // Foglio A4 a 150dpi: 1240x1754px.
      const pageW = 1240
      const pageH = 1754
      const out = document.createElement('canvas')
      out.width = pageW
      out.height = pageH
      const ctx = out.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageW, pageH)
      const scale = Math.min(pageW / canvas.width, pageH / canvas.height)
      const w = canvas.width * scale
      const h = canvas.height * scale
      ctx.drawImage(canvas, (pageW - w) / 2, (pageH - h) / 2, w, h)
      out.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileBase}.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.92)
    } finally {
      setBusy(null)
    }
  }

  async function scaricaPdf() {
    setBusy('pdf')
    try {
      const canvas = await catturaCanvas()
      if (!canvas) return
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const canvasRatio = canvas.width / canvas.height
      const pageRatio = pageW / pageH
      let w: number
      let h: number
      if (canvasRatio > pageRatio) {
        w = pageW
        h = pageW / canvasRatio
      } else {
        h = pageH
        w = pageH * canvasRatio
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      pdf.addImage(imgData, 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h)
      pdf.save(`${fileBase}.pdf`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={scaricaPdf}
          disabled={busy !== null}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-sass-700 shadow-sm hover:border-sass-400 disabled:opacity-60"
          title="Scarica il report completo in un'unica pagina A4, in PDF"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span className="hidden sm:inline">Report</span> {busy === 'pdf' ? '…' : 'PDF'}
        </button>
        <button
          type="button"
          onClick={scaricaJpeg}
          disabled={busy !== null}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-sass-700 shadow-sm hover:border-sass-400 disabled:opacity-60"
          title="Scarica il report completo in un'unica pagina A4, in JPEG"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span className="hidden sm:inline">Report</span> {busy === 'jpeg' ? '…' : 'JPEG'}
        </button>
      </div>

      {/* Riquadro "carta" fuori schermo, usato solo per la cattura PDF/JPEG. */}
      <div style={{ position: 'fixed', top: 0, left: -10000, zIndex: -1 }} aria-hidden="true">
        <div
          ref={printRef}
          style={{
            width: PAPER_WIDTH,
            padding: 40,
            background: '#ffffff',
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '3px solid #7a4a2e', paddingBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7a4a2e' }}>
              Sassoferrato Scienza {edizioneAttiva ? `— Edizione ${edizioneAttiva}` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Report generato il {generatoIl}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Prenotazioni', value: totali.prenotazioni },
              { label: 'Persone prenotate', value: totali.persone },
              { label: 'Persone scansionate', value: totali.personeScansionate },
              { label: '% presenze', value: `${pctTotale}%` },
            ].map(s => (
              <div key={s.label} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#64748b' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#7a4a2e', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {cittaTop.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#7a4a2e' }}>Da dove arrivano i partecipanti</div>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(200px,280px) 1fr', gap: 20, border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {cittaTop.map((c, i) => (
                    <li key={`${c.nome}-${c.sigla}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', fontSize: 12.5, borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: 700 }}>
                        <span style={{ color: '#94a3b8', fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>
                        {c.nome} <span style={{ color: '#94a3b8', fontWeight: 700 }}>({c.sigla})</span>
                      </span>
                      <span style={{ fontWeight: 800, color: '#0369a1' }}>{c.persone}</span>
                    </li>
                  ))}
                  {altreCittaCount > 0 && (
                    <li style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', fontSize: 12.5, color: '#64748b' }}>
                      <span style={{ fontWeight: 700 }}>• Altre città ({altreCittaCount})</span>
                      <span style={{ fontWeight: 800 }}>{altrePersone}</span>
                    </li>
                  )}
                </ol>

                <div style={{ position: 'relative', margin: '0 auto', width: '100%', maxWidth: 320 }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: `${MARCHE_VIEWBOX_W} / ${MARCHE_VIEWBOX_H}` }}>
                    <svg viewBox={`0 0 ${MARCHE_VIEWBOX_W} ${MARCHE_VIEWBOX_H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                      <path d={MARCHE_PATH_D} fill="#ecf8fd" stroke="#7ec8ec" strokeWidth={1} />
                    </svg>
                    {clusterMarche.map((c, i) => {
                      const r = 6 + (24 - 6) * Math.sqrt(c.persone / maxPersoneCluster)
                      return (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left: `${(c.x / MARCHE_VIEWBOX_W) * 100}%`,
                            top: `${(c.y / MARCHE_VIEWBOX_H) * 100}%`,
                            width: r * 2,
                            height: r * 2,
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%',
                            background: '#0284c7',
                            border: '2px solid #ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                          }}
                        />
                      )
                    })}
                  </div>
                  {fuoriRegioneLabel && (
                    <div style={{ position: 'absolute', top: -6, right: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#94a3b8', border: '2px solid #ffffff', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
                      <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, color: '#94a3b8', whiteSpace: 'nowrap' }}>Fuori regione</div>
                    </div>
                  )}
                </div>
              </div>
              {fuoriRegioneLabel && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>Fuori regione: {fuoriRegioneLabel}</div>
              )}
            </div>
          )}

          {righe.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#7a4a2e', marginBottom: 8 }}>Attività</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: 0.3 }}>
                    <th style={{ padding: '4px 6px', borderBottom: '2px solid #e2e8f0' }}>Laboratorio</th>
                    <th style={{ padding: '4px 6px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Pren.</th>
                    <th style={{ padding: '4px 6px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Persone</th>
                    <th style={{ padding: '4px 6px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Scans.</th>
                    <th style={{ padding: '4px 6px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map(r => {
                    const pct = r.stat.persone > 0 ? Math.round((r.stat.personeScansionate / r.stat.persone) * 100) : 0
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 6px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              borderRadius: 8,
                              padding: '2px 7px',
                              fontSize: 8.5,
                              fontWeight: 700,
                              color: '#ffffff',
                              background: r.colore ?? '#0f9bd8',
                              marginRight: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r.categoria}
                          </span>
                          <span style={{ whiteSpace: 'nowrap' }}>{r.titolo}</span>
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>{r.stat.prenotazioni}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>{r.stat.persone}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>{r.stat.personeScansionate}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
