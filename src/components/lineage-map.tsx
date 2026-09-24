import { stages } from "@/lib/stages"
import { ArrowRight, ArrowDown } from "lucide-react"
import { Fragment } from "react"

const phases = [
  { label: "推理期：会用工具", span: [1, 2], color: "#0ea5e9" },
  { label: "SFT：模仿强模型的轨迹", span: [3, 4], color: "#10b981" },
  { label: "RL：从环境奖励中学习", span: [5, 7], color: "#ef4444" },
]

export function LineageMap() {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">总览 · 七步演进</span>
        <span className="text-xs text-muted-foreground">点击节点跳到对应章节</span>
      </div>
      <div className="flex flex-col items-stretch gap-1 lg:flex-row lg:items-center">
        {stages.map((s, i) => (
          <Fragment key={s.id}>
            <a
              href={`#${s.id}`}
              className="group relative flex flex-1 items-center gap-3 rounded-xl border bg-background p-3 transition-all hover:-translate-y-0.5 hover:shadow-md lg:flex-col lg:items-start lg:gap-1"
              style={{ borderColor: `${s.color}55` }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: s.color }}>
                {s.index}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{s.short}</span>
                <span className="block text-[11px] text-muted-foreground">{s.date} · {s.paradigm}</span>
              </span>
            </a>
            {i < stages.length - 1 && (
              <>
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground lg:block" />
                <ArrowDown className="mx-auto size-4 shrink-0 text-muted-foreground lg:hidden" />
              </>
            )}
          </Fragment>
        ))}
      </div>
      <div className="mt-4 hidden grid-cols-7 gap-3 lg:grid">
        {phases.map((p) => (
          <div
            key={p.label}
            className="rounded-md py-1.5 text-center text-[11px] font-medium"
            style={{
              gridColumn: `${p.span[0]} / ${p.span[1] + 1}`,
              background: `${p.color}14`,
              color: p.color,
              borderTop: `2px solid ${p.color}`,
            }}
          >
            {p.label}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
        {phases.map((p) => (
          <span key={p.label} className="rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: `${p.color}14`, color: p.color }}>
            {p.span[0]}–{p.span[1]}：{p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
