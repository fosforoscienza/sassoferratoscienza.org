import ScanClient, { type PalcoScan } from '@/components/ScanClient'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ScanPage() {
  const supabase = createClient()
  const { data } = await supabase.rpc('sass_scan_targets')
  const palchi = (data as PalcoScan[] | null) ?? []

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-black text-brown">Scan check-in</h1>
      <p className="mt-1 text-sm text-slate-600">
        Scegli un laboratorio (o un turno) e inquadra i QR: vengono accettati solo quelli del target
        selezionato, con conteggio dei check-in in tempo reale.
      </p>
      <div className="mt-6">
        <ScanClient palchi={palchi} />
      </div>
    </main>
  )
}
