import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { dataportfolio } from "src/lib/data"
import Reveal from "src/components/Reveal"
import SpotlightRow from "src/components/SpotlightRow"
import ScrollText from "src/components/ScrollText"
import LightUp from "src/components/LightUp"
import { playTick } from "src/lib/sound"

type FilterKey = "all" | "fullstack" | "ai / python" | "web & tools"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "all" },
  { key: "fullstack", label: "fullstack" },
  { key: "ai / python", label: "ai / python" },
  { key: "web & tools", label: "web & tools" },
]

function matchesFilter(tech: string[], filter: FilterKey) {
  if (filter === "all") return true
  const lower = tech.map((t) => t.toLowerCase())
  if (filter === "fullstack") {
    return lower.some((t) =>
      ["mongodb", "node.js", "express", "jwt", "react native"].includes(t),
    )
  }
  if (filter === "ai / python") {
    return lower.some((t) =>
      ["python", "ai api", "openai api", "nlp", "scikit-learn", "tts"].includes(t),
    )
  }
  return lower.some((t) =>
    ["cli", "bootstrap", "html", "css", "responsive design", "yt-dlp"].includes(t),
  )
}

export default function Projects() {
  const [filter, setFilter] = useState<FilterKey>("all")
  const filtered = dataportfolio.filter((b) => matchesFilter(b.tech, filter))

  return (
    <div className="space-y-8 font-sans mt-2">
      <div className="space-y-4 select-none border-b border-border/60 pb-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-medium text-2xl sm:text-[28px] tracking-[-0.035em] lowercase leading-tight">
              <span className="linear-sheen">builds</span>
            </h1>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {filtered.length} / {dataportfolio.length}
            </span>
          </div>
          <ScrollText
            text="a complete list of personal project builds, web applications, custom developer tools, and client integrations."
            className="text-[15px] leading-[1.7] lowercase max-w-lg"
          />
        </div>

        {/* Minimal filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  playTick()
                  setFilter(f.key)
                }}
                className={`px-2.5 py-1 rounded-md border transition-all duration-150 active:scale-[0.97] cursor-pointer lowercase ${
                  active
                    ? "bg-foreground text-background border-foreground font-medium"
                    : "bg-foreground/[0.025] text-muted-foreground border-border/70 hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {filtered.map((build, idx) => {
          const parts = build.description.split(" – ")
          const title = parts[0]
          const subtitle = parts[1] || build.description

          return (
            <Reveal key={build.link} delay={Math.min(idx * 35, 210)}>
              <SpotlightRow href={build.link} className="py-4 lowercase">
                <LightUp>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium text-[15px] tracking-[-0.015em] text-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1 w-fit">
                      {title}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </span>
                    <div className="flex flex-wrap gap-1.5 select-none">
                      {build.tech.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-mono text-muted-foreground border border-border/70 px-2 py-0.5 rounded-md bg-foreground/[0.02] lowercase"
                        >
                          {t.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </LightUp>
                <ScrollText
                  text={subtitle}
                  className="mt-1.5 text-[14px] leading-[1.68]"
                />
              </SpotlightRow>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
