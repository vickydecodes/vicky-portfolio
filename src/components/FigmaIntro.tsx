import { useEffect, useRef, useState } from "react"
import {
  MousePointer2,
  Hash,
  Square,
  PenTool,
  Type,
  Hand,
  MessageCircle,
  Play,
  Image as ImageIcon,
  Upload,
  Check,
} from "lucide-react"

/**
 * FigmaIntro — live "self-building" Figma workspace overlay.
 *
 * Treats the browser window itself as a live Figma canvas with zero changes
 * to the actual site design:
 *  1. Detaches the real fixed navbar and hides visible sections.
 *  2. Multiple Figma multiplayer cursors swoop in and "draw" each real
 *     section's bounding frame in place, revealing the actual DOM content.
 *  3. The lead `vicky` cursor grabs the floating real navbar, drags it up
 *     with red Figma smart-snap guides until it locks into position.
 *  4. `vicky` clicks Present in the floating UI3 toolbar — all Figma frames,
 *     rulers, guides, and cursors close out, leaving the real site live.
 */

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface SectionNode {
  id: string
  el: HTMLElement
  rect: Rect
  color: string
  cursorName: string
  state: "hidden" | "drawing" | "placed" | "clear"
}

interface LiveCursor {
  id: string
  label: string
  color: string
  x: number
  y: number
  dur: number
  pressed: boolean
  visible: boolean
}

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"
const LEAD_COLOR = "#9747ff" // Figma component purple

const WORKER_PALETTE: { name: string; color: string }[] = [
  { name: "layout", color: "#0d99ff" },
  { name: "type", color: "#14ae5c" },
  { name: "grid", color: "#f24822" },
  { name: "ui", color: "#ff7262" },
  { name: "dev", color: "#1abcfe" },
]

interface MascotUploadState {
  phase: "hidden" | "dragging" | "dropped"
  x: number
  y: number
  dropX: number
  dropY: number
  rot: number
  dur: number
  bouncing: boolean
}

