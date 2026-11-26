import { useState, useEffect, useRef } from "react"
import { Code2, Cpu, Briefcase, Mail, Trash2, ArrowLeft, ArrowUp } from "lucide-react"
import { useChatStore } from "src/store/useChatStore"
import { playTick } from "src/lib/sound"

interface OpenRouterModel {
  id: string
  name?: string
  pricing?: {
    prompt?: string
    completion?: string
  }
}

const PREFERRED_MODELS = [
  "openrouter/free",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "google/gemma-3-12b-it:free",
  "qwen/qwen3-8b:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct",
]

import {
  meta,
  dataabout,
  dataportfolio,
  worktimeline,
  skills as skillsData,
  beyondProfession,
  contactConfig
} from "src/lib/data"



interface AssistantTerminalProps {
  variant: "inline" | "palette"
  onClose?: () => void
}

const suggestions = [
  { label: "projects", icon: Code2, desc: "his builds & work", query: "tell me about vicky's projects" },
  { label: "skills", icon: Cpu, desc: "his tech stack", query: "what are vicky's core skills?" },
  { label: "experience", icon: Briefcase, desc: "his career journey", query: "tell me about vicky's experience" },
  { label: "contact", icon: Mail, desc: "get in touch", query: "how can i contact vicky?" },
  { label: "clear chat", icon: Trash2, desc: "reset screen", query: "clear chat history" }
]

// Client-side markdown tokenizer for bold (**text**), inline code (`code`), and bullet lists (- item)
function parseMarkdown(text: string, isUser: boolean): React.ReactNode {
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
        return <strong key={tIdx} className="font-bold">{token.slice(2, -2)}</strong>
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={tIdx} className={`font-mono text-[10px] px-1 py-0.5 rounded-sm ${
            isUser 
              ? "bg-primary-foreground/15 text-primary-foreground" 
              : "bg-secondary-foreground/10 text-secondary-foreground"
          }`}>
            {token.slice(1, -1)}
          </code>
        )
      }
      return token
    })

    if (isBullet) {
      return (
        <li key={idx} className="ml-4 list-disc pl-0.5 text-[14px] leading-[1.68] my-0.5">
          {renderedLine}
        </li>
      )
    }

    return (
      <p key={idx} className="text-[14px] leading-[1.68] my-0.5">
        {renderedLine}
      </p>
    )
  })
}
function TypewriterText({ 
  text, 
  isUser, 
  scrollRef, 
  onComplete 
}: { 
  text: string; 
  isUser: boolean; 
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    if (isUser) {
      setDisplayedText(text)
      onComplete?.()
      return
    }

    let index = 0
    setDisplayedText("")
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index))
      index++
      
      // Keep feed pinned to bottom as text types in
      scrollRef.current?.scrollIntoView({ behavior: "auto" })

      if (index >= text.length) {
        clearInterval(interval)
        onComplete?.()
      }
    }, 8) // Fast, smooth character typewriter ticks (8ms)

    return () => clearInterval(interval)
  }, [text, isUser, scrollRef])

  return <>{parseMarkdown(displayedText, isUser)}</>
}

