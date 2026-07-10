import { useState, useEffect, useRef } from "react"
import { Routes, Route, NavLink, useLocation } from "react-router-dom"
import { Sun, Moon, Send, Menu, X } from "lucide-react"
import { useTheme } from "src/components/ThemeProvider"
import Home from "src/pages/Home"
import Projects from "src/pages/Projects"
import Blog from "src/pages/Blog"
import BlogPost from "src/pages/BlogPost"
import Play from "src/pages/Play"

import {
  meta,
  dataabout,
  dataportfolio,
  worktimeline,
  skills as skillsData,
  beyondProfession,
  contactConfig,
  socialprofils
} from "src/lib/data"

interface ChatMessage {
  sender: "user" | "ai"
  text: string
  isError?: boolean
}

// Client-side markdown tokenizer for bold (**text**), inline code (`code`), and bullet lists (- item)
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n")
  return lines.map((line, idx) => {
    let trimmed = line.trim()
    if (!trimmed) return <div key={idx} className="h-1.5" />

    // Check for bullet list item
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ")
    if (isBullet) {
      trimmed = trimmed.substring(2)
    }

    // Split text by bold blocks and inline code blocks
    const regex = /(\*\*.*?\*\*|`.*?`)/g
    const tokens = trimmed.split(regex)

    const renderedLine = tokens.map((token, tIdx) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={tIdx} className="font-bold text-foreground">{token.slice(2, -2)}</strong>
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={tIdx} className="font-mono bg-secondary/85 text-primary text-[10px] px-1 py-0.5 rounded-sm">
            {token.slice(1, -1)}
          </code>
        )
      }
      return token
    })

    if (isBullet) {
      return (
        <li key={idx} className="ml-4 list-disc pl-0.5 text-xs text-foreground/90 my-0.5">
          {renderedLine}
        </li>
      )
    }

    return (
      <p key={idx} className="text-xs text-foreground/90 leading-relaxed my-0.5">
        {renderedLine}
      </p>
    )
  })
}

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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // AI Chatbox states
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || ""
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isTyping])

  useEffect(() => {
    const statusText = apiKey 
      ? "hello, i'm vicky's assistant. ask me anything about his skills, experience, or projects. [openrouter online]" 
      : "hello, i'm vicky's assistant. ask me anything. [offline search online]"
    setChatMessages([{ sender: "ai", text: statusText }])
  }, [apiKey])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userText = chatInput.trim()
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }])
    setChatInput("")
    setIsTyping(true)
    setIsChatOpen(true)

    if (apiKey) {
      try {
        const systemPrompt = `
          you are vicky's native portfolio assistant. here is vicky's portfolio data:
          ${JSON.stringify({
            name: "vicky",
            github: "vickydecodes",
            description: meta.description,
            aboutme: dataabout.aboutme,
            skills: skillsData,
            experience: worktimeline,
            projects: dataportfolio,
            interests: beyondProfession,
            contact: contactConfig
          })}

          answer the user's questions accurately and concisely based on this data. keep your responses short, lowercase, and matching the minimal aesthetic. do not use markdown headings or list markers.
        `

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "vicky portfolio",
            },
            body: JSON.stringify({
              model: "meta-llama/llama-3.1-8b-instruct",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userText
                }
              ]
            })
          }
        )

        if (!response.ok) {
          throw new Error(`Upstream returned status ${response.status}`)
        }

        const data = await response.json()
        const aiText = data.choices?.[0]?.message?.content || "sorry, i encountered an issue loading response content."
        setChatMessages((prev) => [...prev, { sender: "ai", text: aiText.trim().toLowerCase() }])
      } catch (error) {
        console.error("OpenRouter API Error:", error)
        setChatMessages((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: "// error: connection failed. let's connect directly at hello@vickify.in.", 
            isError: true 
          }
        ])
      } finally {
        setIsTyping(false)
      }
    } else {
      // Simulate local AI response delay
      setTimeout(() => {
        const query = userText.toLowerCase()
        let aiResponse = ""

        if (query.includes("project") || query.includes("build") || query.includes("work") || query.includes("portfolio")) {
          aiResponse = "vicky built several products, including cookie inc., vickify, and developer tools. you can find them in the builds tab!"
        } else if (query.includes("skill") || query.includes("tech") || query.includes("stack") || query.includes("language") || query.includes("code")) {
          aiResponse = "vicky works across the full stack. his skills include react, typescript, node.js, rust, python, postgresql, docker, and cloud systems."
        } else if (query.includes("experience") || query.includes("previous") || query.includes("job") || query.includes("career")) {
          aiResponse = "vicky is the founder of cookie inc., building end-to-end applications. he has experience working across client-side logic, rest api engines, and infrastructure deployments."
        } else if (query.includes("contact") || query.includes("email") || query.includes("phone") || query.includes("reach") || query.includes("ping")) {
          aiResponse = "you can reach vicky at hello@vickify.in or via the contact form on the home page!"
        } else if (query.includes("education") || query.includes("college") || query.includes("gurunanak") || query.includes("bca")) {
          aiResponse = "vicky studied bachelor of computer applications (bca) at gurunanak college."
        } else if (query.includes("anime") || query.includes("one piece") || query.includes("luffy")) {
          aiResponse = "vicky is probably thinking about one piece right now. he loves anime, movies, and reading!"
        } else {
          aiResponse = "i can tell you about vicky's skills, his projects (like cookie inc.), his background, or how to contact him. what would you like to know?"
        }

        setChatMessages((prev) => [...prev, { sender: "ai", text: aiResponse }])
        setIsTyping(false)
      }, 600)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 relative pb-32">

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
          className={`mx-auto max-w-2xl px-6 flex items-center justify-between select-none font-mono text-xs md:text-[13px] transition-all duration-300 relative ${
            scrolled ? "py-4.5" : "py-5"
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
          <div className="flex items-center gap-2">
            {/* Theme toggle — always visible */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="toggle theme"
              className="p-1.5 rounded-sm border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            {/* Collapse menu toggle — visible only when scrolled */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="toggle menu"
              className={`p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300 cursor-pointer ${
                scrolled ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-75 w-0 h-0 border-0 p-0 overflow-hidden"
              }`}
            >
              {menuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
            </button>
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
      <div className="mx-auto max-w-2xl px-6 text-[15px] md:text-[16.5px] leading-relaxed tracking-tight lowercase font-sans pt-24 sm:pt-28">
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
        </footer>



{/* Floating Vickify Native AI Chatbox */}
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-0.5rem)] max-w-2xl px-6 font-mono text-xs">  <div className="bg-zinc-900 rounded-sm p-3.5 shadow-none w-full flex flex-col focus-within:shadow-[0_0_0_1px] focus-within:shadow-teal-600/10 transition-all duration-300">
    <div
      className={`grid transition-all duration-300 ease-out ${
        isChatOpen ? "grid-rows-[1fr] opacity-100 mb-2.5" : "grid-rows-[0fr] opacity-0 mb-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="flex flex-col h-60 sm:h-64 justify-between pb-2.5">
          <div className="flex justify-between items-center pb-1.5 mb-2 select-none">
            <div className="flex items-center gap-2">
              <span className="relative h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-75" />
                <span className="absolute inset-0 rounded-full bg-teal-500" />
              </span>
              <span className="font-bold text-zinc-100">vickify assistant</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-[12px] text-zinc-500 hover:text-zinc-200 hover:-translate-y-px transition-all duration-200 cursor-pointer"
            >
              hide
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                className={`flex flex-col animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-300 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-[9px] text-zinc-500 mb-0.5 select-none">
                  {msg.sender === "user" ? "you" : "assistant"}
                </span>
                <div
                  className={`p-2 rounded-sm max-w-[85%] transition-colors duration-200 [&_*]:!text-inherit ${
                    msg.isError
                      ? "bg-red-500/10 text-red-400 font-mono text-[10px]"
                      : msg.sender === "user"
                        ? "bg-teal-700 text-zinc-50"
                        : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {msg.isError ? msg.text : parseMarkdown(msg.text)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1 select-none animate-in fade-in duration-200">
                <span className="text-[10px] text-zinc-500">assistant is typing</span>
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce" />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>

    <form onSubmit={handleSendMessage} className="flex gap-2 items-center w-full">
      <span className="text-teal-500 animate-pulse font-bold select-none transition-transform duration-200 group-focus-within:translate-x-0.5">
        &gt;
      </span>
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onFocus={() => setIsChatOpen(true)}
        placeholder="ask vicky's assistant..."
        className="bg-transparent border-none p-0 flex-1 text-xs placeholder:text-zinc-500 placeholder:transition-opacity focus:placeholder:opacity-60 focus:outline-none focus:ring-0 lowercase text-zinc-100 pl-2"
      />
      <button
        type="submit"
        disabled={!chatInput.trim()}
        className="text-teal-500 hover:text-teal-400 hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 transition-all duration-200 p-1 cursor-pointer focus:outline-none"
        aria-label="send message"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </form>
  </div>
</div>

      </div>
    </div>
  )
}
