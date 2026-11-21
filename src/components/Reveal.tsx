import { useEffect, useRef, useState } from "react"

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/**
 * Reveal — Linear / Emil Kowalski style soft blur-rise on scroll.
 * Fires once per element, respects `prefers-reduced-motion`, zero dependencies.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  })

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        filter: visible ? "blur(0px)" : "blur(4px)",
        transition: `opacity 520ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 560ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, filter 520ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  )
}
