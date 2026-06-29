'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spinner } from './AuthLayout'

export default function CancellaPrenotazione({ token }: { token: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Apertura automatica se l'utente arriva dal link email con ?cancel=1
  useEffect(() => {
    if (searchParams?.get('cancel') === '1') {
      setConfirm(true)
      requestAnimationFrame(() => {
        document.getElementById('cancella-blk')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [searchParams])

  async function cancella() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/prenota/${token}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Errore durante la cancellazione')
        setLoading(false)
        return
      }
      setDone(true)
      setTimeout(() => router.push('/prenota'), 2200)
    } catch {
      setError('Errore di rete. Riprova.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Prenotazione cancellata. Reindirizzamento…
      </div>
    )
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs font-semibold text-red-600 hover:text-red-700"
      >
        Cancella prenotazione
      </button>
    )
  }

  return (
    <div id="cancella-blk" className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-3">
      <p className="text-sm text-slate-700">
        Sei sicuro? La cancellazione è definitiva e libera il posto.
      </p>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={cancella}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? <><Spinner /> Cancellando…</> : 'Sì, cancella'}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
