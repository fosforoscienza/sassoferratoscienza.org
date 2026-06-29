'use client'

import { useEffect } from 'react'

/**
 * Interazioni della landing (porting di script.js):
 * reveal allo scroll via IntersectionObserver (+ fallback), accordion FAQ,
 * duplicazione marquee. Opera sul markup iniettato via dangerouslySetInnerHTML.
 */
export default function LandingInteractions() {
  useEffect(() => {
    const root = document.querySelector('.landing-root')
    if (!root) return

    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ----- Reveal allo scroll -----
    const els = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]')) as HTMLElement[]
    let io: IntersectionObserver | null = null
    let fallback: ReturnType<typeof setTimeout> | null = null

    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'))
    } else {
      io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return
            const el = entry.target as HTMLElement
            const delay = el.getAttribute('data-reveal-delay')
            if (delay) el.style.transitionDelay = `${delay}ms`
            el.classList.add('is-visible')
            io!.unobserve(el)
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      )
      els.forEach(el => io!.observe(el))
      fallback = setTimeout(() => {
        els.forEach(el => el.classList.add('is-visible'))
      }, 2500)
    }

    // ----- Accordion FAQ -----
    const faqHandlers: Array<{ btn: HTMLElement; fn: () => void }> = []
    root.querySelectorAll('[data-faq]').forEach(item => {
      const btn = item.querySelector('[data-faq-q]') as HTMLElement | null
      const ans = item.querySelector('[data-faq-a]') as HTMLElement | null
      if (!btn || !ans) return
      btn.setAttribute('aria-expanded', 'false')
      const fn = () => {
        const open = item.classList.contains('is-open')
        if (open) {
          ans.style.maxHeight = '0px'
          ans.style.opacity = '0'
          ans.style.paddingBottom = '0px'
          item.classList.remove('is-open')
          btn.setAttribute('aria-expanded', 'false')
        } else {
          ans.style.maxHeight = `${ans.scrollHeight + 48}px`
          ans.style.opacity = '1'
          ans.style.paddingBottom = '22px'
          item.classList.add('is-open')
          btn.setAttribute('aria-expanded', 'true')
        }
      }
      btn.addEventListener('click', fn)
      faqHandlers.push({ btn, fn })
    })

    // ----- Marquee (duplica per loop continuo) -----
    root.querySelectorAll('[data-marquee-track]').forEach(track => {
      if (!track.getAttribute('data-doubled')) {
        track.innerHTML += track.innerHTML
        track.setAttribute('data-doubled', '1')
      }
    })

    return () => {
      io?.disconnect()
      if (fallback) clearTimeout(fallback)
      faqHandlers.forEach(({ btn, fn }) => btn.removeEventListener('click', fn))
    }
  }, [])

  return null
}
