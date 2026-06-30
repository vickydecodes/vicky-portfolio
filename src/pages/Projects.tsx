import { ArrowUpRight } from "lucide-react"
import { Badge } from "src/components/ui/badge"
import { dataportfolio } from "src/lib/data"

export default function Projects() {
  return (
    <div className="space-y-6 font-sans">
      
      <div className="space-y-1 select-none border-b border-border/10 pb-2">
        <h2 className="font-bold italic font-mono text-base sm:text-lg text-foreground lowercase">
          builds
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground lowercase">
          a complete list of personal project builds, web applications, custom developer tools, and client integrations.
        </p>
      </div>

      <div className="space-y-5 pt-2">
        {dataportfolio.map((build) => {
          // split project title and description if contains ' – '
          const parts = build.description.split(" – ")
          const title = parts[0]
          const subtitle = parts[1] || build.description

          return (
            <div key={build.link} className="space-y-1.5 text-sm sm:text-[15px] lowercase border-b border-border/10 pb-4 last:border-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5">
                <a
                  href={build.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-foreground underline hover:text-primary hover:decoration-primary/60 underline-offset-4 transition-all duration-200 inline-flex items-center gap-0.5 w-fit"
                >
                  {title}
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </a>
                <div className="flex flex-wrap gap-1 font-mono text-xs select-none">
                  {build.tech.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[9px] sm:text-[10px] font-mono text-muted-foreground border-border/80 px-1.5 py-0 rounded-sm bg-card/30 lowercase shadow-none"
                    >
                      {t.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            </div>
          )
        })}
      </div>

    </div>
  )
}
