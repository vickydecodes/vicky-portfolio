import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { blogs } from "src/lib/data"

const blogMetaMap: Record<string, {
  readTime: string
  category: string
}> = {
  "the-unexpected-idea-behind-my-cli": { readTime: "2 min read", category: "systems" },
  "how-i-started-my-startup-journey": { readTime: "3 min read", category: "business" },
  "fail-fast-learn-faster": { readTime: "2 min read", category: "growth" },
  "balancing-vision-and-execution": { readTime: "3 min read", category: "strategy" }
}

function parseText(text: string): React.ReactNode {
  // Split by code blocks first
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, pIdx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={pIdx} className="font-mono bg-secondary/80 dark:bg-zinc-800/80 text-primary text-[11px] sm:text-xs px-1.5 py-0.5 rounded-sm border border-border/5">
          {part.slice(1, -1)}
        </code>
      )
    }
    
    // Split by bold blocks
    const subParts = part.split(/(\*\*[^*]+\*\*)/g)
    return subParts.map((subPart, sIdx) => {
      if (subPart.startsWith("**") && subPart.endsWith("**")) {
        return (
          <strong key={`${pIdx}-${sIdx}`} className="font-bold text-foreground">
            {subPart.slice(2, -2)}
          </strong>
        )
      }
      
      // Split by italic blocks (single asterisk)
      const italicParts = subPart.split(/(\*[^*]+\*)/g)
      return italicParts.map((italicPart, iIdx) => {
        if (italicPart.startsWith("*") && italicPart.endsWith("*")) {
          return (
            <span key={`${pIdx}-${sIdx}-${iIdx}`} className="italic text-foreground/90">
              {italicPart.slice(1, -1)}
            </span>
          )
        }
        return italicPart
      })
    })
  })
}

function renderBlogPostContent(content: string) {
  const rawBlocks = content.trim().split("\n\n")

  return rawBlocks.map((block, bIdx) => {
    const trimmedBlock = block.trim()
    if (!trimmedBlock) return null

    // Check if block is an image: ![alt](url)
    if (trimmedBlock.startsWith("![") && trimmedBlock.endsWith(")")) {
      const match = trimmedBlock.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (match) {
        const alt = match[1]
        const src = match[2]
        return (
          <div
            key={bIdx}
            className="my-5 overflow-hidden rounded-sm border border-border/10 bg-card/5 select-none shadow-xs hover:border-border/20 transition-all duration-300"
          >
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[360px] object-cover transition-all duration-300"
              loading="lazy"
            />
            {alt && (
              <p className="px-4 py-2.5 text-xs text-muted-foreground border-t border-border/5 bg-secondary/5 font-sans italic">
                {alt.toLowerCase()}
              </p>
            )}
          </div>
        )
      }
    }

    const lines = trimmedBlock.split("\n").map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return null

    // Check if block is a list
    const isList = lines.every(line => line.startsWith("- ") || line.startsWith("* "))
    if (isList) {
      return (
        <ul key={bIdx} className="list-disc pl-5 space-y-1.5 my-4 text-[14px] sm:text-[15.5px] leading-normal text-foreground/85 font-sans">
          {lines.map((line, lIdx) => {
            const cleanText = line.replace(/^[-*]\s*/, "")
            return (
              <li key={lIdx} className="font-sans">
                {parseText(cleanText)}
              </li>
            )
          })}
        </ul>
      )
    }

    // Check if block is a blockquote
    const isQuote = lines.every(line => line.startsWith(">"))
    if (isQuote) {
      return (
        <blockquote key={bIdx} className="border-l-2 border-primary/50 pl-4 py-0.5 italic text-muted-foreground my-4 text-[14px] sm:text-[15px] leading-normal bg-secondary/5 dark:bg-zinc-900/20 pr-2">
          {lines.map((line, lIdx) => {
            const cleanText = line.replace(/^>\s*/, "")
            return <p key={lIdx} className="my-1">{parseText(cleanText)}</p>
          })}
        </blockquote>
      )
    }

    // Regular paragraph
    const jointText = lines.join(" ")
    return (
      <p key={bIdx} className="text-[14px] sm:text-[15.5px] text-foreground/85 font-sans leading-normal my-3.5">
        {parseText(jointText)}
      </p>
    )
  })
}



