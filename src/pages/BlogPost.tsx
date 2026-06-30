import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { blogs } from "src/lib/data"

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = blogs.find((b) => b.slug === slug)

  if (!post) {
    return (
      <div className="space-y-4 lowercase">
        <p className="text-destructive font-mono text-xs sm:text-sm">// error: post_not_found</p>
        <p className="text-muted-foreground font-sans text-sm sm:text-base">
          the writing you are looking for does not exist in the logs.
        </p>
        <Link
          to="/blog"
          className="font-mono text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back to writings
        </Link>
      </div>
    )
  }

  return (
    <article className="space-y-8 lowercase font-sans">
      
      {/* Article Header */}
      <header className="space-y-2 select-none">
        <Link
          to="/blog"
          className="font-mono text-xs sm:text-[13px] text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1.5 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back to writings
        </Link>
        <div className="text-xs sm:text-[13px] font-mono text-slate-400 tabular-nums">
          {post.date.toLowerCase()}
        </div>
        <h1 className="font-bold italic font-mono text-lg sm:text-xl md:text-[22px] tracking-tight text-foreground lowercase">
          {post.title.toLowerCase()}
        </h1>
      </header>

      {/* Article Content */}
      <div className="text-foreground/85 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line font-sans">
        {post.fullContent.trim().toLowerCase()}
      </div>

    </article>
  )
}
