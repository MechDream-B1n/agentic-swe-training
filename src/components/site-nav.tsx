"use client"

import { useEffect, useState } from "react"
import { stages } from "@/lib/stages"
import { cn } from "@/lib/utils"

export function SiteNav() {
  const [active, setActive] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      setProgress(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))
      let cur: string | null = null
      for (const s of stages) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) cur = s.id
      }
      const summary = document.getElementById("summary")
      if (summary && summary.getBoundingClientRect().top < window.innerHeight * 0.35) cur = "summary"
      setActive(cur)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="shrink-0 text-sm font-bold tracking-tight">
          Agentic SWE 训练范式
        </a>
        <nav className="no-scrollbar -mx-2 flex min-w-0 flex-1 gap-1 overflow-x-auto px-2">
          {stages.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors",
                active === s.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="size-1.5 rounded-full" style={{ background: s.color }} />
              {s.short}
            </a>
          ))}
          <a
            href="#summary"
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors",
              active === "summary" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            )}
          >
            总结
          </a>
        </nav>
      </div>
      <div className="h-0.5 bg-foreground transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
    </header>
  )
}
