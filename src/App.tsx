import { useState, useEffect } from "react"
import { Routes, Route, NavLink, useLocation } from "react-router-dom"
import { Sun, Moon, Menu, X } from "lucide-react"
import { useTheme } from "src/components/ThemeProvider"
import { useChatStore } from "src/store/useChatStore"
import AssistantTerminal from "src/components/AssistantTerminal"
import MascotAssistant from "src/components/MascotAssistant"
import CustomCursor from "src/components/CustomCursor"
import Home from "src/pages/Home"
import Projects from "src/pages/Projects"
import Blog from "src/pages/Blog"
import BlogPost from "src/pages/BlogPost"
import Play from "src/pages/Play"

import { socialprofils } from "src/lib/data"

export default function App() {
  const { theme, setTheme } = useTheme()

  // Scroll + menu states
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
      if (!isScrolled && window.innerWidth >= 640) {
        setMenuOpen(false) // auto-close only on desktop when back at top
      }
    }
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

  // Global Ctrl+K / Cmd+K / Esc listener for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setChatOpen(!isChatOpen)
      }
      if (e.key === "Escape") {
        setChatOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isChatOpen, setChatOpen])

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 relative pb-12">
      <CustomCursor />

      {/* ── Nav wrapper: always fixed, no relative/fixed switching layout jumps ── */}
      <div
        className={`z-45 fixed top-0 left-0 right-0 w-full transition-all duration-300 ease-in-out border-b ${
          scrolled
            ? "bg-background/95 backdrop-blur-sm border-border/15"
            : "bg-background border-border/10"
        }`}
      >
        {/* ── Primary bar ── */}
        <div
          className={`mx-auto max-w-2xl px-6 py-5 flex items-center justify-between select-none font-mono text-xs md:text-[13px] transition-all duration-300 relative ${
            scrolled ? "py-5" : "py-5"
          }`}
        >

          {/* LEFT: vicky (scrolled) ↔ nav links (at top) */}
          <div className="relative flex items-center min-w-[160px]">

            {/* Nav links — fade + slide up out on scroll */}
            <div
              className={`flex items-center gap-4 transition-all duration-300 ease-in-out ${
                scrolled
                  ? "opacity-0 -translate-y-3 pointer-events-none absolute"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <NavLink to="/" className={({ isActive }) => `hover:text-primary transition-colors ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>home</NavLink>
              <span className="text-border/30">/</span>
              <NavLink to="/projects" className={({ isActive }) => `hover:text-primary transition-colors ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>projects</NavLink>
              <span className="text-border/30">/</span>
              <NavLink to="/blog" className={({ isActive }) => `hover:text-primary transition-colors ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>blog</NavLink>
            </div>

            {/* vicky ~ — same style as hero h1, fades + slides up into navbar */}
            <span
              className={`font-bold italic font-mono text-lg tracking-tight text-foreground transition-all duration-300 ease-in-out whitespace-nowrap ${
                scrolled
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 absolute pointer-events-none"
              }`}
            >
              vicky <span className="inline-block animate-tilde-wave origin-center">~</span>
            </span>
          </div>

          {/* RIGHT: theme toggle (always) + menu toggle (scrolled) */}
         <div className="flex items-center gap-2 transition-all">


  <button
    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    aria-label="toggle theme"
    className="p-1.5 rounded-sm bg-card/40 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300 cursor-pointer"
  >
    {theme === "dark" ? (
      <Sun className="h-3.5 w-3.5" />
    ) : (
      <Moon className="h-3.5 w-3.5" />
    )}
  </button>  {scrolled && (
    <button
      onClick={() => setMenuOpen((o) => !o)}
      aria-label="toggle menu"
      className="p-1.5 rounded-sm  text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300 cursor-pointer"
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
            <div className="absolute top-[calc(100%+8px)] right-6 w-40 bg-background/98 border border-border/15 rounded-sm shadow-xl z-50 p-2.5 select-none font-mono text-sm lowercase transition-all animate-in fade-in slide-in-from-top-1.5 duration-200">
              <div className="flex flex-col gap-1">
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `px-2 py-1.5 rounded-xs transition-colors hover:bg-secondary/40  ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  home
                </NavLink>

                <NavLink
                  to="/projects"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `px-2 py-1.5 rounded-xs transition-colors hover:bg-secondary/40  ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  projects
                </NavLink>

                <NavLink
                  to="/blog"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `px-2 py-1.5 rounded-xs transition-colors hover:bg-secondary/40  ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  blog
                </NavLink>

                {/* <NavLink
                  to="/play"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `px-2 py-1.5 rounded-xs transition-colors hover:bg-secondary/40 italic ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  play clicker
                </NavLink> */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offset so content doesn't hide under fixed nav */}
      <div className="mx-auto max-w-2xl py-5 px-6 text-[15px] md:text-[16.5px] leading-relaxed tracking-tight lowercase font-sans pt-24 sm:pt-28">
        {/* View Routes wrapper */}
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
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
            <a href={socialprofils.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">twitter</a>
            <span className="text-border/20">/</span>
            <a href={socialprofils.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">instagram</a>
          </div>
          {isMascotDismissed && (
            <button
              onClick={() => setMascotDismissed(false)}
              className="mt-2.5 text-[10px] text-primary/80 hover:text-primary hover:underline transition-all cursor-pointer font-mono select-none"
            >
              [summon assistant clone 👾]
            </button>
          )}
        </footer>



{/* Floating Vickify Native AI Chatbox / Steve Mascot Trigger */}
<MascotAssistant />

{isChatOpen && (
  <div className="fixed inset-0 z-50 w-screen h-dvh bg-background flex flex-col font-sans text-xs animate-in fade-in duration-200">
    <AssistantTerminal variant="palette" onClose={() => setChatOpen(false)} />
  </div>
)}

      </div>
    </div>
  )
}
