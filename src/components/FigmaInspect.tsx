import { useEffect, useRef, useState } from "react"
import { Hash, X } from "lucide-react"
import { playInspectTick, playPop, playTick } from "src/lib/sound"

interface InspectedBox {
  label: string
  top: number
  left: number
  width: number
  height: number
  isComponent: boolean
}

const REQUIRED_TAPS = 8

/**
 * FigmaInspect — Hidden Figma Inspect Mode easter egg.
 *
 * Triggered two ways:
 *  1. Tap 8 times rapidly anywhere on the page (like Android Developer Mode)
 *     to toggle persistent Figma Mode (works on desktop & mobile!).
 *  2. Hold `Alt` / `Option` on desktop for a quick temporary peek.
 */
export default function FigmaInspect({ disabled }: { disabled?: boolean }) {
  const [altActive, setAltActive] = useState(false)
  const [lockedMode, setLockedMode] = useState(false)
  const [remainingTaps, setRemainingTaps] = useState<number | null>(null)
  const [box, setBox] = useState<InspectedBox | null>(null)

  const lastElRef = useRef<HTMLElement | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const tapCountRef = useRef(0)
  const lastTapTimeRef = useRef(0)
  const toastTimerRef = useRef<number | null>(null)

  const active = !disabled && (altActive || lockedMode)

  useEffect(() => {
    if (disabled) {
      setAltActive(false)
      setLockedMode(false)
      setBox(null)
      setRemainingTaps(null)
      return
    }

    const inspectAt = (x: number, y: number) => {
      const raw = document.elementFromPoint(x, y) as HTMLElement | null
      if (!raw || raw.closest("[data-figma-inspect-ui]")) {
        return
      }

      const target =
        raw.closest<HTMLElement>("a, button, h1, h2, [data-figma-node]") ||
        raw.closest<HTMLElement>("section, footer")

      if (
        !target ||
        target === document.body ||
        target === document.documentElement
      ) {
        setBox(null)
        lastElRef.current = null
        return
      }

      if (target !== lastElRef.current) {
        lastElRef.current = target
        playInspectTick()
      }

      const r = target.getBoundingClientRect()
      const figName = target.dataset.figmaNode
      const tag = target.tagName.toLowerCase()
      const label = figName || (tag === "a" ? "link" : tag)
      const isComponent = figName === "navbar" || tag === "button" || tag === "a"

      setBox({
        label,
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        isComponent,
      })
    }

    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      if (!el || el.closest("[data-figma-inspect-ui]")) return

      // If already in locked Figma Mode, tapping any element inspects it (great on touch!)
      if (lockedMode) {
        inspectAt(e.clientX, e.clientY)
        return
      }

      // Skip rapid-tap counter inside text inputs
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      ) {
        return
      }

      const now = Date.now()
      if (now - lastTapTimeRef.current < 550) {
        tapCountRef.current += 1
      } else {
        tapCountRef.current = 1
      }
      lastTapTimeRef.current = now

      const left = REQUIRED_TAPS - tapCountRef.current
      if (left > 0 && left <= 3) {
        playTick()
        setRemainingTaps(left)
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = window.setTimeout(() => {
          setRemainingTaps(null)
        }, 1100)
      } else if (left <= 0) {
        tapCountRef.current = 0
        setRemainingTaps(null)
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        playPop()
        setLockedMode(true)
        inspectAt(e.clientX, e.clientY)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.repeat) {
        setAltActive(true)
        inspectAt(mouseRef.current.x, mouseRef.current.y)
      }
      if (e.key === "Escape" && lockedMode) {
        setLockedMode(false)
        setBox(null)
        lastElRef.current = null
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setAltActive(false)
        if (!lockedMode) {
          setBox(null)
          lastElRef.current = null
        }
      }
    }

    const onBlur = () => {
      setAltActive(false)
      if (!lockedMode) {
        setBox(null)
        lastElRef.current = null
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (e.altKey || lockedMode) {
        if (e.altKey) setAltActive(true)
        inspectAt(e.clientX, e.clientY)
      }
    }

    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    window.addEventListener("mousemove", onMouseMove, { passive: true })

    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("mousemove", onMouseMove)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [disabled, lockedMode])

  const exitLockedMode = () => {
    playTick()
    setLockedMode(false)
    setAltActive(false)
    setBox(null)
    lastElRef.current = null
  }

  const color = box?.isComponent ? "#9747ff" : "#0d99ff"

  return (
    <>
      {/* Subtle Android-style tap countdown toast (taps 5, 6, 7) */}
      {!active && remainingTaps !== null && (
        <div
          data-figma-inspect-ui
          className="fixed bottom-5 inset-x-0 z-[9980] flex justify-center pointer-events-none select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="rounded-full border border-border/80 bg-background/92 backdrop-blur-md px-3.5 py-1 font-mono text-[11px] text-muted-foreground shadow-md">
            <span className="text-foreground font-semibold">{remainingTaps}</span>{" "}
            more {remainingTaps === 1 ? "tap" : "taps"} for figma mode
          </span>
        </div>
      )}

      {/* Active Figma Inspect Mode overlay */}
      {active && (
        <div
          className="fixed inset-0 z-[9980] pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Subtle Figma dot-grid when in locked 8-tap Figma mode */}
          {lockedMode && <div className="fig-grid absolute inset-0 opacity-45" />}

          {box && (
            <>
              <div
                className="fixed left-0 right-0 h-px opacity-25"
                style={{ top: box.top, backgroundColor: "#f24822" }}
              />
              <div
                className="fixed top-0 bottom-0 w-px opacity-25"
                style={{ left: box.left, backgroundColor: "#f24822" }}
              />

              <div
                className="fixed border"
                style={{
                  top: box.top,
                  left: box.left,
                  width: box.width,
                  height: box.height,
                  borderColor: color,
                  backgroundColor: `${color}08`,
                }}
              >
                <span
                  className="absolute -top-[17px] left-[-1px] text-[9.5px] font-mono font-medium flex items-center gap-0.5 whitespace-nowrap"
                  style={{ color }}
                >
                  <Hash className="h-2.5 w-2.5" />
                  {box.label}
                </span>

                <span
                  className="absolute -top-[3px] -left-[3px] h-[5px] w-[5px] bg-white border"
                  style={{ borderColor: color }}
                />
                <span
                  className="absolute -top-[3px] -right-[3px] h-[5px] w-[5px] bg-white border"
                  style={{ borderColor: color }}
                />
                <span
                  className="absolute -bottom-[3px] -left-[3px] h-[5px] w-[5px] bg-white border"
                  style={{ borderColor: color }}
                />
                <span
                  className="absolute -bottom-[3px] -right-[3px] h-[5px] w-[5px] bg-white border"
                  style={{ borderColor: color }}
                />

                <span
                  className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 rounded-[3px] px-1.5 py-[1px] text-[9px] font-mono font-medium text-white whitespace-nowrap shadow-xs"
                  style={{ backgroundColor: color }}
                >
                  {Math.round(box.width)} × {Math.round(box.height)}
                </span>
              </div>
            </>
          )}

          {/* Bottom status / exit pill */}
          <div
            data-figma-inspect-ui
            className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none"
          >
            {lockedMode ? (
              <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#0d99ff]/40 bg-background/95 backdrop-blur-md pl-3 pr-2 py-1 font-mono text-[10.5px] text-foreground shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0d99ff]" />
                <span>figma mode</span>
                <button
                  type="button"
                  onClick={exitLockedMode}
                  className="ml-1 inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] hover:bg-foreground/[0.14] px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                  exit
                </button>
              </div>
            ) : (
              <span className="rounded-full border border-border/80 bg-background/90 backdrop-blur-md px-3 py-1 font-mono text-[10px] text-muted-foreground shadow-sm">
                figma inspect · release <span className="text-foreground">alt</span>
              </span>
            )}
          </div>
        </div>
      )}
    </>
  )
}
