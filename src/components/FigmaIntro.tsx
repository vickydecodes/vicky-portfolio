import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  MousePointer2,
  Hash,
  Type,
  Hand,
  Play,
  Image as ImageIcon,
  Upload,
  Check,
} from "lucide-react"

/**
 * FigmaIntro — fast, multi-cursor live Figma workspace build (~2.3s total).
 *
 *  1. 10 colorful multiplayer cursors swarm in parallel to draw both sections
 *     and granular elements (headings, tags, badges, project rows, form) as
 *     the page glides down and back up to the top.
 *  2. Lead `vicky` cursor snaps the detached real navbar into place with red
 *     Figma smart-snap guides.
 *  3. `vicky` drops `vicky_mc.png` right into the hero profile slot.
 *  4. Clicks Present — all Figma overlays vanish cleanly.
 */

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface DrawNode {
  id: string
  label: string
  el: HTMLElement
  docTop: number
  left: number
  width: number
  height: number
  color: string
  isSub: boolean
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

interface AvatarUploadState {
  phase: "hidden" | "dragging" | "dropped"
  x: number
  y: number
  dropX: number
  dropY: number
  w: number
  h: number
  rot: number
  dur: number
  bouncing: boolean
}

type ActiveTool = "move" | "frame" | "present"

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"
const LEAD_COLOR = "#9747ff"

const WORKERS: { id: string; name: string; color: string }[] = [
  { id: "w0", name: "layout", color: "#0d99ff" },
  { id: "w1", name: "type", color: "#14ae5c" },
  { id: "w2", name: "grid", color: "#f24822" },
  { id: "w3", name: "ui", color: "#ff7262" },
  { id: "w4", name: "tokens", color: "#1abcfe" },
  { id: "w5", name: "icons", color: "#a259ff" },
  { id: "w6", name: "spacing", color: "#f59e0b" },
  { id: "w7", name: "motion", color: "#ec4899" },
  { id: "w8", name: "dev", color: "#10b981" },
  { id: "w9", name: "qa", color: "#6366f1" },
]

export default function FigmaIntro({ onDone }: { onDone: () => void }) {
  const playRef = useRef<HTMLButtonElement>(null)
  const framesLayerRef = useRef<HTMLDivElement>(null)
  const scrollRafRef = useRef<number>(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const [navRect, setNavRect] = useState<Rect | null>(null)
  const [navStage, setNavStage] = useState<"hidden" | "floating" | "docked">("hidden")
  const [navOffset, setNavOffset] = useState({ x: 0, y: 0, rot: 0, dur: 0 })
  const [navSelected, setNavSelected] = useState(false)
  const [guides, setGuides] = useState(false)
  const [nodes, setNodes] = useState<DrawNode[]>([])
  const [cursors, setCursors] = useState<LiveCursor[]>([])
  const [avatar, setAvatar] = useState<AvatarUploadState>({
    phase: "hidden",
    x: 0,
    y: 0,
    dropX: 0,
    dropY: 0,
    w: 52,
    h: 96,
    rot: 0,
    dur: 0,
    bouncing: false,
  })
  const [activeTool, setActiveTool] = useState<ActiveTool>("frame")
  const [playHover, setPlayHover] = useState(false)
  const [playClick, setPlayClick] = useState(false)
  const [exiting, setExiting] = useState(false)

  const touchedRef = useRef<{
    nav: HTMLElement | null
    avatar: HTMLElement | null
    els: HTMLElement[]
  }>({
    nav: null,
    avatar: null,
    els: [],
  })

  const cancelScroll = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = 0
    }
  }

  const restoreDOM = () => {
    cancelScroll()
    const { nav, avatar: avatarEl, els } = touchedRef.current
    if (nav) {
      nav.style.opacity = ""
      nav.style.transform = ""
      nav.style.transition = ""
      nav.style.boxShadow = ""
      nav.style.zIndex = ""
    }
    if (avatarEl) {
      avatarEl.style.opacity = ""
      avatarEl.style.transition = ""
    }
    for (const el of els) {
      el.style.opacity = ""
      el.style.transform = ""
      el.style.transition = ""
    }
  }

  // Keep document-space Figma selection frames glued 1:1 to real DOM during scroll
  useEffect(() => {
    const syncFrames = () => {
      if (framesLayerRef.current) {
        framesLayerRef.current.style.transform = `translate3d(0, ${-window.scrollY}px, 0)`
      }
    }
    syncFrames()
    window.addEventListener("scroll", syncFrames, { passive: true })
    return () => window.removeEventListener("scroll", syncFrames)
  }, [])

  // ── Rapid Multi-Cursor Full-Page Choreography (useLayoutEffect = zero flash) ──
  useLayoutEffect(() => {
    const timers: number[] = []
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms))

    const smoothScrollTo = (targetY: number, durationMs: number) => {
      cancelScroll()
      const startY = window.scrollY
      const delta = targetY - startY
      if (Math.abs(delta) < 2 || durationMs <= 0) {
        window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior })
        if (framesLayerRef.current) {
          framesLayerRef.current.style.transform = `translate3d(0, ${-targetY}px, 0)`
        }
        return
      }
      const startTime = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs)
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        const y = startY + delta * eased
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior })
        if (framesLayerRef.current) {
          framesLayerRef.current.style.transform = `translate3d(0, ${-y}px, 0)`
        }
        if (t < 1) {
          scrollRafRef.current = requestAnimationFrame(step)
        } else {
          scrollRafRef.current = 0
        }
      }
      scrollRafRef.current = requestAnimationFrame(step)
    }

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })

    const vw = window.innerWidth
    const vh = window.innerHeight
    const isMobile = vw < 640
    const activeWorkers = isMobile ? WORKERS.slice(0, 3) : WORKERS
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)

    const navEl = document.querySelector<HTMLElement>(
      '[data-figma-node="navbar"]',
    )
    const avatarEl = document.querySelector<HTMLElement>(
      '[data-figma-node="vicky-avatar"]',
    )

    const measuredNav: Rect | null = navEl
      ? (() => {
          const r = navEl.getBoundingClientRect()
          return { top: r.top, left: r.left, width: r.width, height: r.height }
        })()
      : null

    const measuredAvatar: Rect | null = avatarEl
      ? (() => {
          const r = avatarEl.getBoundingClientRect()
          return { top: r.top, left: r.left, width: r.width, height: r.height }
        })()
      : null

    // Collect sections + granular inner elements so 10 cursors draw rich detail simultaneously
    const secEls = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main section[data-figma-node], footer[data-figma-node]",
      ),
    )

    const rawTargets: { el: HTMLElement; label: string; isSub: boolean }[] = []
    const seen = new Set<HTMLElement>()

    secEls.forEach((sec) => {
      const name = sec.dataset.figmaNode || "frame"
      if (!seen.has(sec)) {
        seen.add(sec)
        rawTargets.push({ el: sec, label: name, isSub: false })
      }
      // On desktop, also draw inner granular elements; on mobile keep it clean with sections only
      if (!isMobile) {
        const subQuery = sec.querySelectorAll<HTMLElement>(
          "h1, h2, form, a.spotlight-row",
        )
        subQuery.forEach((sub, idx) => {
          if (seen.has(sub)) return
          seen.add(sub)
          const tag = sub.tagName.toLowerCase()
          const subLabel =
            tag === "h1"
              ? "title"
              : tag === "h2"
                ? `${name}.heading`
                : tag === "form"
                  ? "contact.form"
                  : `build.${idx + 1}`
          rawTargets.push({ el: sub, label: subLabel, isSub: true })
        })
      }
    })

    const allNodes: DrawNode[] = rawTargets
      .map((item, idx) => {
        const r = item.el.getBoundingClientRect()
        const worker = activeWorkers[idx % activeWorkers.length]
        return {
          id: `${item.label}-${idx}`,
          label: item.label,
          el: item.el,
          docTop: r.top + window.scrollY,
          left: r.left + window.scrollX,
          width: r.width,
          height: r.height,
          color: worker.color,
          isSub: item.isSub,
          state: "hidden" as const,
        }
      })
      .filter((n) => n.height > 8 && n.width > 12)

    touchedRef.current = {
      nav: navEl,
      avatar: avatarEl,
      els: allNodes.map((n) => n.el),
    }

    const dx = Math.round(Math.min(44, Math.max(14, vw * 0.03)))
    const dy = Math.round(Math.min(150, Math.max(96, vh * 0.17)))
    const rot = -1.4

    if (navEl) {
      navEl.style.transition = "none"
      navEl.style.opacity = "0"
      navEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg)`
      navEl.style.boxShadow = "0 14px 36px rgba(0, 0, 0, 0.3)"
      navEl.style.zIndex = "9992"
    }
    if (avatarEl) {
      avatarEl.style.transition = "none"
      avatarEl.style.opacity = "0"
    }
    allNodes.forEach((n) => {
      n.el.style.transition = "none"
      n.el.style.opacity = "0"
      n.el.style.transform = "scale(0.985)"
    })

    setNavRect(measuredNav)
    setNavOffset({ x: dx, y: dy, rot, dur: 0 })
    setNodes(allNodes)

    // Perimeter spawn points for all 10 worker cursors + lead `vicky`
    const spawnEdges = [
      { x: vw - 50, y: vh - 60 },
      { x: 24, y: vh * 0.18 },
      { x: vw - 36, y: vh * 0.2 },
      { x: 24, y: vh * 0.42 },
      { x: vw - 36, y: vh * 0.44 },
      { x: 24, y: vh * 0.66 },
      { x: vw - 36, y: vh * 0.68 },
      { x: vw * 0.25, y: vh - 40 },
      { x: vw * 0.72, y: vh - 40 },
      { x: vw * 0.3, y: 24 },
      { x: vw * 0.7, y: 24 },
    ]

    setCursors([
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
      ...activeWorkers.map((w, i) => ({
        id: w.id,
        label: w.name,
        color: w.color,
        x: spawnEdges[(i + 1) % spawnEdges.length].x,
        y: spawnEdges[(i + 1) % spawnEdges.length].y,
        dur: 0,
        pressed: false,
        visible: false,
      })),
    ])

    const updateCursor = (id: string, patch: Partial<LiveCursor>) => {
      setCursors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
    }

    const updateNodeState = (id: string, state: DrawNode["state"]) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, state } : n)))
    }

    // Group into just 2–3 fast viewport waves (top → mid/bottom) so users never wait
    interface Wave {
      scrollY: number
      items: DrawNode[]
    }
    const waves: Wave[] = []
    const waveScrollStops =
      maxScroll > vh * 0.9
        ? [0, Math.round(maxScroll * 0.55), maxScroll]
        : maxScroll > 80
          ? [0, maxScroll]
          : [0]

    waveScrollStops.forEach((scrollY, idx) => {
      const minDocY = idx === 0 ? -100 : scrollY - 40
      const maxDocY =
        idx === waveScrollStops.length - 1 ? Infinity : scrollY + vh - 40
      const items = allNodes.filter(
        (n) => n.docTop >= minDocY && n.docTop < maxDocY,
      )
      if (items.length > 0) {
        waves.push({ scrollY, items })
      }
    })

    // Ensure any straggler node is included in the last wave
    const assigned = new Set(waves.flatMap((w) => w.items.map((n) => n.id)))
    const missing = allNodes.filter((n) => !assigned.has(n.id))
    if (missing.length > 0 && waves.length > 0) {
      waves[waves.length - 1].items.push(...missing)
    }

    // Pre-compute each worker's final assigned node so it signs off right after finishing its last job
    const lastJobByWorker = new Map<string, string>()
    waves.forEach((wave) => {
      wave.items.forEach((node, i) => {
        const wId = activeWorkers[i % activeWorkers.length].id
        lastJobByWorker.set(wId, node.id)
      })
    })

    // 1. Crisp, readable parallel waves (10 cursors drawing simultaneously)
    let t = 80
    let prevScroll = 0

    waves.forEach((wave, waveIdx) => {
      const needsScroll = Math.abs(wave.scrollY - prevScroll) > 12
      const scrollDur = needsScroll ? 420 : 0

      if (needsScroll) {
        at(t, () => {
          setNodes((prev) =>
            prev.map((n) =>
              n.state === "placed" ? { ...n, state: "clear" } : n,
            ),
          )
          smoothScrollTo(wave.scrollY, scrollDur)
        })
        t += scrollDur + 40
        prevScroll = wave.scrollY
      }

      const moveDur = waveIdx === 0 ? 340 : 300
      const drawDur = 380
      const stagger = 52

      wave.items.forEach((node, i) => {
        const workerIdx = i % activeWorkers.length
        const wId = activeWorkers[workerIdx].id
        const vpTop = Math.max(20, Math.min(vh - 50, node.docTop - wave.scrollY))
        const vpBottom = Math.max(
          vpTop + 20,
          Math.min(vh - 28, node.docTop + node.height - wave.scrollY),
        )

        const moveAt = t + workerIdx * stagger
        at(moveAt, () => {
          updateCursor(wId, {
            visible: true,
            dur: moveDur,
            x: node.left - 2,
            y: vpTop - 2,
          })
        })

        const pressAt = moveAt + moveDur + 25
        at(pressAt, () => {
          updateCursor(wId, { pressed: true, dur: 60 })
          updateNodeState(node.id, "drawing")
        })

        const dragAt = pressAt + 45
        at(dragAt, () => {
          updateCursor(wId, {
            dur: drawDur,
            x: node.left + node.width + 2,
            y: vpBottom + 2,
          })
        })

        at(dragAt + drawDur - 50, () => {
          node.el.style.transition = `opacity 240ms ease-out, transform 260ms ${EASE}`
          node.el.style.opacity = "1"
          node.el.style.transform = "scale(1)"
        })

        at(dragAt + drawDur + 15, () => {
          updateCursor(wId, { pressed: false, dur: 80 })
          updateNodeState(node.id, "placed")
        })

        // If this was this worker's last job, glide out and disappear right away
        if (lastJobByWorker.get(wId) === node.id) {
          const edge = spawnEdges[(workerIdx + 1) % spawnEdges.length]
          at(dragAt + drawDur + 110, () => {
            updateCursor(wId, {
              dur: 320,
              x: edge.x,
              y: edge.y,
              visible: false,
            })
          })
        }
      })

      const maxSlot = Math.min(wave.items.length, activeWorkers.length) - 1
      t += maxSlot * stagger + moveDur + 25 + 45 + drawDur + 140
    })

    // 2. Smooth return to top ("first")
    const backDur = prevScroll > 20 ? 480 : 0
    at(t, () => {
      setNodes((prev) => prev.map((n) => ({ ...n, state: "clear" })))
      activeWorkers.forEach((w, i) => {
        const edge = spawnEdges[(i + 1) % spawnEdges.length]
        updateCursor(w.id, { dur: 380, x: edge.x, y: edge.y, visible: false })
      })
      if (backDur > 0) smoothScrollTo(0, backDur)
    })
    t += backDur + 80

    // 3. Lead `vicky` snaps the detached real navbar into place
    if (measuredNav && navEl) {
      const grabX = measuredNav.left + Math.min(measuredNav.width * 0.28, 340)
      const grabY = measuredNav.top + measuredNav.height / 2

      at(t, () => {
        setActiveTool("move")
        setNavStage("floating")
        navEl.style.transition = "opacity 220ms ease-out"
        navEl.style.opacity = "1"
        updateCursor("lead", {
          visible: true,
          dur: 380,
          x: grabX + dx,
          y: grabY + dy,
        })
      })

      const grabAt = t + 400
      at(grabAt, () => {
        updateCursor("lead", { pressed: true, dur: 70 })
        setNavSelected(true)
      })

      const dragNavAt = grabAt + 90
      const dragNavDur = 600
      at(dragNavAt, () => {
        navEl.style.transition = `transform ${dragNavDur}ms ${EASE}, box-shadow 220ms ease ${dragNavDur - 160}ms`
        navEl.style.transform = "translate3d(0px, 0px, 0) rotate(0deg)"
        navEl.style.boxShadow = "none"
        setNavOffset({ x: 0, y: 0, rot: 0, dur: dragNavDur })
        updateCursor("lead", { dur: dragNavDur, x: grabX, y: grabY })
      })

      at(dragNavAt + dragNavDur * 0.55, () => setGuides(true))

      const dropNavAt = dragNavAt + dragNavDur + 20
      at(dropNavAt, () => {
        updateCursor("lead", { pressed: false, dur: 80 })
        setNavStage("docked")
      })

      t = dropNavAt + 170
    }

    // 4. Drop `vicky_mc.png` onto the canvas (bottom-right mascot area)
    const dropX = measuredAvatar ? measuredAvatar.left : Math.max(24, vw - 132)
    const dropY = measuredAvatar ? measuredAvatar.top : Math.max(140, vh - 136)
    const dropW = measuredAvatar ? Math.round(measuredAvatar.width) : 56
    const dropH = measuredAvatar ? Math.round(measuredAvatar.height) : 96
    const startX = vw + 20
    const startY = Math.max(84, dropY - 40)

    at(t, () => {
      setGuides(false)
      setNavSelected(false)
      updateCursor("lead", {
        visible: true,
        dur: 320,
        x: vw - 12,
        y: startY + dropH / 2,
      })
    })

    const grabAssetAt = t + 340
    at(grabAssetAt, () => {
      updateCursor("lead", { pressed: true, dur: 60 })
      setAvatar({
        phase: "dragging",
        x: startX,
        y: startY,
        dropX,
        dropY,
        w: dropW,
        h: dropH,
        rot: -5,
        dur: 0,
        bouncing: false,
      })
    })

    const dragAssetAt = grabAssetAt + 55
    const uploadDur = 520
    at(dragAssetAt, () => {
      setAvatar((a) => ({
        ...a,
        x: dropX,
        y: dropY,
        rot: 0,
        dur: uploadDur,
      }))
      updateCursor("lead", {
        dur: uploadDur,
        x: dropX + dropW / 2,
        y: dropY + dropH / 2,
      })
    })

    const dropAssetAt = dragAssetAt + uploadDur + 15
    at(dropAssetAt, () => {
      updateCursor("lead", { pressed: false, dur: 80 })
      setAvatar((a) => ({ ...a, phase: "dropped", bouncing: true }))
      if (avatarEl) {
        avatarEl.style.transition = "opacity 120ms ease"
        avatarEl.style.opacity = "1"
      }
    })

    at(dropAssetAt + 240, () => {
      setAvatar((a) => ({ ...a, bouncing: false }))
    })

    // 5. Click Present ▶ and dissolve into live site
    const toPlayAt = dropAssetAt + 240
    at(toPlayAt, () => {
      if (playRef.current) {
        const p = playRef.current.getBoundingClientRect()
        updateCursor("lead", {
          dur: 360,
          x: p.left + p.width / 2 - 2,
          y: p.top + p.height / 2 - 2,
        })
      }
    })

    at(toPlayAt + 330, () => {
      setPlayHover(true)
      setActiveTool("present")
    })

    const clickPlayAt = toPlayAt + 410
    at(clickPlayAt, () => {
      setPlayClick(true)
      updateCursor("lead", { pressed: true, dur: 70 })
    })

    at(clickPlayAt + 120, () => {
      updateCursor("lead", { pressed: false, visible: false, dur: 180 })
      setExiting(true)
    })

    at(clickPlayAt + 460, () => {
      restoreDOM()
      doneRef.current()
    })

    return () => {
      timers.forEach(clearTimeout)
      restoreDOM()
    }
  }, [])

  // ── Block user wheel/touch scroll during auto-scroll + Esc to skip ──
  useEffect(() => {
    const preventUserScroll = (e: Event) => {
      e.preventDefault()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        restoreDOM()
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
        doneRef.current()
      }
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "PageDown" ||
        e.key === "PageUp" ||
        e.key === " "
      ) {
        e.preventDefault()
      }
    }
    window.addEventListener("wheel", preventUserScroll, { passive: false })
    window.addEventListener("touchmove", preventUserScroll, { passive: false })
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("wheel", preventUserScroll)
      window.removeEventListener("touchmove", preventUserScroll)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  const handleSkip = () => {
    restoreDOM()
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    doneRef.current()
  }

  return (
    <div
      className={`fig-intro fixed inset-0 z-[9990] pointer-events-none overflow-hidden font-sans select-none transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* ── Quiet Figma dot-grid over the real page ────────── */}
      <div className="fig-grid absolute inset-0 opacity-65" />

      {/* ── Subtle top canvas ruler ────────────────────────── */}
      <div className="hidden sm:flex fixed top-0 left-0 right-0 h-5 bg-[var(--fig-panel)]/75 backdrop-blur-xs border-b border-[var(--fig-border)]/70 text-[9px] font-mono text-[var(--fig-muted)] items-center px-6 justify-between opacity-65">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="tabular-nums">
            {i * 200}
          </span>
        ))}
      </div>

      {/* ── Minimal floating top-left file pill ────────────── */}
      <div
        className="fixed top-[72px] left-4 z-[9994] flex items-center gap-2 rounded-lg border border-[var(--fig-border)] bg-[var(--fig-panel)]/90 backdrop-blur-md px-3 py-1.5 shadow-md text-[11px] text-[var(--fig-text)]"
        style={{
          transform: exiting ? "translateY(-14px)" : "none",
          transition: `transform 280ms ${EASE}`,
        }}
      >
        <FigmaLogo />
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--fig-muted)] hidden sm:inline">drafts</span>
          <span className="text-[var(--fig-muted)]/60 hidden sm:inline">/</span>
          <span className="font-semibold tracking-tight">vicky.fig</span>
        </div>
      </div>

      {/* ── Document-space Figma Element Frames (scroll-synced at 60fps) ── */}
      <div
        ref={framesLayerRef}
        className="fixed top-0 left-0 w-full pointer-events-none will-change-transform"
      >
        {nodes.map((n) => {
          if (n.state === "hidden" || n.state === "clear") return null
          const isDrawing = n.state === "drawing"
          const padX = n.isSub ? 3 : 8
          const padY = n.isSub ? 2 : 6
          return (
            <div
              key={n.id}
              className="absolute pointer-events-none"
              style={{
                top: n.docTop - padY,
                left: n.left - padX,
                width: n.width + padX * 2,
                height: n.height + padY * 2,
              }}
            >
              <div
                className="relative w-full h-full border origin-top-left"
                style={{
                  borderColor: n.color,
                  backgroundColor: isDrawing ? `${n.color}0d` : "transparent",
                  animation: isDrawing
                    ? `fig-draw-frame 380ms ${EASE} forwards`
                    : "none",
                  transition: "background-color 180ms ease",
                }}
              >
                <span
                  className="absolute -top-[16px] left-[-1px] text-[9.5px] font-mono font-medium flex items-center gap-1 whitespace-nowrap"
                  style={{ color: n.color }}
                >
                  <Hash className="h-2.5 w-2.5" />
                  {n.label}
                </span>

                <Handle color={n.color} className="-top-[3px] -left-[3px]" />
                <Handle color={n.color} className="-top-[3px] -right-[3px]" />
                <Handle color={n.color} className="-bottom-[3px] -left-[3px]" />
                <Handle color={n.color} className="-bottom-[3px] -right-[3px]" />

                {!n.isSub && (
                  <span
                    className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 rounded-[3px] px-1.5 py-[1px] text-[9px] font-mono font-medium text-white whitespace-nowrap"
                    style={{ backgroundColor: n.color }}
                  >
                    {Math.round(n.width)} × {Math.round(n.height)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Dashed drop target right at the hero profile slot ── */}
      {avatar.phase === "dragging" && (
        <div
          className="fixed border border-dashed border-[#14ae5c]/75 bg-[#14ae5c]/[0.05] rounded-xs flex items-center justify-center animate-pulse"
          style={{
            left: avatar.dropX - 4,
            top: avatar.dropY - 4,
            width: avatar.w + 8,
            height: avatar.h + 8,
          }}
        >
          <span className="text-[8px] font-mono text-[#14ae5c] text-center leading-tight">
            vicky
          </span>
        </div>
      )}

      {/* ── Dragged `vicky_mc.png` snapping into the hero profile slot ── */}
      {avatar.phase !== "hidden" && (
        <div
          className="fixed top-0 left-0 z-[9994] pointer-events-none select-none"
          style={{
            transform: `translate3d(${avatar.x}px, ${avatar.y}px, 0) rotate(${avatar.rot}deg)`,
            transition:
              avatar.dur > 0 ? `transform ${avatar.dur}ms ${EASE}` : "none",
          }}
        >
          <div
            className={`relative flex items-end justify-center px-1 transition-transform duration-150 ${
              avatar.bouncing ? "scale-y-[0.82] scale-x-[1.16]" : ""
            }`}
            style={{ width: avatar.w, height: avatar.h }}
          >
            {/* Keep image visible in bottom-right drop if there is no hero avatar slot */}
            {(avatar.phase === "dragging" || !touchedRef.current.avatar) && (
              <img
                src="/assets/minecraft_me.png"
                alt="vicky"
                className="w-[46px] sm:w-[52px] h-auto select-none pointer-events-none"
                style={{ imageRendering: "pixelated" }}
              />
            )}

            <div className="absolute -inset-1 border border-[#14ae5c]">
              <span className="absolute -top-[16px] left-[-1px] text-[9.5px] font-mono font-medium text-[#14ae5c] flex items-center gap-1 whitespace-nowrap">
                <ImageIcon className="h-2.5 w-2.5" />
                vicky_mc.png
              </span>
              <Handle color="#14ae5c" className="-top-[3px] -left-[3px]" />
              <Handle color="#14ae5c" className="-top-[3px] -right-[3px]" />
              <Handle color="#14ae5c" className="-bottom-[3px] -left-[3px]" />
              <Handle color="#14ae5c" className="-bottom-[3px] -right-[3px]" />
              <span className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#14ae5c] text-white text-[9px] font-mono font-medium px-1.5 py-[1px] whitespace-nowrap flex items-center gap-1">
                {avatar.phase === "dragging" ? (
                  <>
                    <Upload className="h-2.5 w-2.5" />
                    uploading…
                  </>
                ) : (
                  <>
                    <Check className="h-2.5 w-2.5" />
                    {avatar.w} × {avatar.h}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Real navbar ghost slot ─────────────────────────── */}
      {navRect && navStage === "floating" && (
        <div
          className="fixed pointer-events-none border border-dashed border-[#9747ff]/55 flex items-center justify-center transition-opacity duration-150"
          style={{
            top: navRect.top + 3,
            left: navRect.left + 3,
            width: navRect.width - 6,
            height: navRect.height - 6,
          }}
        >
          <span className="text-[10px] font-mono text-[#9747ff]/80 tracking-wide flex items-center gap-1">
            <ComponentIcon /> navbar
          </span>
        </div>
      )}

      {/* ── Real navbar purple component selection box ─────── */}
      {navRect && navSelected && (
        <div
          className="fixed z-[9993] pointer-events-none border border-[#9747ff] fig-pop"
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
          <span className="absolute -top-[17px] left-3 text-[10px] font-mono font-medium text-[#9747ff] flex items-center gap-1">
            <ComponentIcon /> navbar
          </span>
          <Handle color={LEAD_COLOR} className="-top-[3px] -left-[3px]" />
          <Handle color={LEAD_COLOR} className="-top-[3px] -right-[3px]" />
          <Handle color={LEAD_COLOR} className="-bottom-[3px] -left-[3px]" />
          <Handle color={LEAD_COLOR} className="-bottom-[3px] -right-[3px]" />
          <span className="absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#9747ff] text-white text-[9.5px] font-mono font-medium px-1.5 py-[1px] whitespace-nowrap">
            {Math.round(navRect.width)} × {Math.round(navRect.height)}
          </span>
        </div>
      )}

      {/* ── Red Figma smart-snap alignment guides ──────────── */}
      {navRect && (
        <div
          className="fixed inset-0 z-[9993] pointer-events-none transition-opacity duration-120"
          style={{ opacity: guides ? 1 : 0 }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-[#f24822]" />
          <div
            className="absolute left-0 right-0 h-px bg-[#f24822]/70"
            style={{ top: navRect.height }}
          />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#f24822]/55" />
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded-[3px] bg-[#f24822] text-white text-[9px] font-mono font-semibold px-1.5 py-[1px]">
            0
          </span>
        </div>
      )}

      {/* ── Minimal Floating Figma UI3 bottom toolbar ──────── */}
      <div className="fixed bottom-5 inset-x-0 z-[9994] flex justify-center pointer-events-none">
        <div
          className="flex items-center gap-1 rounded-xl border border-[var(--fig-border)] bg-[var(--fig-panel)]/95 backdrop-blur-md px-2 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.24)] text-[var(--fig-text)]"
          style={{
            transform: exiting ? "translateY(20px)" : "translateY(0)",
            transition: `transform 280ms ${EASE}`,
          }}
        >
          <ToolBtn active={activeTool === "move"}>
            <MousePointer2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={activeTool === "frame"}>
            <Hash className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn>
            <Type className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn className="hidden sm:flex">
            <Hand className="h-3.5 w-3.5" />
          </ToolBtn>

          <span className="mx-1 h-4 w-px bg-[var(--fig-border)]" />

          <button
            ref={playRef}
            tabIndex={-1}
            className={`relative h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
              playHover || playClick || activeTool === "present"
                ? "bg-[#0d99ff] text-white shadow-sm"
                : "bg-[var(--fig-hover)] text-[var(--fig-text)]"
            }`}
          >
            <Play className="h-3 w-3 fill-current" />
            <span>present</span>
            <span
              className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[#1e1e1e] text-white text-[10px] font-mono px-2 py-0.5 shadow-lg transition-opacity duration-120 ${
                playClick ? "opacity-100" : "opacity-0"
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

      {/* ── Live Multiplayer Cursors (10 workers + lead `vicky`) ── */}
      {cursors.map((c) => (
        <div
          key={c.id}
          className="fixed left-0 top-0 z-[9995] pointer-events-none"
          style={{
            transform: `translate3d(${c.x}px, ${c.y}px, 0)`,
            transition: `transform ${c.dur}ms ${EASE}, opacity 160ms ease`,
            opacity: c.visible && !exiting ? 1 : 0,
          }}
        >
          <div
            style={{
              transform: c.pressed ? "scale(0.86)" : "scale(1)",
              transformOrigin: "0 0",
              transition: "transform 80ms ease",
            }}
          >
            <CursorGlyph color={c.color} label={c.label} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Small Figma UI Pieces
   ────────────────────────────────────────────────────────── */

function CursorGlyph({ color, label }: { color: string; label: string }) {
  return (
    <div className="relative">
      <svg
        width="17"
        height="19"
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
        className="absolute left-[13px] top-[15px] whitespace-nowrap rounded-[4px] px-1.5 py-[1px] text-[10px] font-semibold text-white shadow-sm"
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
      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors duration-150 ${
        active ? "bg-[#0d99ff] text-white" : "text-[var(--fig-text)]"
      } ${className}`}
    >
      {children}
    </span>
  )
}

function Handle({ color, className }: { color: string; className: string }) {
  return (
    <span
      className={`absolute h-[5.5px] w-[5.5px] bg-white border ${className}`}
      style={{ borderColor: color }}
    />
  )
}
