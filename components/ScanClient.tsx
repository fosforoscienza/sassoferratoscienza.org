'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export type Turno = {
  turno_id: string
  data: string
  ora_inizio: string
  ora_fine: string
  capienza: number
  prenotati_persone: number
  checkin_persone: number
}

export type EventoScan = {
  evento_id: string
  titolo: string
  data: string
  ora_inizio: string
  ora_fine: string
  a_turni: boolean
  capienza: number | null
  prenotati_persone: number
  checkin_persone: number
  turni: Turno[]
}

export type PalcoScan = {
  palco_id: string
  palco_nome: string
  eventi: EventoScan[]
}

type Conteggio = {
  capienza: number | null
  prenotatiPersone: number
  checkinPersone: number
}

type Target = {
  titolo: string
  sottotitolo: string
  turnoId: string | null
  eventoId: string | null
  init: Conteggio
}

type Mode = { kind: 'target'; target: Target } | { kind: 'libero' }

type Partecipante = {
  id: string
  nome: string
  cognome: string
  n_persone: number
  checkedIn: boolean
}

type Result =
  | { kind: 'ok'; nome: string; cognome: string; evento: string; gia: boolean }
  | { kind: 'err'; msg: string }

function extractToken(payload: string): string | null {
  const m = payload.match(/\/conferma\/([0-9a-fA-F-]{36})/)
  if (m) return m[1]
  if (/^[0-9a-fA-F-]{36}$/.test(payload.trim())) return payload.trim()
  return null
}

export default function ScanClient({ palchi }: { palchi: PalcoScan[] }) {
  const [mode, setMode] = useState<Mode | null>(null)
  if (!mode) return <TargetPicker palchi={palchi} onSelect={setMode} />
  return <Scanner mode={mode} onBack={() => setMode(null)} />
}

function Conteggini({ checkin, prenotati, cap }: { checkin: number; prenotati: number; cap: number | null }) {
  return (
    <span className="shrink-0 text-xs font-medium text-slate-500">
      {checkin}/{prenotati} scansionati{cap != null && ` · cap. ${cap}`}
    </span>
  )
}

