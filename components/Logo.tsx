export default function Logo({
  variant = 'dark',
  height = 30,
}: {
  variant?: 'dark' | 'light'
  height?: number
}) {
  const isLight = variant === 'light'
  return (
    <span
      className={`font-display font-extrabold uppercase leading-none whitespace-nowrap ${
        isLight ? 'text-white' : 'text-brown'
      }`}
      style={{ fontSize: Math.round(height * 0.82) }}
    >
      Sassoferrato{' '}
      <span className={isLight ? 'text-sass-300' : 'text-sass-500'}>Scienza</span>
    </span>
  )
}