export default function FigmaIntro({
  onDone,
}: {
  onDone: (dropPos?: { x: number; y: number }) => void
}) {
  const playRef = useRef<HTMLButtonElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const [navRect, setNavRect] = useState<Rect | null>(null)
  const [navOffset, setNavOffset] = useState({ x: 0, y: 0, rot: 0, dur: 0 })
  const [navSelected, setNavSelected] = useState(false)
  const [navDocked, setNavDocked] = useState(false)
  const [guides, setGuides] = useState(false)
  const [sections, setSections] = useState<SectionNode[]>([])
  const [cursors, setCursors] = useState<LiveCursor[]>([])
  const [mascot, setMascot] = useState<MascotUploadState>({
    phase: "hidden",
    x: 0,
    y: 0,
    dropX: 0,
    dropY: 0,
    rot: 0,
    dur: 0,
    bouncing: false,
  })
  const [playHover, setPlayHover] = useState(false)
  const [playClick, setPlayClick] = useState(false)
  const [exiting, setExiting] = useState(false)

  // Keep refs to mutated DOM nodes so cleanup always restores them cleanly
  const touchedRef = useRef<{ nav: HTMLElement | null; secs: HTMLElement[] }>({
    nav: null,
    secs: [],
  })

  const restoreDOM = () => {
    const { nav, secs } = touchedRef.current
    if (nav) {
      nav.style.transform = ""
      nav.style.transition = ""
      nav.style.boxShadow = ""
      nav.style.zIndex = ""
    }
    for (const el of secs) {
      el.style.opacity = ""
      el.style.transform = ""
      el.style.transition = ""
    }
  }

  // ── Choreography Timeline ────────────────────────────────
  useEffect(() => {
    const timers: number[] = []
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms))

    const vw = window.innerWidth
    const vh = window.innerHeight

    // 1. Measure real navbar & visible sections before mutating styles
    const navEl = document.querySelector<HTMLElement>(
      '[data-figma-node="navbar"]',
    )
    const secEls = Array.from(
      document.querySelectorAll<HTMLElement>("main section[data-figma-node]"),
    )

    const measuredNav: Rect | null = navEl
      ? (() => {
        const r = navEl.getBoundingClientRect()
        return { top: r.top, left: r.left, width: r.width, height: r.height }
      })()
      : null

    const visibleSecs: SectionNode[] = []
    secEls.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.top < vh - 24 && r.height > 10 && visibleSecs.length < 5) {
        const pal = WORKER_PALETTE[visibleSecs.length % WORKER_PALETTE.length]
        visibleSecs.push({
          id: el.dataset.figmaNode || `frame-${visibleSecs.length + 1}`,
          el,
          rect: { top: r.top, left: r.left, width: r.width, height: r.height },
          color: pal.color,
          cursorName: pal.name,
          state: "hidden",
        })
      }
    })

    touchedRef.current = {
      nav: navEl,
      secs: visibleSecs.map((s) => s.el),
    }

    // Offset for the detached real navbar
    const dx = Math.round(Math.min(48, Math.max(16, vw * 0.035)))
    const dy = Math.round(Math.min(185, Math.max(115, vh * 0.21)))
    const rot = -1.6

    // Immediately detach real navbar & hide visible sections
    if (navEl) {
      navEl.style.transition = "none"
      navEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg)`
      navEl.style.boxShadow = "0 14px 40px rgba(0, 0, 0, 0.32)"
      navEl.style.zIndex = "9992"
    }
    visibleSecs.forEach((s) => {
      s.el.style.transition = "none"
      s.el.style.opacity = "0"
      s.el.style.transform = "scale(0.985)"
    })

    setNavRect(measuredNav)
    setNavOffset({ x: dx, y: dy, rot, dur: 0 })
    setSections(visibleSecs)

    // Spawn cursors just inside edges of the canvas
    const spawnEdges = [
      { x: vw - 60, y: vh - 70 },
      { x: 40, y: vh * 0.35 },
      { x: vw - 50, y: vh * 0.28 },
      { x: 50, y: vh * 0.72 },
      { x: vw - 70, y: vh * 0.65 },
      { x: vw * 0.5, y: vh - 50 },
    ]

    const initialCursors: LiveCursor[] = [
      {
        id: "lead",
        label: "vicky",
        color: LEAD_COLOR,
        x: spawnEdges[0].x,
        y: spawnEdges[0].y,
        dur: 0,
        pressed: false,
        visible: false,
      },
      ...visibleSecs.map((s, i) => {
        const edge = spawnEdges[(i + 1) % spawnEdges.length]
        return {
          id: s.id,
          label: s.cursorName,
          color: s.color,
          x: edge.x,
          y: edge.y,
          dur: 0,
          pressed: false,
          visible: false,
        }
      }),
    ]
    setCursors(initialCursors)

    const updateCursor = (id: string, patch: Partial<LiveCursor>) => {
      setCursors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
    }

    const updateSectionState = (id: string, state: SectionNode["state"]) => {
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, state } : s)),
      )
    }

    // 2. Worker cursors fly to the top-left of each real section
    at(180, () => {
      visibleSecs.forEach((s, i) => {
        at(i * 90, () => {
          updateCursor(s.id, {
            visible: true,
            dur: 560,
            x: s.rect.left - 2,
            y: s.rect.top - 2,
          })
        })
      })
    })

    // 3. Worker cursors press & drag diagonally to "draw" each section frame
    visibleSecs.forEach((s, i) => {
      const startMs = 780 + i * 140
      const drawDur = 640

      at(startMs, () => {
        updateCursor(s.id, { pressed: true, dur: 90 })
        updateSectionState(s.id, "drawing")
      })

      at(startMs + 80, () => {
        updateCursor(s.id, {
          dur: drawDur,
          x: s.rect.left + s.rect.width + 2,
          y: s.rect.top + s.rect.height + 2,
        })
      })

      // Reveal the actual DOM section right as the frame finishes drawing
      at(startMs + 80 + drawDur - 60, () => {
        s.el.style.transition = `opacity 320ms ease-out, transform 360ms ${EASE}`
        s.el.style.opacity = "1"
        s.el.style.transform = "scale(1)"
      })

      at(startMs + 80 + drawDur + 20, () => {
        updateCursor(s.id, { pressed: false, dur: 110 })
        updateSectionState(s.id, "placed")
      })

      // Worker cursor drifts slightly aside after placing its frame
      at(startMs + 80 + drawDur + 300, () => {
        updateCursor(s.id, {
          dur: 650,
          x: i % 2 === 0 ? Math.max(24, s.rect.left - 64) : Math.min(vw - 90, s.rect.left + s.rect.width + 48),
          y: s.rect.top + s.rect.height * 0.4,
        })
      })
    })

    // 4. Lead cursor (`vicky`) glides to the detached real navbar
    if (measuredNav && navEl) {
      const grabX = measuredNav.left + Math.min(measuredNav.width * 0.28, 340)
      const grabY = measuredNav.top + measuredNav.height / 2

      at(650, () => {
        updateCursor("lead", {
          visible: true,
          dur: 760,
          x: grabX + dx,
          y: grabY + dy,
        })
      })

      // Grab the real navbar — purple Figma component box locks on
      at(1480, () => {
        updateCursor("lead", { pressed: true, dur: 100 })
        setNavSelected(true)
      })

      // Drag the real navbar up into its real fixed slot
      const dragDur = 920
      at(1660, () => {
        navEl.style.transition = `transform ${dragDur}ms ${EASE}, box-shadow 320ms ease ${dragDur - 220}ms`
        navEl.style.transform = "translate3d(0px, 0px, 0) rotate(0deg)"
        navEl.style.boxShadow = "none"
        setNavOffset({ x: 0, y: 0, rot: 0, dur: dragDur })
        updateCursor("lead", {
          dur: dragDur,
          x: grabX,
          y: grabY,
        })
      })

      // Red Figma smart-snap guides flash as navbar approaches top (0px)
      at(1660 + dragDur * 0.58, () => setGuides(true))

      // Release — navbar snapped flush
      at(1660 + dragDur + 30, () => {
        updateCursor("lead", { pressed: false, dur: 110 })
        setNavDocked(true)
      })
    }

    // 5. Upload Minecraft Vicky (`minecraft_me.png`) onto the canvas
    const dropX = Math.max(24, vw - 140)
    const dropY = Math.max(120, vh - 108 - 28)
    const startX = vw + 24
    const startY = Math.max(96, dropY - 90)

    // Lead cursor dashes to the right edge to drag in the PNG asset
    at(2780, () => {
      setGuides(false)
      setNavSelected(false)
      setSections((prev) => prev.map((s) => ({ ...s, state: "clear" })))
      updateCursor("lead", {
        dur: 480,
        x: vw - 14,
        y: startY + 46,
      })
    })

    // Asset appears attached to the cursor at the right edge
    at(3260, () => {
      updateCursor("lead", { pressed: true, dur: 90 })
      setMascot({
        phase: "dragging",
        x: startX,
        y: startY,
        dropX,
        dropY,
        rot: -5,
        dur: 0,
        bouncing: false,
      })
    })

    // Drag `minecraft_me.png` smoothly onto the site
    const uploadDur = 780
    at(3340, () => {
      setMascot((m) => ({
        ...m,
        x: dropX,
        y: dropY,
        rot: 0,
        dur: uploadDur,
      }))
      updateCursor("lead", {
        dur: uploadDur,
        x: dropX + 34,
        y: dropY + 48,
      })
    })

    // Drop Vicky onto the site with a Minecraft landing bounce
    at(3340 + uploadDur + 20, () => {
      updateCursor("lead", { pressed: false, dur: 110 })
      setMascot((m) => ({
        ...m,
        phase: "dropped",
        bouncing: true,
      }))
    })

    at(3340 + uploadDur + 360, () => {
      setMascot((m) => ({ ...m, bouncing: false }))
    })

    // 6. Lead cursor moves to the floating UI3 toolbar's Present (▶) button
    at(4520, () => {
      if (playRef.current) {
        const p = playRef.current.getBoundingClientRect()
        updateCursor("lead", {
          dur: 580,
          x: p.left + p.width / 2 - 2,
          y: p.top + p.height / 2 - 2,
        })
      }
      // Worker cursors scatter toward edges as work wraps up
      visibleSecs.forEach((s, i) => {
        const edge = spawnEdges[(i + 1) % spawnEdges.length]
        updateCursor(s.id, {
          dur: 540,
          x: edge.x,
          y: edge.y,
          visible: false,
        })
      })
    })

    at(5040, () => setPlayHover(true))

    // 7. Click Present — close out the Figma layer so the actual site stands alone
    at(5180, () => {
      setPlayClick(true)
      updateCursor("lead", { pressed: true, dur: 90 })
    })

    at(5340, () => {
      updateCursor("lead", { pressed: false, visible: false, dur: 220 })
      setExiting(true)
    })

    at(5820, () => {
      restoreDOM()
      doneRef.current({ x: dropX, y: dropY })
    })

    return () => {
      timers.forEach(clearTimeout)
      restoreDOM()
    }
  }, [])

  // ── Lock scroll + Esc / Enter to skip ────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        restoreDOM()
        doneRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  const handleSkip = () => {
    restoreDOM()
    doneRef.current()
  }

  return (
    <>
      {/* ── Minecraft Vicky asset uploaded onto the live site (stays solid during exit for seamless handoff) ── */}
      {mascot.phase !== "hidden" && (
        <div
          className="fixed top-0 left-0 z-[9994] pointer-events-none select-none"
          style={{
            transform: `translate3d(${mascot.x}px, ${mascot.y}px, 0) rotate(${mascot.rot}deg)`,
            transition:
              mascot.dur > 0 ? `transform ${mascot.dur}ms ${EASE}` : "none",
          }}
        >
          {/* Speech bubble appears once dropped, matching MascotAssistant */}
          {mascot.phase === "dropped" && (
            <div className="absolute top-[12px] -translate-y-full left-1/2 -translate-x-1/2 bg-card text-foreground font-sans text-[10px] font-medium tracking-tight border border-border/25 px-2.5 py-1 rounded-md shadow-md whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              hii 👋
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
            </div>
          )}

          {/* Exact 64×108 hitbox wrapper matching MascotAssistant */}
          <div
            className={`relative w-[64px] h-[108px] flex items-center justify-center transition-transform duration-200 ${mascot.bouncing ? "scale-y-[0.80] scale-x-[1.20]" : ""
              }`}
          >
            <img
              src="/assets/minecraft_me.png"
              alt="vicky mascot"
              className="relative select-none pointer-events-none"
              style={{
                width: "48px",
                height: "auto",
                imageRendering: "pixelated",
              }}
            />

            {/* Figma image selection box + upload pill (fades out on exit) */}
            <div
              className={`absolute inset-0 border-[1.5px] border-[#14ae5c] transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"
                }`}
            >
              <span className="absolute -top-[18px] left-[-1px] text-[10px] font-mono font-medium text-[#14ae5c] flex items-center gap-1 whitespace-nowrap">
                <ImageIcon className="h-2.5 w-2.5" />
                vicky_mc.png
              </span>
              <Handle color="#14ae5c" className="-top-[4px] -left-[4px]" />
              <Handle color="#14ae5c" className="-top-[4px] -right-[4px]" />
              <Handle color="#14ae5c" className="-bottom-[4px] -left-[4px]" />
              <Handle color="#14ae5c" className="-bottom-[4px] -right-[4px]" />
              <span className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#14ae5c] text-white text-[9.5px] font-mono font-medium px-1.5 py-[1px] whitespace-nowrap shadow-xs flex items-center gap-1">
                {mascot.phase === "dragging" ? (
                  <>
                    <Upload className="h-2.5 w-2.5" />
                    uploading…
                  </>
                ) : (
                  <>
                    <Check className="h-2.5 w-2.5" />
                    48 × 96
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fig-intro fixed inset-0 z-[9990] pointer-events-none overflow-hidden font-sans select-none transition-opacity duration-500 ${exiting ? "opacity-0" : "opacity-100"
          }`}
        aria-hidden="true"
      >
        {/* Dashed drop target while dragging Minecraft Vicky */}
        {mascot.phase === "dragging" && (
          <div
            className="fixed border border-dashed border-[#14ae5c]/70 bg-[#14ae5c]/[0.05] rounded-xs flex items-center justify-center animate-pulse"
            style={{
              left: mascot.dropX,
              top: mascot.dropY,
              width: 64,
              height: 108,
            }}
          >
            <span className="text-[8.5px] font-mono text-[#14ae5c] text-center leading-tight px-1">
              drop vicky
            </span>
          </div>
        )}
        {/* ── Subtle Figma dot-grid canvas over the real page ── */}
        <div className="fig-grid absolute inset-0" />

        {/* ── Top & Left Figma canvas rulers ─────────────────── */}
        <div className="hidden sm:flex fixed top-0 left-0 right-0 h-5 bg-[var(--fig-panel)]/85 backdrop-blur-xs border-b border-[var(--fig-border)] text-[9px] font-mono text-[var(--fig-muted)] items-center px-6 justify-between opacity-75">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="tabular-nums">
              {i * 200}
            </span>
          ))}
        </div>

        {/* ── Floating top-left file pill (below navbar slot) ── */}
        <div
          className="fixed top-[72px] left-4 z-[9994] flex items-center gap-2 rounded-lg border border-[var(--fig-border)] bg-[var(--fig-panel)]/92 backdrop-blur-md px-3 py-1.5 shadow-lg text-[11px] text-[var(--fig-text)]"
          style={{
            transform: exiting ? "translateY(-16px)" : "none",
            transition: `transform 420ms ${EASE}`,
          }}
        >
          <FigmaLogo />
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--fig-muted)] hidden sm:inline">drafts</span>
            <span className="text-[var(--fig-muted)]/60 hidden sm:inline">/</span>
            <span className="font-semibold tracking-tight">vicky.fig</span>
          </div>
        </div>

        {/* ── Floating top-right multiplayer & zoom pill ─────── */}
        <div
          className="fixed top-[72px] right-4 z-[9994] hidden sm:flex items-center gap-2.5 rounded-lg border border-[var(--fig-border)] bg-[var(--fig-panel)]/92 backdrop-blur-md px-2.5 py-1.5 shadow-lg text-[11px] text-[var(--fig-text)]"
          style={{
            transform: exiting ? "translateY(-16px)" : "none",
            transition: `transform 420ms ${EASE}`,
          }}
        >
          <div className="flex items-center gap-1">
            <Avatar letter="v" color={LEAD_COLOR} />
            <Avatar letter="l" color="#0d99ff" />
            <Avatar letter="t" color="#14ae5c" />
          </div>
          <span className="h-3 w-px bg-[var(--fig-border)]" />
          <span className="text-[10px] font-mono text-[var(--fig-muted)] tabular-nums">
            100%
          </span>
        </div>

        {/* ── Section Figma selection/wireframe frames ───────── */}
        {sections.map((s) => {
          if (s.state === "hidden" || s.state === "clear") return null
          const isDrawing = s.state === "drawing"
          return (
            <div
              key={s.id}
              className="fixed pointer-events-none"
              style={{
                top: s.rect.top - 6,
                left: s.rect.left - 8,
                width: s.rect.width + 16,
                height: s.rect.height + 12,
              }}
            >
              {/* Expanding blue Figma frame */}
              <div
                className="relative w-full h-full border-[1.5px] origin-top-left"
                style={{
                  borderColor: s.color,
                  backgroundColor: isDrawing ? `${s.color}0d` : "transparent",
                  animation: isDrawing
                    ? `fig-draw-frame 640ms ${EASE} forwards`
                    : "none",
                  transition: "background-color 280ms ease",
                }}
              >
                {/* Layer label */}
                <span
                  className="absolute -top-[18px] left-[-1px] text-[10px] font-mono font-medium flex items-center gap-1 whitespace-nowrap"
                  style={{ color: s.color }}
                >
                  <Hash className="h-2.5 w-2.5" />
                  {s.id}
                </span>

                {/* Corner resize handles */}
                <Handle color={s.color} className="-top-[4px] -left-[4px]" />
                <Handle color={s.color} className="-top-[4px] -right-[4px]" />
                <Handle color={s.color} className="-bottom-[4px] -left-[4px]" />
                <Handle color={s.color} className="-bottom-[4px] -right-[4px]" />

                {/* W × H pixel pill */}
                <span
                  className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 rounded-[3px] px-1.5 py-[1px] text-[9.5px] font-mono font-medium text-white whitespace-nowrap shadow-xs"
                  style={{ backgroundColor: s.color }}
                >
                  {Math.round(s.rect.width)} × {Math.round(s.rect.height)}
                </span>
              </div>
            </div>
          )
        })}

        {/* ── Real navbar ghost slot (dashed purple outline) ─── */}
        {navRect && !navDocked && (
          <div
            className="fixed pointer-events-none border border-dashed border-[#9747ff]/60 flex items-center justify-center transition-opacity duration-200"
            style={{
              top: navRect.top + 3,
              left: navRect.left + 3,
              width: navRect.width - 6,
              height: navRect.height - 6,
            }}
          >
            <span className="text-[10px] font-mono text-[#9747ff]/85 tracking-wide flex items-center gap-1">
              <ComponentIcon /> navbar · drop to snap
            </span>
          </div>
        )}

        {/* ── Real navbar purple component selection box ─────── */}
        {navRect && navSelected && (
          <div
            className="fixed z-[9993] pointer-events-none border-[1.5px] border-[#9747ff] fig-pop"
            style={{
              top: navRect.top,
              left: navRect.left,
              width: navRect.width,
              height: navRect.height,
              transform: `translate3d(${navOffset.x}px, ${navOffset.y}px, 0) rotate(${navOffset.rot}deg)`,
              transition:
                navOffset.dur > 0 ? `transform ${navOffset.dur}ms ${EASE}` : "none",
            }}
          >
            <span className="absolute -top-[18px] left-3 text-[10px] font-mono font-medium text-[#9747ff] flex items-center gap-1">
              <ComponentIcon /> navbar
            </span>
            <Handle color={LEAD_COLOR} className="-top-[4px] -left-[4px]" />
            <Handle color={LEAD_COLOR} className="-top-[4px] -right-[4px]" />
            <Handle color={LEAD_COLOR} className="-bottom-[4px] -left-[4px]" />
            <Handle color={LEAD_COLOR} className="-bottom-[4px] -right-[4px]" />
            <span className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#9747ff] text-white text-[10px] font-mono font-medium px-1.5 py-[1px] whitespace-nowrap shadow-xs">
              {Math.round(navRect.width)} × {Math.round(navRect.height)}
            </span>
          </div>
        )}

        {/* ── Red Figma smart-snap alignment guides ──────────── */}
        {navRect && (
          <div
            className="fixed inset-0 z-[9993] pointer-events-none transition-opacity duration-150"
            style={{ opacity: guides ? 1 : 0 }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#f24822]" />
            <div
              className="absolute left-0 right-0 h-px bg-[#f24822]/75"
              style={{ top: navRect.height }}
            />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#f24822]/60" />
            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded-[3px] bg-[#f24822] text-white text-[9.5px] font-mono font-semibold px-1.5 py-[1px]">
              0
            </span>
          </div>
        )}

        {/* ── Floating Figma UI3 bottom toolbar ──────────────── */}
        <div className="fixed bottom-5 inset-x-0 z-[9994] flex justify-center pointer-events-none">
          <div
            className="flex items-center gap-1 rounded-xl border border-[var(--fig-border)] bg-[var(--fig-panel)]/95 backdrop-blur-md px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.28)] text-[var(--fig-text)]"
            style={{
              transform: exiting ? "translateY(24px)" : "translateY(0)",
              transition: `transform 420ms ${EASE}`,
            }}
          >
            <ToolBtn active>
              <MousePointer2 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn>
              <Hash className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn className="hidden sm:flex">
              <Square className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn className="hidden sm:flex">
              <PenTool className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn>
              <Type className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn className="hidden sm:flex">
              <Hand className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn className="hidden sm:flex">
              <MessageCircle className="h-3.5 w-3.5" />
            </ToolBtn>

            <span className="mx-1 h-4 w-px bg-[var(--fig-border)]" />

            {/* Present / Close-out button */}
            <button
              ref={playRef}
              tabIndex={-1}
              className={`relative h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${playHover || playClick
                ? "bg-[#0d99ff] text-white shadow-sm"
                : "bg-[var(--fig-hover)] text-[var(--fig-text)]"
                }`}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>present</span>
              <span
                className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[#1e1e1e] text-white text-[10px] font-mono px-2 py-0.5 shadow-lg transition-opacity duration-150 ${playClick ? "opacity-100" : "opacity-0"
                  }`}
              >
                present ⌥⌘↵
              </span>
            </button>

            <button
              onClick={handleSkip}
              className="pointer-events-auto ml-1 h-8 px-2.5 rounded-lg text-[10px] font-mono text-[var(--fig-muted)] hover:text-[var(--fig-text)] hover:bg-[var(--fig-hover)] transition-colors cursor-pointer"
            >
              esc
            </button>
          </div>
        </div>

        {/* ── Live Multiplayer Cursors ───────────────────────── */}
        {cursors.map((c) => (
          <div
            key={c.id}
            className="fixed left-0 top-0 z-[9995] pointer-events-none"
            style={{
              transform: `translate3d(${c.x}px, ${c.y}px, 0)`,
              transition: `transform ${c.dur}ms ${EASE}, opacity 240ms ease`,
              opacity: c.visible && !exiting ? 1 : 0,
            }}
          >
            <div
              style={{
                transform: c.pressed ? "scale(0.86)" : "scale(1)",
                transformOrigin: "0 0",
                transition: "transform 100ms ease",
              }}
            >
              <CursorGlyph color={c.color} label={c.label} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────────
   Small Figma UI Pieces
   ────────────────────────────────────────────────────────── */

function CursorGlyph({ color, label }: { color: string; label: string }) {
  return (
    <div className="relative">
      <svg
        width="19"
        height="21"
        viewBox="0 0 20 22"
        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
      >
        <path
          d="M2 2 L17.5 9.6 L10.2 11.6 L7.3 19 Z"
          fill={color}
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute left-[14px] top-[17px] whitespace-nowrap rounded-[4px] px-1.5 py-[1.5px] text-[10.5px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    </div>
  )
}

function FigmaLogo() {
  return (
    <svg viewBox="0 0 38 57" className="h-3.5 w-auto">
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  )
}

function ComponentIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0" fill="currentColor">
      <path d="M6 0.8 L7.6 2.4 L6 4 L4.4 2.4 Z" />
      <path d="M6 8 L7.6 9.6 L6 11.2 L4.4 9.6 Z" />
      <path d="M2.4 4.4 L4 6 L2.4 7.6 L0.8 6 Z" />
      <path d="M9.6 4.4 L11.2 6 L9.6 7.6 L8 6 Z" />
    </svg>
  )
}

function ToolBtn({
  children,
  active,
  className = "",
}: {
  children: React.ReactNode
  active?: boolean
  className?: string
}) {
  return (
    <span
      className={`h-8 w-8 flex items-center justify-center rounded-lg ${active ? "bg-[#0d99ff] text-white" : "text-[var(--fig-text)]"
        } ${className}`}
    >
      {children}
    </span>
  )
}

function Avatar({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[var(--fig-panel)]"
      style={{ backgroundColor: color }}
    >
      {letter}
    </span>
  )
}

function Handle({ color, className }: { color: string; className: string }) {
  return (
    <span
      className={`absolute h-[7px] w-[7px] bg-white border-[1.5px] ${className}`}
      style={{ borderColor: color }}
    />
  )
}