export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = blogs.find((b) => b.slug === slug)
  const [scrollProgress, setScrollProgress] = useState(0)

  const [blogContent, setBlogContent] = useState<string>("")
  const [contentFormat, setContentFormat] = useState<"html" | "md">("md")
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const postIndex = blogs.findIndex((b) => b.slug === slug)
  const fileNumber = String(postIndex + 1).padStart(2, "0")
  const serialNo = String(blogs.length - postIndex).padStart(2, "0")

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100)
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (postIndex === -1) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

    // Try fetching HTML first, fallback to MD if not found
    fetch(`/assets/blogs/${fileNumber}.html`)
      .then((res) => {
        if (res.ok) {
          setContentFormat("html")
          return res.text()
        }
        return fetch(`/assets/blogs/${fileNumber}.md`).then((resMd) => {
          if (!resMd.ok) throw new Error("Blog file not found")
          setContentFormat("md")
          return resMd.text()
        })
      })
      .then((text) => {
        // Strip main heading to prevent double headers
        const cleanText = text.replace(/^#\s+.+$/m, "").trim()
        setBlogContent(cleanText)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setHasError(true)
        setIsLoading(false)
      })
  }, [fileNumber, postIndex])

  if (!post) {
    return (
      <div className="space-y-4 lowercase font-sans text-sm">
        <p className="text-destructive">// error: post not found</p>
        <p className="text-muted-foreground">
          the writing you are looking for does not exist in our system.
        </p>
        <Link
          to="/blog"
          className="text-primary hover:underline inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back to writings
        </Link>
      </div>
    )
  }

  const meta = blogMetaMap[post.slug] || { readTime: "2 min read", category: "general" }

  return (
    <article className="relative space-y-8 lowercase font-sans">
      
      {/* Dynamic Scroll Progress Bar under navbar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-border/5 z-40">
        <div
          className="h-full bg-primary transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Aesthetic giant S.No watermark floating in the top right */}
      <span className="absolute -top-3 right-0 font-mono text-[75px] sm:text-[105px] font-extrabold text-foreground/[0.03] dark:text-foreground/[0.05] select-none pointer-events-none tracking-tighter leading-none">
        {serialNo}
      </span>
      
      {/* Header section */}
      <header className="space-y-4 select-none relative z-10 pb-4 border-b border-border/10">
        <Link
          to="/blog"
          className="font-mono text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> back
        </Link>

        <div className="space-y-2">
          <h1 className="font-extrabold italic font-mono text-xl sm:text-2xl md:text-[30px] text-foreground tracking-tight leading-tight">
            {post.title.toLowerCase()}
          </h1>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-muted-foreground/60">
            <span className="tabular-nums">{post.date.toLowerCase()}</span>
            <span>•</span>
            <span>{meta.readTime}</span>
            <span>•</span>
            <span>#{meta.category}</span>
          </div>
        </div>
      </header>

      {/* Article Content fetched dynamically */}
      <div className="relative z-10">
        <div className="text-foreground/85 leading-relaxed text-[14px] sm:text-[15.5px] font-sans">
          {isLoading ? (
            <div className="space-y-4 text-xs text-muted-foreground py-10 select-none">
              <p className="animate-pulse">loading writing logs...</p>
            </div>
          ) : hasError ? (
            <div className="space-y-4 text-xs text-destructive py-10">
              <p>error: failed to load article content</p>
            </div>
          ) : contentFormat === "html" ? (
            <div 
              dangerouslySetInnerHTML={{ __html: blogContent }} 
              className="text-[14px] sm:text-[15.5px] leading-relaxed text-foreground/85 font-sans space-y-4"
            />
          ) : (
            renderBlogPostContent(blogContent)
          )}
        </div>
      </div>

      {/* Simple Footer Navigation */}
      <footer className="mt-14 pt-6 border-t border-border/10 flex justify-between items-center select-none font-mono text-xs text-muted-foreground relative z-10">
        <Link
          to="/blog"
          className="hover:text-primary inline-flex items-center gap-1.5 transition-colors hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back to writings
        </Link>
        <span className="text-[10px] text-zinc-500">// end of log.</span>
      </footer>

    </article>
  )
}
