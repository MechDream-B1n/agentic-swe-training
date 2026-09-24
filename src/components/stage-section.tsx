import { ExternalLink, Lightbulb, ArrowDownRight } from "lucide-react"
import type { Stage } from "@/lib/stages"
import { QuestionCard } from "@/components/question-card"

export function StageSection({ stage, children }: { stage: Stage; children: React.ReactNode }) {
  return (
    <section id={stage.id} className="scroll-mt-20 border-t py-14 sm:py-20" data-stage={stage.id}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
          style={{ background: stage.color }}
        >
          {stage.index}
        </span>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: `${stage.color}18`, color: stage.color }}>
              {stage.paradigm}
            </span>
            <span>{stage.date}</span>
            <span>·</span>
            <span>{stage.org}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{stage.name}</h2>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">{stage.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">它要解决什么问题</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{stage.problem}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">核心做法</h3>
            <ul className="flex flex-col gap-2">
              {stage.ideas.map((idea) => (
                <li key={idea} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: stage.color }} />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {stage.stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-4">
              <div className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: stage.color }}>
                {s.value}
              </div>
              <div className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</div>
            </div>
          ))}
          <div className="rounded-xl border border-dashed p-4 sm:col-span-3 lg:col-span-1 xl:col-span-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
              <ArrowDownRight className="size-3.5" style={{ color: stage.color }} />
              局限，以及它引出的下一步
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{stage.limitation}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">{children}</div>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <QuestionCard q={stage.question.q} a={stage.question.a} color={stage.color} />
        <div className="flex flex-col gap-2">
          {stage.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div>{children}</div>
    </div>
  )
}
