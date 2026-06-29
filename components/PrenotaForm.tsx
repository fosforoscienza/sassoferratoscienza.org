'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from './AuthLayout'
import type { TurnoConDisponibilita } from '@/lib/types'
import { formatRangeOrario } from '@/lib/types'

type Props = {
  eventoId: string
  /** Se presente, il laboratorio è "a turni": l'utente deve sceglierne uno. */
  turni?: TurnoConDisponibilita[]
}

export default function PrenotaForm({ eventoId, turni }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [privacyOk, setPrivacyOk] = useState(false)

  const isATurni = Array.isArray(turni)
  const turniDisponibili = useMemo(
    () => (turni ?? []).filter(t => t.posti_residui > 0),
    [turni]
  )

  const [turnoSelezionato, setTurnoSelezionato] = useState<string>('')

  const turnoScelto = turniDisponibili.find(t => t.id === turnoSelezionato)
  const maxPersone = isATurni ? Math.min(5, turnoScelto?.posti_residui ?? 5) : 5

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (isATurni && !turnoSelezionato) {
      setError('Seleziona un turno per continuare')
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const body = {
      evento_id: eventoId,
      turno_id: isATurni ? turnoSelezionato : null,
      nome: formData.get('nome'),
      cognome: formData.get('cognome'),
      email: formData.get('email'),
      telefono: formData.get('telefono') || null,
      cap: formData.get('cap'),
      n_persone: Number(formData.get('n_persone') ?? 1),
      note: formData.get('note') || null,
      privacy_consent: privacyOk,
    }

    try {
      const res = await fetch('/api/prenota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        const firstIssue: string | undefined = Array.isArray(data?.issues)
          ? data.issues.find((i: any) => i?.message)?.message
          : undefined
        setError(firstIssue ?? data.error ?? 'Errore durante la prenotazione')
        setLoading(false)
        return
      }
      router.push(`/conferma/${data.token}`)
    } catch {
      setError('Errore di rete. Riprova.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isATurni && (
        <div>
          <p className="label-base">Scegli il turno</p>
          {turni && turni.length === 0 ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Non ci sono turni disponibili per questo laboratorio.
            </p>
          ) : turniDisponibili.length === 0 ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Tutti i turni sono esauriti.
            </p>
          ) : (
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {(turni ?? []).map(t => {
                const esaurito = t.posti_residui <= 0
                const selected = turnoSelezionato === t.id
                return (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      esaurito
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                        : selected
                          ? 'border-sass-500 bg-sass-50 ring-1 ring-sass-500'
                          : 'border-slate-200 bg-white hover:border-sass-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="turno_id"
                        value={t.id}
                        checked={selected}
                        disabled={esaurito}
                        onChange={() => setTurnoSelezionato(t.id)}
                        className="h-4 w-4 cursor-pointer border-slate-300 text-sass-600 focus:ring-sass-500 disabled:cursor-not-allowed"
                      />
                      <span className="font-mono font-semibold text-slate-900">
                        {formatRangeOrario(t.ora_inizio, t.ora_fine)}
                      </span>
                    </span>
                    <span className={`text-xs ${esaurito ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                      {esaurito ? 'esaurito' : `${t.posti_residui} / ${t.capienza} posti`}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className="label-base">Nome</label>
          <input id="nome" name="nome" type="text" required maxLength={80} className="input-base" />
        </div>
        <div>
          <label htmlFor="cognome" className="label-base">Cognome</label>
          <input id="cognome" name="cognome" type="text" required maxLength={80} className="input-base" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label-base">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={160}
          className="input-base"
          placeholder="tua@email.com"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="telefono" className="label-base">
            Telefono <span className="text-slate-400">(opzionale)</span>
          </label>
          <input id="telefono" name="telefono" type="tel" maxLength={40} className="input-base" />
        </div>
        <div>
          <label htmlFor="cap" className="label-base">CAP</label>
          <input
            id="cap"
            name="cap"
            type="text"
            inputMode="numeric"
            required
            pattern="\d{5}"
            maxLength={5}
            minLength={5}
            autoComplete="postal-code"
            className="input-base"
            placeholder="60041"
            title="5 cifre"
          />
        </div>
        <div>
          <label htmlFor="n_persone" className="label-base">
            Persone <span className="text-slate-400">(max {maxPersone})</span>
          </label>
          <input
            id="n_persone"
            name="n_persone"
            type="number"
            min={1}
            max={maxPersone}
            defaultValue={1}
            required
            className="input-base"
            title={isATurni ? `Massimo ${maxPersone} posti su questo turno` : 'Massimo 5 posti per laboratorio dalla stessa email'}
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="label-base">
          Note <span className="text-slate-400">(opzionale)</span>
        </label>
        <textarea
          id="note"
          name="note"
          maxLength={500}
          rows={3}
          className="input-base resize-none"
          placeholder="Eventuali esigenze particolari…"
        />
      </div>

      <label
        htmlFor="privacy-consent"
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
      >
        <input
          id="privacy-consent"
          type="checkbox"
          required
          checked={privacyOk}
          onChange={e => setPrivacyOk(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-sass-600 focus:ring-sass-500"
        />
        <span className="text-xs leading-relaxed text-slate-700">
          Ho letto l&apos;
          <Link href="/privacy" target="_blank" className="font-semibold text-sass-700 underline-offset-2 hover:underline">
            informativa privacy
          </Link>{' '}
          e acconsento al trattamento dei miei dati personali per la gestione della prenotazione
          al laboratorio nell&apos;ambito di Sassoferrato Scienza.
          <span className="ml-1 text-red-600">*</span>
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !privacyOk || (isATurni && !turnoSelezionato)}
        className="btn-primary w-full"
      >
        {loading ? (
          <>
            <Spinner />
            Invio in corso…
          </>
        ) : (
          'Conferma prenotazione'
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Premendo “Conferma” riceverai un&apos;email con il QR code di accesso.
      </p>
    </form>
  )
}
