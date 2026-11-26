import { useState, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom"
import { Sun, Moon, Menu, X, Volume2, VolumeX } from "lucide-react"
import { useTheme } from "src/components/ThemeProvider"
import { useChatStore } from "src/store/useChatStore"
import AssistantTerminal from "src/components/AssistantTerminal"
import MascotAssistant from "src/components/MascotAssistant"
import CustomCursor from "src/components/CustomCursor"
import BootScreen from "src/components/BootScreen"
import FigmaIntro from "src/components/FigmaIntro"
import FigmaInspect from "src/components/FigmaInspect"
import {
  isSoundMuted,
  setSoundMuted,
  playTick,
  playThemeRipple,
} from "src/lib/sound"
import Home from "src/pages/Home"
import Projects from "src/pages/Projects"
import Play from "src/pages/Play"

import { socialprofils } from "src/lib/data"

export default function App() {
  const { theme, setTheme } = useTheme()

  // Scroll + menu + sound states
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [muted, setMuted] = useState(() => isSoundMuted())
  const progressBarRef = useRef<HTMLDivElement>(null)
  const themeBtnRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const handleToggleSound = () => {
    const next = !muted
    setMuted(next)
    setSoundMuted(next)
    if (!next) playTick()
  }

  // Bootup + Figma designer-POV intro (plays once per session on /, replayable via double-tap on mascot or footer)
  const [introStage, setIntroStage] = useState<"idle" | "boot" | "figma">(() => {
    if (typeof window === "undefined") return "idle"
    if (window.location.pathname !== "/") return "idle"
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "idle"
    return sessionStorage.getItem("vicky_figma_intro_seen") ? "idle" : "boot"
  })

  const showIntro = introStage !== "idle"

  const handleBootDone = () => {
    setIntroStage("figma")
  }

  const handleIntroDone = () => {
    sessionStorage.setItem("vicky_figma_intro_seen", "1")
    setIntroStage("idle")
  }

  const replayIntro = () => {
    if (location.pathname !== "/") {
      navigate("/")
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
        setIntroStage("boot")
      }, 60)
      return
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    setIntroStage("boot")
  }

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
      if (!isScrolled && window.innerWidth >= 640) {
        setMenuOpen(false) // auto-close only on desktop when back at top
      }
      if (progressBarRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        progressBarRef.current.style.transform = `scaleX(${ratio})`
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close menu and scroll to top on route change
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Zustand global chat state
  const { isChatOpen, setChatOpen, isMascotDismissed, setMascotDismissed } = useChatStore()

  // Lock background page scroll while full-screen chat palette is open
  useEffect(() => {
    if (!isChatOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isChatOpen])

  const toggleThemeWithRipple = (sourceEl?: HTMLElement | null) => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    playThemeRipple(nextTheme === "dark")
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => {
        ready: Promise<void>
        finished: Promise<void>
      }
    }

    if (!doc.startViewTransition || prefersReduced) {
      setTheme(nextTheme)
      return
    }

    const rect = sourceEl?.getBoundingClientRect()
    const x = Math.round(rect ? rect.left + rect.width / 2 : window.innerWidth - 48)
    const y = Math.round(rect ? rect.top + rect.height / 2 : 32)
    const maxRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      ),
    )

    // Freeze all CSS transitions & heavy SVG/blur layers during the 380ms GPU snapshot
    const root = document.documentElement
    root.classList.add("theme-transitioning")

    const transition = doc.startViewTransition(() => {
      root.classList.remove("light", "dark")
      root.classList.add(nextTheme)
      flushSync(() => setTheme(nextTheme))
    })

    transition.ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 380,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })

    transition.finished.finally(() => {
      root.classList.remove("theme-transitioning")
    })
  }

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithRipple(e.currentTarget)
  }

  // Global keyboard shortcuts: ⌘K (palette), T (theme), H (home), P (projects), R (replay intro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setChatOpen(!isChatOpen)
        return
      }
      if (e.key === "Escape") {
        setChatOpen(false)
        return
      }

      // Skip single-key shortcuts while typing, during intro, or with modifiers
      if (isChatOpen || showIntro || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }

      const key = e.key.toLowerCase()
      if (key === "t") {
        e.preventDefault()
        toggleThemeWithRipple(themeBtnRef.current)
      } else if (key === "h") {
        e.preventDefault()
        navigate("/")
      } else if (key === "p") {
        e.preventDefault()
        navigate("/projects")
      } else if (key === "r") {
        e.preventDefault()
        replayIntro()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-colors duration-200 relative pb-16 ${introStage === "boot" ? "boot-mask" : ""
        }`}
    >
      <div className="linear-ambient pointer-events-none fixed inset-x-0 top-0 h-[420px] z-0" />
      <div className="linear-grain pointer-events-none fixed inset-0 z-[1]" />
      <CustomCursor />
      <FigmaInspect disabled={showIntro || isChatOpen} />
      {introStage === "boot" && <BootScreen onDone={handleBootDone} />}
      {introStage === "figma" && <FigmaIntro onDone={handleIntroDone} />}

      {/* ── Nav wrapper: Linear-style frosted glass hairline bar ── */}
      <div
        data-figma-node="navbar"
        className={`z-45 fixed top-0 left-0 right-0 w-full transition-all duration-300 ease-in-out border-b ${scrolled
          ? "bg-background/80 backdrop-blur-md border-border/70"
          : "bg-background/70 backdrop-blur-md border-border/50"
          }`}
      >
        {/* ── Primary bar ── */}
        <div
          className="mx-auto max-w-2xl px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between select-none font-sans text-[13px] tracking-[-0.01em] transition-all duration-300 relative"
        >

          {/* LEFT: vicky (scrolled) ↔ nav links (at top) */}
          <div className="relative flex items-center min-w-[160px]">

            {/* Nav links — fade + slide up out on scroll */}
            <div
              className={`flex items-center gap-5 transition-all duration-300 ease-in-out ${scrolled
                ? "opacity-0 -translate-y-3 pointer-events-none absolute"
                : "opacity-100 translate-y-0"
                }`}
            >
              <NavLink to="/" className={({ isActive }) => `transition-colors duration-150 ${isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>home</NavLink>
              <NavLink to="/projects" className={({ isActive }) => `transition-colors duration-150 ${isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>projects</NavLink>
            </div>

            {/* vicky ~ — italic Linear display touch */}
            <span
              className={`italic font-medium font-sans text-[15px] tracking-[-0.02em] text-foreground transition-all duration-300 ease-in-out whitespace-nowrap ${scrolled
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3 absolute pointer-events-none"
                }`}
            >
              vicky <span className="not-italic inline-block animate-tilde-wave origin-center text-muted-foreground">~</span>
            </span>
          </div>

          {/* RIGHT: ⌘K command hint + sound toggle + theme toggle + menu toggle */}
          <div className="flex items-center gap-1.5 transition-all">
            <button
              onClick={() => {
                playTick()
                setChatOpen(true)
              }}
              aria-label="open command palette"
              className="hidden sm:inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border/70 bg-foreground/[0.025] hover:bg-foreground/[0.05] hover:border-foreground/20 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97] cursor-pointer"
              title="ask vicky (ctrl+k)"
            >
              <span className="text-[10px]">⌘</span>
              <span>k</span>
            </button>
            <button
              onClick={handleToggleSound}
              aria-label={muted ? "unmute ui sounds" : "mute ui sounds"}
              title={muted ? "unmute sounds" : "mute sounds"}
              className="p-1.5 rounded-md border border-transparent hover:border-border/70 hover:bg-foreground/[0.04] text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-[0.96] cursor-pointer"
            >
              {muted ? (
                <VolumeX className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              ref={themeBtnRef}
              onClick={handleToggleTheme}
              aria-label="toggle theme"
              title="toggle theme (t)"
              className="p-1.5 rounded-md border border-transparent hover:border-border/70 hover:bg-foreground/[0.04] text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-[0.96] cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>
            {scrolled && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="toggle menu"
                className="p-1.5 rounded-md border border-transparent hover:border-border/70 hover:bg-foreground/[0.04] text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                {menuOpen ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Menu className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>

          {/* ── Floating Popover Menu — only when scrolled and open ── */}
          {scrolled && menuOpen && (
            <div className="absolute top-[calc(100%+8px)] right-6 w-36 bg-popover/95 backdrop-blur-md border border-border/80 rounded-lg shadow-xl z-50 p-1.5 select-none font-sans text-[13px] lowercase transition-all animate-in fade-in slide-in-from-top-1.5 duration-200">
              <div className="flex flex-col gap-0.5">
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `px-2.5 py-1.5 rounded-md transition-colors hover:bg-foreground/[0.05] ${isActive ? "text-foreground font-medium bg-foreground/[0.04]" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  home
                </NavLink>

                <NavLink
                  to="/projects"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `px-2.5 py-1.5 rounded-md transition-colors hover:bg-foreground/[0.05] ${isActive ? "text-foreground font-medium bg-foreground/[0.04]" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  projects
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* 1px Linear scroll progress thread along the bottom of the navbar */}
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full w-full origin-left bg-gradient-to-r from-foreground/15 via-foreground/45 to-foreground/80"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

      {/* Offset so content doesn't hide under fixed nav */}
      <div className="relative z-10 mx-auto max-w-2xl py-5 px-5 sm:px-6 text-[15px] md:text-[16px] leading-[1.72] lowercase font-sans pt-20 sm:pt-28">
        {/* View Routes wrapper */}
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/play" element={<Play />} />
          </Routes>
        </main>

        <footer className="mt-20 pt-8 border-t border-border/10 font-mono text-xs text-slate-500 lowercase select-none flex flex-col items-center gap-2.5">
          <div className="flex items-center justify-center gap-2">
            <span>"talk is cheap. show me the code."</span>

          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <a href={socialprofils.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">github</a>
            <span className="text-border/20">/</span>
            <a href={socialprofils.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">linkedin</a>
            <span className="text-border/20">/</span>
            <a href={socialprofils.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">x</a>
            <span className="text-border/20">/</span>
            <a href={socialprofils.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">instagram</a>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 text-[10px] text-muted-foreground/60 pt-1">
            <span><kbd className="px-1 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-foreground/75">t</kbd> theme</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-foreground/75">h</kbd> home</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-foreground/75">p</kbd> projects</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-foreground/75">r</kbd> replay</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-foreground/75">⌘k</kbd> ask</span>
            <span>·</span>
            <span><kbd className="px-1 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-foreground/75">alt</kbd> inspect</span>
          </div>
          {location.pathname === "/" && (
            <button
              onClick={replayIntro}
              className="mt-1 text-[10px] text-muted-foreground/70 hover:text-primary hover:underline transition-all cursor-pointer font-mono select-none"
            >
              [replay designer intro]
            </button>
          )}
          {isMascotDismissed && (
            <button
              onClick={() => setMascotDismissed(false)}
              className="mt-2.5 text-[10px] text-primary/80 hover:text-primary hover:underline transition-all cursor-pointer font-mono select-none"
            >
              [summon assistant clone 👾]
            </button>
          )}
        </footer>
      </div>

      {/* Floating Vickify Native AI Chatbox / Steve Mascot Trigger */}
      {!showIntro && !isChatOpen && <MascotAssistant onReplayIntro={replayIntro} />}

      {isChatOpen && (
        <div className="fixed inset-0 z-[60] w-screen h-dvh bg-background flex flex-col font-sans text-xs animate-in fade-in duration-200">
          <AssistantTerminal variant="palette" onClose={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  )
}
