import { useEffect, useRef, useState } from "react"

interface LightUpProps {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: "div" | "span"
}

/**
 * LightUp — Subtle "off → on" illumination matching ScrollText.
 *
 * Elements rest in a calm unlit state (`opacity: 0.26`) outside the watchable
 * reading zone and smoothly power on (`opacity: 1`) as they enter view,
 * with optional stagger delay for badges, titles, and rows.
 */
export default function LightUp({
  children,
  delay = 0,
  className = "",
  as = "div",
}: LightUpProps) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null)
  const [lit, setLit] = useState(() => {
    if (typeof window === "undefined") return true
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  })

  useEffect(() => {
    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (prefersReduced) {
      setLit(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        setLit(entry.isIntersecting)
      },
      {
        threshold: 0.15,
        rootMargin: "-14% 0px -14% 0px",
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style: React.CSSProperties = {
    opacity: lit ? 1 : 0.18,
    transform: lit ? "translate3d(0, 0, 0)" : "translate3d(0, 3px, 0)",
    transition: `opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) ${lit ? delay : 0}ms, transform 400ms cubic-bezier(0.22, 1, 0.36, 1) ${lit ? delay : 0}ms`,
  }

  if (as === "span") {
    return (
      <span ref={ref} className={`inline-flex ${className}`} style={style}>
        {children}
      </span>
    )
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
