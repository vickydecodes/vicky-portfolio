import { useRef } from "react"

interface SpotlightRowProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * SpotlightRow — Linear-style cursor-tracking radial spotlight row.
 * Zero visual noise at rest; subtle specular light + hairline accent on hover.
 */
export default function SpotlightRow({
  href,
  children,
  className = "",
}: SpotlightRowProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - r.left}px`)
    el.style.setProperty("--my", `${e.clientY - r.top}px`)
  }

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMove}
      className={`spotlight-row group relative block -mx-3 px-3 py-3.5 rounded-lg overflow-hidden transition-colors duration-200 ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-3 bottom-3 w-[1.5px] rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity duration-250"
      />
      <div className="relative z-10">{children}</div>
    </a>
  )
}