function TargetPicker({
  palchi,
  onSelect,
}: {
  palchi: PalcoScan[]
  onSelect: (m: Mode) => void
}) {
  return (
    <div>
      {palchi.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Nessun laboratorio configurato.
        </p>
      ) : (
        <div className="space-y-8">
          {palchi.map(palco => (
            <section key={palco.palco_id}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                {palco.palco_nome}
              </h2>
              <div className="space-y-5">
                {palco.eventi.map(ev =>
                  ev.a_turni ? (
                    <div key={ev.evento_id}>
                      <p className="mb-2 text-sm font-bold text-sass-900">{ev.titolo}</p>
                      <div className="grid gap-2">
                        {ev.turni.map(t => (
                          <button
                            key={t.turno_id}
                            onClick={() =>
                              onSelect({
                                kind: 'target',
                                target: {
                                  titolo: ev.titolo,
                                  sottotitolo: `Turno ${t.ora_inizio}–${t.ora_fine}`,
                                  turnoId: t.turno_id,
                                  eventoId: null,
                                  init: {
                                    capienza: t.capienza,
                                    prenotatiPersone: t.prenotati_persone,
                                    checkinPersone: t.checkin_persone,
                                  },
                                },
                              })
                            }
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sass-300 hover:bg-sass-50"
                          >
                            <span className="text-sm font-semibold text-slate-800">
                              {t.ora_inizio}–{t.ora_fine}
                            </span>
                            <Conteggini checkin={t.checkin_persone} prenotati={t.prenotati_persone} cap={t.capienza} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      key={ev.evento_id}
                      onClick={() =>
                        onSelect({
                          kind: 'target',
                          target: {
                            titolo: ev.titolo,
                            sottotitolo: `${ev.ora_inizio}–${ev.ora_fine}`,
                            turnoId: null,
                            eventoId: ev.evento_id,
                            init: {
                              capienza: ev.capienza,
                              prenotatiPersone: ev.prenotati_persone,
                              checkinPersone: ev.checkin_persone,
                            },
                          },
                        })
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sass-300 hover:bg-sass-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800">{ev.titolo}</span>
                        <span className="block text-xs text-slate-500">
                          {ev.ora_inizio}–{ev.ora_fine}
                        </span>
                      </span>
                      <Conteggini checkin={ev.checkin_persone} prenotati={ev.prenotati_persone} cap={ev.capienza} />
                    </button>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <button
        onClick={() => onSelect({ kind: 'libero' })}
        className="mt-8 w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
      >
        Scan libero (tutti i laboratori, senza filtro)
      </button>
    </div>
  )
}

function Scanner({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastTokenRef = useRef<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [conteggio, setConteggio] = useState<Conteggio | null>(
    mode.kind === 'target' ? mode.target.init : null
  )
  const [partecipanti, setPartecipanti] = useState<Partecipante[] | null>(null)

  const turnoId = mode.kind === 'target' ? mode.target.turnoId : null
  const eventoId = mode.kind === 'target' ? mode.target.eventoId : null

  async function loadPartecipanti() {
    if (!turnoId && !eventoId) return
    const qs = turnoId ? `turnoId=${turnoId}` : `eventoId=${eventoId}`
    try {
      const res = await fetch(`/api/admin/scan/partecipanti?${qs}`)
      const data = await res.json()
      if (res.ok) setPartecipanti(data.partecipanti ?? [])
    } catch {
      /* lista non disponibile: non blocca lo scan */
    }
  }

  useEffect(() => {
    loadPartecipanti()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStreaming(true)
          tick()
        }
      } catch (err) {
        console.error(err)
        setResult({ kind: 'err', msg: 'Impossibile accedere alla fotocamera.' })
      }
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        raf = requestAnimationFrame(tick)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
      if (code?.data) {
        const token = extractToken(code.data)
        if (token && token !== lastTokenRef.current) {
          lastTokenRef.current = token
          checkin(token)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    start()
    return () => {
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach(t => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkin(token: string) {
    setLoadingCheckin(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, turnoId, eventoId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ kind: 'err', msg: data.error ?? 'Errore' })
      } else {
        setResult({ kind: 'ok', nome: data.nome, cognome: data.cognome, evento: data.evento, gia: !!data.gia })
        if (data.conteggio) {
          setConteggio({
            capienza: data.conteggio.capienza,
            prenotatiPersone: data.conteggio.prenotatiPersone,
            checkinPersone: data.conteggio.checkinPersone,
          })
        }
        loadPartecipanti()
      }
    } catch {
      setResult({ kind: 'err', msg: 'Errore di rete' })
    } finally {
      setLoadingCheckin(false)
    }
  }

  function reset() {
    setResult(null)
    lastTokenRef.current = null
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {mode.kind === 'target' ? (
            <>
              <p className="truncate text-sm font-bold text-sass-900">{mode.target.titolo}</p>
              <p className="text-xs text-slate-500">{mode.target.sottotitolo}</p>
            </>
          ) : (
            <p className="text-sm font-bold text-sass-900">Scan libero</p>
          )}
        </div>
        <button
          onClick={onBack}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          ← Cambia
        </button>
      </div>

      {conteggio && (
        <div className="mb-4 flex items-baseline gap-2 rounded-2xl border border-sass-200 bg-sass-50 px-5 py-4">
          <span className="text-3xl font-extrabold text-sass-700">{conteggio.checkinPersone}</span>
          <span className="text-sm text-sass-900">
            persone scansionate · {conteggio.prenotatiPersone} prenotate
            {conteggio.capienza != null && ` · cap. ${conteggio.capienza}`}
          </span>
        </div>
      )}

      <div className="relative mx-auto max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-black sm:max-w-sm">
        <video ref={videoRef} className="block w-full" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {!streaming && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            Avvio fotocamera…
          </div>
        )}
        <div className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-sass-300/70" />
      </div>

      {loadingCheckin && (
        <p className="mt-4 text-center text-sm text-slate-500">Verifica in corso…</p>
      )}

      {result && (
        <div
          className={`mt-4 rounded-2xl p-5 text-sm ${
            result.kind === 'ok'
              ? result.gia
                ? 'border border-amber-200 bg-amber-50 text-amber-900'
                : 'border border-green-200 bg-green-50 text-green-900'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {result.kind === 'ok' ? (
            <>
              <p className="font-bold">{result.gia ? '⚠️ Già fatto check-in' : '✅ Check-in registrato'}</p>
              <p className="mt-1">{result.nome} {result.cognome} · {result.evento}</p>
            </>
          ) : (
            <p className="font-bold">⛔ {result.msg}</p>
          )}
          <button onClick={reset} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline">
            Prossimo scan →
          </button>
        </div>
      )}

      {partecipanti && partecipanti.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-sass-900">Partecipanti</h2>
            <span className="text-xs font-medium text-slate-500">
              {partecipanti.filter(p => p.checkedIn).length}/{partecipanti.length} arrivati
            </span>
          </div>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {partecipanti.map(p => (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 ${p.checkedIn ? 'bg-green-50' : ''}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      p.checkedIn ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                    aria-hidden
                  >
                    {p.checkedIn ? '✓' : ''}
                  </span>
                  <span className={`truncate text-sm ${p.checkedIn ? 'font-semibold text-green-900' : 'text-slate-700'}`}>
                    {p.cognome} {p.nome}
                  </span>
                </span>
                {p.n_persone > 1 && (
                  <span className="shrink-0 text-xs font-medium text-slate-500">×{p.n_persone}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
