import { Link } from "react-router-dom"
import { blogs } from "src/lib/data"

export default function Blog() {
  return (
    <div className="space-y-8 font-sans lowercase">
      
      {/* Page Header */}
      <div className="space-y-2 select-none pb-4 border-b border-border/10">
        <h2 className="font-extrabold italic font-mono text-2xl sm:text-3xl md:text-[38px] text-foreground tracking-tight leading-none">
          writings
        </h2>
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
          occasional thoughts on software engineering, distributed systems, compiler engines, and network logic.
        </p>
      </div>

      {/* Changelog-style S.No index list with descriptions and view buttons */}
      <div className="pt-2 divide-y divide-border/5">
        {blogs.map((post, idx) => {
          const serialNo = String(blogs.length - idx).padStart(2, "0")

          return (
            <div
              key={post.slug}
              className="group py-4 flex items-start gap-4 sm:gap-6"
            >
              {/* Left Column: S.No changelog anchor */}
              <span className="font-mono text-xs sm:text-sm font-bold text-muted-foreground/45 group-hover:text-primary transition-colors select-none w-6 shrink-0 pt-0.5 tabular-nums">
                {serialNo}
              </span>

              {/* Right Column: Title and Date aligned, with description and view button below */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="font-mono text-base sm:text-lg md:text-[20px] text-foreground hover:text-primary transition-colors leading-snug font-bold"
                  >
                    {post.title.toLowerCase()}
                  </Link>
                  
                  <span className="font-mono text-[10px] sm:text-xs text-muted-foreground/60 tabular-nums select-none shrink-0">
                    {post.date.toLowerCase()}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed font-sans">
                  {post.description.toLowerCase()}
                </p>

                {/* Read article link indicator */}
                <div className="pt-1">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="font-mono text-[10px] sm:text-[11px] text-muted-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1 select-none hover:underline underline-offset-2 decoration-primary/40"
                  >
                    <span>read article</span>
                    <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
