import Link from 'next/link'
import Logo from './Logo'

export default function BookingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#eee5d5]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2" aria-label="Sassoferrato Scienza — home">
          <Logo height={24} />
        </Link>
        <Link
          href="/#programma"
          className="font-mono text-xs font-bold uppercase tracking-wider text-ink-soft hover:text-ink"
        >
          ← Programma
        </Link>
      </div>
    </header>
  )
}
