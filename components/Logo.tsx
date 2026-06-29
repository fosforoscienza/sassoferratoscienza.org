/* eslint-disable @next/next/no-img-element */
export default function Logo({
  variant = 'dark',
  height = 30,
}: {
  variant?: 'dark' | 'light'
  height?: number
}) {
  return (
    <img
      src="/assets/logo-fosforo.png"
      alt="Fosforo, la festa della scienza"
      height={height}
      style={{
        height,
        width: 'auto',
        filter: variant === 'light' ? 'brightness(0) invert(1)' : undefined,
      }}
    />
  )
}
