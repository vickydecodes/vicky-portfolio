import { Link } from "react-router-dom"
import { blogs } from "src/lib/data"

export default function Blog() {
  return (
    <div className="space-y-6 font-sans">
      
      <div className="space-y-1 select-none border-b border-border/10 pb-2">
        <h2 className="font-bold italic font-mono text-base sm:text-lg text-foreground lowercase">
          writings
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground lowercase">
          occasional thoughts on software engineering, distributed systems, compiler engines, and network logic.
        </p>
      </div>

      <div className="space-y-5 pt-2 font-mono text-xs sm:text-[13px] lowercase">
        {blogs.map((post) => (
          <div key={post.slug} className="space-y-1 border-b border-border/10 pb-4 last:border-0 last:pb-0">
            <div className="w-full grid grid-cols-[6rem_1fr] sm:grid-cols-[6.5rem_1fr] items-baseline gap-2">
              <p className="text-muted-foreground tabular-nums select-none">{post.date.toLowerCase()}</p>
              <Link
                to={`/blog/${post.slug}`}
                className="font-bold text-foreground hover:text-primary hover:underline block text-sm sm:text-[15px] tracking-tight underline hover:decoration-primary/60 underline-offset-4 transition-all duration-200"
              >
                {post.title.toLowerCase()}
              </Link>
            </div>
            <p className="text-xs sm:text-[13px] font-sans text-muted-foreground leading-relaxed pl-0 sm:pl-[6.5rem]">
              {post.description.toLowerCase()}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}
