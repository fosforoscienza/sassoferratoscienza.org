'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout, Spinner } from '@/components/AuthLayout'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    router.push(next.startsWith('/') ? next : '/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <label className="label-base" htmlFor="email">Email</label>
        <input
          id="email"
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
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-base"
          placeholder="••••••••"
        />
      </div>

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
