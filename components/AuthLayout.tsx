'use client'

import React from 'react'
import Link from 'next/link'
import Logo from './Logo'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#114a67] via-[#0f9bd8] to-[#16b39a] p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#f3c52e]/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna alla home
          </Link>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
            Sassoferrato Scienza
          </p>
          <div className="mt-3">
            <Logo variant="light" height={34} />
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-1 text-xl font-bold text-ink">{title}</h2>
          {subtitle && <p className="mb-6 text-sm text-ink-soft">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
