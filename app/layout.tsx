import type { Metadata } from 'next'
import './globals.css'
import './landing.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sassoferratoscienza.org'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Sassoferrato Scienza — 24 luglio 2026',
  description:
    'Laboratori scientifici, Science Show e gran finale in musica a Sassoferrato: venerdì 24 luglio 2026, ore 17–22, Piazza Bartolo e Corso Cavour. Ingresso libero.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'Sassoferrato Scienza',
    title: 'Sassoferrato Scienza — 24 luglio 2026',
    description:
      'Venerdì 24 luglio 2026, dalle 17 alle 22. Laboratori, Science Show e gran finale in musica nel centro storico di Sassoferrato. Ingresso libero.',
    url: '/',
    images: ['/assets/spiral.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sassoferrato Scienza — 24 luglio 2026',
    description:
      'Venerdì 24 luglio 2026, dalle 17 alle 22 a Sassoferrato. Laboratori, Science Show e gran finale in musica. Ingresso libero.',
    images: ['/assets/spiral.png'],
  },
  icons: { icon: '/assets/favicon.svg' },
}

export const viewport = {
  themeColor: '#efe6d6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="no-js" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.remove('no-js')",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
