import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const { data: adminRow } = await supabase
    .from('sass_admin_users')
    .select('email, ruolo, nome')
    .ilike('email', user.email ?? '')
    .maybeSingle()

  if (!adminRow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-slate-900">Accesso negato</h1>
          <p className="mt-2 text-sm text-slate-600">
            L&apos;email <strong>{user.email}</strong> non è nella whitelist degli amministratori.
          </p>
          <form action="/api/auth/signout" method="post" className="mt-6">
            <button type="submit" className="text-sm font-medium text-sass-700 hover:underline">
              Disconnetti
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold text-sass-900">
              Sassoferrato · Admin
            </Link>
            <div className="hidden gap-4 sm:flex">
              <Link href="/admin/scan" className="text-sm text-slate-600 hover:text-sass-700">Scan</Link>
              <Link href="/admin/prenotazioni" className="text-sm text-slate-600 hover:text-sass-700">Prenotazioni</Link>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">{adminRow.nome ?? adminRow.email}</span>
            <span className="rounded-full bg-sass-100 px-2 py-0.5 font-semibold text-sass-700">
              {adminRow.ruolo}
            </span>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-slate-400 hover:text-slate-700">Esci</button>
            </form>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:hidden">
          <Link href="/admin/scan" className="whitespace-nowrap text-sm text-slate-700">Scan</Link>
          <Link href="/admin/prenotazioni" className="whitespace-nowrap text-sm text-slate-700">Prenotazioni</Link>
        </div>
      </nav>
      {children}
    </div>
  )
}
