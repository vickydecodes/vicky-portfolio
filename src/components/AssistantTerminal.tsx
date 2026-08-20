import { useState, useEffect, useRef } from "react"
import { Code2, Cpu, Briefcase, Mail, Trash2, ArrowLeft } from "lucide-react"
import { useChatStore } from "src/store/useChatStore"

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
        <li key={idx} className="ml-4 list-disc pl-0.5 text-xs my-0.5">
          {renderedLine}
        </li>
      )
    }

    return (
      <p key={idx} className="text-xs leading-relaxed my-0.5">
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

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || ""
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
          you are vignesh (vicky), a full stack developer. you are talking directly to recruiters, clients, and visitors on your personal portfolio website.
          here is your database containing your work, skills, and background:
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

          rules for response generation:
          1. always speak directly in the first-person ("i did this", "my tech stack is"). never refer to yourself as an assistant or clone. you are vicky.
          2. match vicky's persona: warm, creative, professional, and enthusiastic about building clean, high-quality products. speak clearly and approachably for non-technical visitors.
          3. keep responses short, helpful, and concise.
          4. do not use list markers like '-' or '*' or markdown headings. use simple spacing, paragraphs, and casual bold text for emphasis.
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
                  content: text
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
    const text = chatInput.trim()
    setChatInput("")

    // Match suggestions query mapping if typed literally
    const matched = suggestions.find(s => s.label.toLowerCase() === text.toLowerCase())
    if (matched) {
      await sendMessageText(matched.label) // Call command handling or query directly
    } else {
      await sendMessageText(text)
    }
  }

  const handleSuggestionClick = async (sug: typeof suggestions[0]) => {
    setChatInput("")
    if (sug.label.includes("clear chat")) {
      setChatMessages([{ sender: "ai", text: getWelcomeText() }])
      return
    }
    await sendMessageText(sug.query)
  }

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(sug => 
    sug.label.toLowerCase().includes(chatInput.toLowerCase()) ||
    sug.desc.toLowerCase().includes(chatInput.toLowerCase())
  )

  const showSuggestions = chatMessages.length <= 1

  return (
    <div className={`w-full flex flex-col font-sans text-[14px] md:text-[15px] leading-relaxed tracking-tight lowercase overflow-hidden transition-all duration-300 ${
      variant === "palette"
        ? "h-full bg-background"
        : "bg-secondary/15 dark:bg-card/10 border border-border/15 rounded-xl w-full shadow-sm"
    }`}>
      
      {/* Assistant Header - Creative Minimalist Heading */}
      <div className="bg-transparent select-none w-full">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {variant === "palette" && onClose && (
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer p-2 rounded-full hover:bg-secondary/45 flex items-center justify-center -ml-2"
                aria-label="go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="font-bold italic font-mono text-base tracking-tight text-foreground lowercase select-none flex items-center gap-1.5 pt-0.5">
              vicky <span className="inline-block animate-tilde-wave origin-center text-primary">~</span>
            </h1>
          </div>
          {chatMessages.length > 0 && (
            <button
              onClick={() => setChatMessages([])}
              className="text-muted-foreground hover:text-destructive active:scale-95 transition-all cursor-pointer p-2 rounded-full hover:bg-secondary/45 flex items-center justify-center -mr-2"
              title="clear chat history"
              aria-label="clear chat history"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Output Panel Container */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-none">
        <div className={`max-w-2xl mx-auto px-6 py-6 space-y-4 ${
          variant === "palette" ? "" : "max-h-[300px]"
        }`}>
        
        {/* Message Feed */}
        {((chatMessages.length > 1) || (chatInput && !chatInput.startsWith("/"))) && (
          <div className="space-y-4">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={idx}
                  className={`flex flex-col animate-in fade-in slide-in-from-bottom-1.5 fill-mode-backwards duration-200 ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[9px] text-primary/80 dark:text-primary/90 mb-1 select-none font-mono font-bold tracking-widest px-1.5 uppercase">
                    {isUser ? "you" : "vicky"}
                  </span>
                  
                  <div className={`flex gap-2.5 items-start max-w-[90%] ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="flex-shrink-0 flex items-center justify-center mt-0.5 h-6 w-6 select-none pointer-events-none bg-transparent">
                        <img 
                          src="/assets/minecraft_me.png" 
                          alt="vicky avatar" 
                          className="h-full w-full object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    )}
                    
                    <div
                      className={`p-3.5 rounded-2xl text-[14px] md:text-[15px] leading-relaxed shadow-sm transition-all duration-200 ${
                        msg.isError
                          ? "bg-destructive/10 text-destructive border border-destructive/25 font-mono text-[11px] rounded-lg"
                          : isUser
                            ? "bg-primary text-primary-foreground border border-primary/20 rounded-tr-none"
                            : "bg-zinc-900 dark:bg-zinc-900 text-zinc-100 dark:text-zinc-100 border border-zinc-800/80 dark:border-border/45 rounded-tl-none"
                      }`}
                    >
                      {msg.isError 
                        ? msg.text 
                        : (idx === chatMessages.length - 1 && !msg.isTypingComplete)
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
                          : parseMarkdown(msg.text, isUser)
                      }
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 select-none pl-1 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200 text-muted-foreground/60 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>
      </div>

      {/* Suggestion Dock - Renders as dynamic action badges row */}
      {showSuggestions && (
        <div className="bg-transparent select-none w-full pb-3">
          <div className="max-w-2xl mx-auto px-6 flex flex-wrap items-center gap-2 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="text-[9px] text-muted-foreground/45 uppercase font-bold tracking-wider pr-1">topics:</span>
            {filteredSuggestions.map((sug, idx) => {
              const IconComp = sug.icon;
              return (
                <button
                key={idx}
                onClick={() => handleSuggestionClick(sug)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-secondary/60 hover:bg-primary border border-border/30 hover:border-primary/50 text-[11px] text-foreground/80 hover:text-primary-foreground transition-all duration-200 cursor-pointer font-sans group tracking-tight lowercase shadow-sm"
                title={sug.desc}
              >
                <IconComp className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary-foreground transition-colors duration-150" />
                <span>{sug.label}</span>
              </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Interactive Command Input Line */}
      <div className="bg-transparent w-full pb-8 sm:pb-6">
        <div className="max-w-2xl mx-auto px-6">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center w-full px-2 py-1.5 border-0 border-b border-border/40 hover:border-foreground/30 focus-within:border-primary transition-all duration-200">
            <input
              type="text"
              ref={inputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="ask a question..."
              className="bg-transparent border-none p-0 flex-1 text-[14px] md:text-[15px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 text-foreground pl-0.5 font-sans lowercase tracking-tight"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className={`p-1.5 rounded-md hover:bg-secondary transition-all cursor-pointer ${
                chatInput.trim() ? "text-primary opacity-100" : "text-muted-foreground/45 opacity-50"
              }`}
              aria-label="send message"
            >
              <svg className="h-3.5 w-3.5 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
