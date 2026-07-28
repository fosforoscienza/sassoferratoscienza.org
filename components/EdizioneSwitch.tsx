import Link from 'next/link'

/** Selettore edizione (2026, 2027, …): visibile solo se ne esiste più di una. */
export default function EdizioneSwitch({
  edizioni,
  attiva,
  basePath,
}: {
  edizioni: number[]
  attiva: number
  basePath: string
}) {
  if (edizioni.length < 2) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {edizioni.map(ed => (
        <Link
          key={ed}
          href={ed === edizioni[0] ? basePath : `${basePath}?edizione=${ed}`}
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            ed === attiva
              ? 'bg-sass-700 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {ed}
        </Link>
      ))}
    </div>
  )
}
