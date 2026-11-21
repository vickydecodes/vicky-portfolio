import { useEffect, useRef, useState } from "react"

/**
 * BootScreen — Pure `~` Horizon Wave (heartbeat rhythm) & Split-Shutter Reveal.
 *
 *  1. A razor-thin `~` light wave sweeps edge-to-edge across the obsidian
 *     horizon (`0 → 100vw`) with a calm heartbeat pulse.
 *  2. The dark screen parts smoothly along the horizontal `~` horizon
 *     (top shutter glides up, bottom shutter glides down on pure GPU
 *     `translate3d`) revealing the live Figma workspace underneath.
 */
export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [isSplit, setIsSplit] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const timers: number[] = []
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms))

    at(1420, () => setIsSplit(true))
    at(2040, () => doneRef.current())

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") doneRef.current()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9998] overflow-hidden select-none pointer-events-none text-foreground"
      aria-hidden="true"
    >
      {/* ── Top obsidian shutter (parts upward along the `~` horizon) ── */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 bg-background border-b border-foreground/[0.08]"
        style={{
          transform: isSplit ? "translate3d(0, -102%, 0)" : "translate3d(0, 0, 0)",
          transition: "transform 620ms cubic-bezier(0.76, 0, 0.24, 1)",
          willChange: "transform",
        }}
      />

      {/* ── Bottom obsidian shutter (parts downward along the `~` horizon) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-background border-t border-foreground/[0.08]"
        style={{
          transform: isSplit ? "translate3d(0, 102%, 0)" : "translate3d(0, 0, 0)",
          transition: "transform 620ms cubic-bezier(0.76, 0, 0.24, 1)",
          willChange: "transform",
        }}
      />

      {/* ── Full-width `~` light wave across the entire viewport horizon ── */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{
          opacity: isSplit ? 0 : 1,
          transform: isSplit
            ? "scale3d(1.04, 0.2, 1)"
            : "scale3d(1, 1, 1)",
          transition:
            "opacity 320ms ease, transform 460ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform, opacity",
        }}
      >
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          className="wave-heartbeat w-full h-14 sm:h-16 overflow-visible"
          fill="none"
        >
          <defs>
            <linearGradient id="tilde-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="32%" stopColor="currentColor" stopOpacity="0.45" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="68%" stopColor="currentColor" stopOpacity="0.45" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Subtle ambient echo wave */}
          <path
            d="M 0 60 L 445 60 C 468 60, 476 42, 500 60 C 524 78, 532 60, 555 60 L 1000 60"
            stroke="url(#tilde-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.14"
            className="wave-trace-path"
          />

          {/* Razor-sharp primary `~` horizon light wave */}
          <path
            d="M 0 60 L 445 60 C 468 60, 476 42, 500 60 C 524 78, 532 60, 555 60 L 1000 60"
            stroke="url(#tilde-grad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="wave-trace-path"
          />
        </svg>
      </div>
    </div>
  )
}
