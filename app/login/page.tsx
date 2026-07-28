'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout, Spinner } from '@/components/AuthLayout'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Email non confermata. Controlla la tua casella di posta (anche lo spam).')
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        setError('Email o password non corretti. Riprova.')
      } else {
        setError(`Errore: ${error.message}`)
      }
      setLoading(false)
      return
    }

    // Chiede al gestore password del browser di salvare le credenziali (nessun
    // dato viene mai salvato da noi: la richiesta va al password manager nativo,
    // che l'utente può comunque rifiutare).
    if (rememberMe && typeof window !== 'undefined' && 'PasswordCredential' in window) {
      try {
        const PasswordCredentialCtor = (window as unknown as { PasswordCredential: new (data: unknown) => Credential }).PasswordCredential
        const cred = new PasswordCredentialCtor({ id: email, password, name: email })
        await navigator.credentials.store?.(cred)
      } catch {
        // API non supportata dal browser o richiesta rifiutata: non blocca il login.
      }
    }

    // Navigazione a pagina intera (non client-side routing): è il segnale che i
    // password manager dei browser cercano per proporre il salvataggio.
    window.location.assign(next.startsWith('/') ? next : '/admin')
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <label className="label-base" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="input-base"
          placeholder="tua@email.com"
        />
      </div>

      <div>
        <label className="label-base" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-base"
          placeholder="••••••••"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={e => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sass-600 focus:ring-sass-500"
        />
        Ricordami su questo dispositivo
      </label>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <Spinner />
            Accesso in corso…
          </>
        ) : 'Accedi'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout title="Area Admin" subtitle="Accedi al pannello di Sassoferrato Scienza">
      <Suspense fallback={<div className="text-center text-sm text-ink-soft">Caricamento…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