export default function AssistantTerminal({ variant, onClose }: AssistantTerminalProps) {
  const [chatInput, setChatInput] = useState("")
  const { chatMessages, setChatMessages } = useChatStore()
  const [isTyping, setIsTyping] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>(PREFERRED_MODELS)
  const [selectedModel, setSelectedModel] = useState<string>(PREFERRED_MODELS[0])

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || ""
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Dynamically fetch available models from OpenRouter using the API key
  useEffect(() => {
    if (!apiKey) return
    let cancelled = false

    const loadModels = async () => {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "vicky portfolio",
          },
        })
        if (!res.ok) return
        const json = (await res.json()) as { data?: OpenRouterModel[] }
        const remote = json.data ?? []
        if (cancelled || remote.length === 0) return

        const remoteIds = new Set(remote.map((m) => m.id))

        // 1. Preferred models that are actually live right now
        const livePreferred = PREFERRED_MODELS.filter((id) => remoteIds.has(id))

        // 2. Additional free chat models discovered from the API
        const discoveredFree = remote
          .filter((m) => {
            const isFree =
              m.id.endsWith(":free") ||
              (m.pricing?.prompt === "0" && m.pricing?.completion === "0")
            const isChatCapable =
              !m.id.includes("embed") &&
              !m.id.includes("whisper") &&
              !m.id.includes("vision-only")
            return isFree && isChatCapable && !livePreferred.includes(m.id)
          })
          .slice(0, 8)
          .map((m) => m.id)

        const merged = Array.from(
          new Set([...livePreferred, ...discoveredFree, ...PREFERRED_MODELS]),
        ).slice(0, 14)

        if (!cancelled && merged.length > 0) {
          setAvailableModels(merged)
          setSelectedModel(merged[0])
        }
      } catch {
        // Keep curated fallback list if model discovery fails
      }
    }

    loadModels()
    return () => {
      cancelled = true
    }
  }, [apiKey])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isTyping])

  const getWelcomeText = () => apiKey 
    ? "hi! i'm vicky.\n\nask me anything about my projects, skills, experience, or what it's like to work with me. click any of the tags below to start chatting!"
    : "hi! i'm vicky.\n\ni'm currently offline. click any of the tags below to ask me about my skills or work!"

  useEffect(() => {
    // Only initialize with welcome text if the chat history is completely empty
    if (chatMessages.length === 0) {
      setChatMessages([{ sender: "ai", text: getWelcomeText() }])
    }
  }, [apiKey, chatMessages.length])

  // Focus input on load/palette open
  useEffect(() => {
    if (variant === "palette") {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [variant])

  const sendMessageText = async (text: string) => {
    if (!text.trim()) return

    // Special local CLI command handling
    const lowerText = text.trim().toLowerCase()
    
    if (lowerText === "clear" || lowerText === "clear chat" || lowerText === "clear chat 🗑️" || lowerText === "/clear") {
      setChatMessages([{ sender: "ai", text: getWelcomeText() }])
      return
    }

    if (lowerText === "help" || lowerText === "commands" || lowerText === "/help") {
      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text },
        {
          sender: "ai",
          text: `you can ask me anything, or click the topics below to learn more about my work:
- **projects** - see what i've built
- **skills** - look at my development stack
- **experience** - browse my career history
- **contact** - find out how to reach me`
        }
      ])
      return
    }

    // Add user message
    setChatMessages((prev) => [...prev, { sender: "user", text }])
    setIsTyping(true)

    if (apiKey) {
      try {
        const systemPrompt = `
          you are vignesh (vicky), an ai engineer at rr donnelley (rrd) and full stack developer. you are talking directly to recruiters, clients, and visitors on your personal portfolio website.
          here is your database containing your work, skills, and background:
          ${JSON.stringify({
            name: "vicky",
            role: "AI Engineer at RR Donnelley (RRD)",
            github: "vickydecodes",
            description: meta.description,
            aboutme: dataabout.aboutme,
            skills: skillsData,
            experience: worktimeline,
            projects: dataportfolio,
            interests: beyondProfession,
            contact: contactConfig
          })}

          rules for response generation:
          1. always speak directly in the first-person ("i did this", "my tech stack is"). never refer to yourself as an assistant or clone. you are vicky.
          2. match vicky's persona: warm, creative, professional, and enthusiastic about building clean, high-quality products. speak clearly and approachably for non-technical visitors.
          3. keep responses short, helpful, and concise.
          4. do not use list markers like '-' or '*' or markdown headings. use simple spacing, paragraphs, and casual bold text for emphasis.
        `

        // Build ordered candidate queue starting with the user's selected model
        const candidates = [
          selectedModel,
          ...availableModels.filter((m) => m !== selectedModel),
        ].slice(0, 6)

        let aiText = ""
        let lastError: unknown = null

        for (const candidateModel of candidates) {
          try {
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
                  model: candidateModel,
                  messages: [
                    {
                      role: "system",
                      content: systemPrompt
                    },
                    {
                      role: "user",
                      content: text
                    }
                  ]
                })
              }
            )

            if (!response.ok) {
              lastError = new Error(`Model ${candidateModel} returned ${response.status}`)
              continue
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content?.trim()
            if (content) {
              aiText = content
              if (candidateModel !== selectedModel) {
                setSelectedModel(candidateModel)
              }
              break
            }
          } catch (err) {
            lastError = err
          }
        }

        if (!aiText) {
          throw lastError ?? new Error("All candidate models failed")
        }

        setChatMessages((prev) => [...prev, { sender: "ai", text: aiText.toLowerCase() }])
      } catch (error) {
        console.error("OpenRouter API Error:", error)
        setChatMessages((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: "// error: all available models failed to respond. let's connect directly at hello@vickify.in.", 
            isError: true 
          }
        ])
      } finally {
        setIsTyping(false)
      }
    } else {
      // Simulate local AI response delay
      setTimeout(() => {
        let aiResponse = ""

        if (lowerText.includes("project") || lowerText.includes("build") || lowerText.includes("work") || lowerText.includes("portfolio")) {
          aiResponse = "vicky is a freelance full stack developer. you can find his projects in the builds tab!"
        } else if (lowerText.includes("skill") || lowerText.includes("tech") || lowerText.includes("stack") || lowerText.includes("language") || lowerText.includes("code")) {
          aiResponse = "vicky works across the full stack. his skills include react, typescript, node.js, rust, python, postgresql, docker, and cloud systems."
        } else if (lowerText.includes("experience") || lowerText.includes("previous") || lowerText.includes("job") || lowerText.includes("career")) {
          aiResponse = "vicky is a freelance full stack developer, building end-to-end applications. he has experience working across client-side logic, rest api engines, and infrastructure deployments."
        } else if (lowerText.includes("contact") || lowerText.includes("email") || lowerText.includes("phone") || lowerText.includes("reach") || lowerText.includes("ping")) {
          aiResponse = "you can reach vicky at hello@vickify.in or via the contact form on the home page!"
        } else if (lowerText.includes("education") || lowerText.includes("college") || lowerText.includes("gurunanak") || lowerText.includes("bca")) {
          aiResponse = "vicky studied bachelor of computer applications (bca) at gurunanak college."
        } else if (lowerText.includes("anime") || lowerText.includes("one piece") || lowerText.includes("luffy")) {
          aiResponse = "vicky is probably thinking about one piece right now. he loves anime, movies, and reading!"
        } else {
          aiResponse = "i can tell you about vicky's skills, his background, his projects, or how to contact him. what would you like to know?"
        }

        setChatMessages((prev) => [...prev, { sender: "ai", text: aiResponse }])
        setIsTyping(false)
      }, 600)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    playTick()
    const text = chatInput.trim()
    setChatInput("")

    // Match suggestions query mapping if typed literally
    const matched = suggestions.find(s => s.label.toLowerCase() === text.toLowerCase())
    if (matched) {
      await sendMessageText(matched.label)
    } else {
      await sendMessageText(text)
    }
  }

  const handleSuggestionClick = async (sug: typeof suggestions[0]) => {
    playTick()
    setChatInput("")
    if (sug.label.includes("clear chat")) {
      setChatMessages([{ sender: "ai", text: getWelcomeText() }])
      return
    }
    await sendMessageText(sug.query)
  }

  // Filter suggestions (hide "clear chat" from initial empty-state cards)
  const filteredSuggestions = suggestions.filter(sug =>
    !sug.label.includes("clear chat") &&
    (sug.label.toLowerCase().includes(chatInput.toLowerCase()) ||
      sug.desc.toLowerCase().includes(chatInput.toLowerCase()))
  )

  const hasConversation = chatMessages.length > 1

  return (
    <div className={`relative w-full flex flex-col font-sans text-[14.5px] leading-[1.68] lowercase overflow-hidden transition-colors duration-200 ${
      variant === "palette"
        ? "h-full bg-background text-foreground"
        : "bg-card/40 border border-border/70 rounded-xl w-full"
    }`}>
      {variant === "palette" && (
        <>
          <div className="linear-ambient pointer-events-none fixed inset-x-0 top-0 h-[380px] z-0" />
          <div className="linear-grain pointer-events-none fixed inset-0 z-[1]" />
        </>
      )}

      {/* ── Sleek Frosted Hairline Header ── */}
      <header className="relative z-10 shrink-0 w-full border-b border-border/60 bg-background/80 backdrop-blur-md select-none">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {variant === "palette" && onClose && (
              <button
                type="button"
                onClick={() => {
                  playTick()
                  onClose()
                }}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border/70 bg-foreground/[0.03] hover:bg-foreground/[0.07] hover:border-foreground/25 text-foreground/85 hover:text-foreground font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] transition-all cursor-pointer"
                aria-label="back to portfolio"
                title="back (esc)"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                <span>back</span>
              </button>
            )}
            <span className="font-sans italic font-medium text-[16px] tracking-[-0.025em] text-foreground">
              vicky <span className="not-italic text-muted-foreground/80 inline-block animate-tilde-wave origin-center">~</span>
            </span>
          </div>

          {variant === "palette" && onClose && (
            <button
              type="button"
              onClick={() => {
                playTick()
                onClose()
              }}
              className="hidden sm:inline-flex items-center h-7 px-2 rounded-md border border-border/70 bg-foreground/[0.025] hover:bg-foreground/[0.05] text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              esc
            </button>
          )}
        </div>
      </header>

      {/* ── Scrollable Body / Empty Welcome State ── */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto scrollbar-none">
        <div className={`max-w-2xl mx-auto px-5 sm:px-6 py-8 ${
          !hasConversation && variant === "palette"
            ? "min-h-full flex flex-col justify-center"
            : ""
        }`}>
          {!hasConversation ? (
            /* Clean Linear-minimal Welcome Stage */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2.5 select-none">
                  <div className="h-9 w-9 rounded-lg border border-border/70 bg-foreground/[0.03] overflow-hidden flex items-center justify-center">
                    <img
                      src="/assets/avatar_mc.png"
                      alt="vicky"
                      className="h-full w-full object-cover"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ai engineer @ rrd · chennai
                  </span>
                </div>
                <h2 className="font-sans font-medium text-2xl sm:text-[28px] tracking-[-0.03em] leading-tight text-foreground">
                  <span className="linear-sheen">ask me anything</span>{" "}
                  <span className="text-muted-foreground/70">~</span>
                </h2>
                <p className="text-[14.5px] sm:text-[15px] text-muted-foreground leading-[1.68] max-w-md">
                  {apiKey
                    ? "chat directly about my builds, ai engineering work, stack, or how we can collaborate."
                    : "currently offline — pick a topic below to explore my work and stack."}
                </p>
              </div>

              {/* Minimal 2×2 Suggestion Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 select-none">
                {filteredSuggestions.map((sug, idx) => {
                  const IconComp = sug.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug)}
                      className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/70 bg-foreground/[0.02] hover:bg-foreground/[0.05] hover:border-foreground/20 text-left transition-all duration-150 active:scale-[0.985] cursor-pointer"
                    >
                      <span className="mt-0.5 h-7 w-7 rounded-md border border-border/60 bg-foreground/[0.03] flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-colors">
                        <IconComp className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-sans font-medium text-[13.5px] text-foreground tracking-[-0.01em]">
                          {sug.label}
                        </div>
                        <div className="font-sans text-[12px] text-muted-foreground truncate">
                          {sug.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Clean Message Feed */
            <div className="space-y-5">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender === "user"
                return (
                  <div
                    key={idx}
                    className={`flex flex-col animate-in fade-in slide-in-from-bottom-1.5 fill-mode-backwards duration-200 ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground/70 mb-1.5 select-none font-mono tracking-tight px-1">
                      {isUser ? "you" : "vicky"}
                    </span>

                    <div className={`flex gap-2.5 items-start max-w-[88%] ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="shrink-0 h-7 w-7 rounded-md border border-border/60 bg-foreground/[0.03] overflow-hidden flex items-center justify-center mt-0.5 select-none pointer-events-none">
                          <img
                            src="/assets/avatar_mc.png"
                            alt="vicky avatar"
                            className="h-full w-full object-cover"
                            style={{ imageRendering: "pixelated" }}
                          />
                        </div>
                      )}

                      <div
                        className={`px-4 py-2.5 rounded-2xl transition-colors ${
                          msg.isError
                            ? "bg-destructive/10 text-destructive border border-destructive/25 font-mono text-[11.5px] rounded-xl"
                            : isUser
                              ? "bg-foreground text-background rounded-br-sm"
                              : "bg-foreground/[0.035] text-foreground/90 border border-border/70 rounded-bl-sm"
                        }`}
                      >
                        {msg.isError
                          ? msg.text
                          : idx === chatMessages.length - 1 && !msg.isTypingComplete
                            ? (
                              <TypewriterText
                                text={msg.text}
                                isUser={isUser}
                                scrollRef={messagesEndRef}
                                onComplete={() => {
                                  const updated = [...chatMessages]
                                  updated[idx] = { ...updated[idx], isTypingComplete: true }
                                  setChatMessages(updated)
                                }}
                              />
                            )
                            : parseMarkdown(msg.text, isUser)}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex items-center gap-2.5 pl-0.5 py-1 animate-in fade-in duration-200 select-none">
                  <div className="shrink-0 h-7 w-7 rounded-md border border-border/60 bg-foreground/[0.03] overflow-hidden flex items-center justify-center">
                    <img
                      src="/assets/avatar_mc.png"
                      alt="vicky typing"
                      className="h-full w-full object-cover opacity-75"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-sm border border-border/60 bg-foreground/[0.025]">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Sleek Command Input Dock ── */}
      <div className="relative z-10 shrink-0 w-full border-t border-border/50 bg-background/80 backdrop-blur-md py-4 pb-6 sm:pb-5">
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-foreground/[0.025] hover:border-foreground/20 focus-within:border-foreground/35 focus-within:bg-foreground/[0.04] px-3.5 py-2 transition-all duration-150"
          >
            <input
              type="text"
              ref={inputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="ask vicky anything..."
              className="bg-transparent border-none p-0 flex-1 text-[14.5px] placeholder:text-muted-foreground/55 focus:outline-none focus:ring-0 text-foreground font-sans lowercase"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-[0.95] cursor-pointer shrink-0 ${
                chatInput.trim() && !isTyping
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-foreground/[0.06] text-muted-foreground/45 cursor-not-allowed"
              }`}
              aria-label="send message"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
