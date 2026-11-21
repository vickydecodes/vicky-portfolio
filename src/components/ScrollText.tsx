import { useEffect, useRef } from "react"

interface ScrollTextProps {
  text: string
  className?: string
}

/**
 * ScrollText — Sentry-style "reading spotlight / void" trailing word effect.
 *
 * Words outside the active center reading zone recede into the quiet void
 * (`opacity: 0.16`), illuminate word-by-word as they enter the watchable band,
 * and smoothly trail back into the void as they scroll out the top.
 * Single `getBoundingClientRect()` per frame via rAF = locked 120fps.
 */
export default function ScrollText({ text, className = "" }: ScrollTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const words = text.split(" ")

  useEffect(() => {
    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReduced) {
      wordRefs.current.forEach((el) => {
        if (el) el.style.opacity = "0.94"
      })
      return
    }

    let rafId = 0

    const update = () => {
      rafId = 0
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const vh = window.innerHeight
      const isMobile = window.innerWidth < 640
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
      const atTopEdge = window.scrollY < 28 && rect.top < vh * 0.65
      const atBottomEdge =
        maxScroll > 0 && window.scrollY >= maxScroll - 32 && rect.bottom > vh * 0.4

      const total = Math.max(1, words.length)

      // Wider, cleaner reading band on mobile so wrapped multi-line paragraphs stay crisp
      const topVoid = vh * (isMobile ? 0.02 : 0.06)
      const topLit = vh * (isMobile ? 0.16 : 0.28)
      const botLit = vh * (isMobile ? 0.78 : 0.68)
      const botVoid = vh * (isMobile ? 0.96 : 0.92)

      for (let i = 0; i < total; i++) {
        const el = wordRefs.current[i]
        if (!el) continue

        // Approximate each word's vertical position + subtle left-to-right trail offset
        const frac = i / total
        const wordY = rect.top + frac * Math.max(rect.height, 28) + frac * 36

        let lit = 1
        if (wordY < topLit && !atTopEdge) {
          lit = Math.min(1, Math.max(0, (wordY - topVoid) / (topLit - topVoid)))
        } else if (wordY > botLit && !atBottomEdge) {
          lit = Math.min(1, Math.max(0, (botVoid - wordY) / (botVoid - botLit)))
        }

        // Smoothstep curve for buttery void falloff
        const smooth = lit * lit * (3 - 2 * lit)
        const opacity = 0.16 + smooth * 0.8 // 0.16 (void) ↔ 0.96 (crisp foreground)
        el.style.opacity = opacity.toFixed(3)
      }
    }

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [words.length])

  return (
    <p ref={containerRef} className={`text-foreground ${className}`}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          ref={(el) => {
            wordRefs.current[idx] = el
          }}
          style={{
            opacity: 0.16,
            transition: "opacity 150ms ease-out",
          }}
        >
          {word}
          {idx < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  )
}
