"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { stageById, type StageId } from "@/lib/stages"

const xs = ["不训练", "SFT 模仿", "RL · 规则奖励", "RL · 执行奖励", "RL · 自博弈"]
const ys = ["通用 / 无", "人类真实数据", "自动合成", "模型自己出题"]

const points: { id: StageId; label: string; x: number; y: number; dx?: number; dy?: number; why: string }[] = [
  { id: "swe-agent", label: "SWE-agent", x: 0, y: 0, why: "不训练，只设计接口，直接用 GPT-4 推理。" },
  { id: "codeact", label: "CodeAct", x: 1, y: 0, dy: -14, why: "用通用任务上的约 7k 条轨迹做 SFT。" },
  { id: "swe-gym", label: "SWE-Gym", x: 1, y: 1, why: "人类写的真实 issue + 测试；用强模型轨迹做 SFT。" },
  { id: "synth", label: "SWE-smith", x: 1, y: 2, dx: -22, why: "向仓库注入合成 bug，LM 写 issue；5k 轨迹 SFT。" },
  { id: "synth", label: "R2E-Gym", x: 1, y: 2, dx: 22, dy: 16, why: "从 commit 自动生成任务与测试；SFT + 混合验证器。" },
  { id: "swe-rl", label: "SWE-RL", x: 2, y: 1, why: "真实 PR 数据；奖励是与 oracle 补丁的文本相似度，不执行代码。" },
  { id: "deepswe", label: "DeepSWE", x: 3, y: 2, why: "R2E-Gym 合成环境；多轮交互，测试通过为 1、否则为 0。" },
  { id: "ssr", label: "Self-play SWE-RL", x: 4, y: 3, why: "模型自己造 bug、自己修 bug，不用任何人工 issue 或测试。" },
]

const W = 640
const H = 360
const L = 104
const B = 44
const px = (x: number) => L + 30 + x * ((W - L - 60) / 4)
const py = (y: number) => H - B - 30 - y * ((H - B - 70) / 3)

export function ParadigmMap() {
  const [hover, setHover] = useState(6)
  const path = points
    .filter((p) => p.label !== "R2E-Gym")
    .map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x) + (p.dx ?? 0)} ${py(p.y) + (p.dy ?? 0)}`)
    .join(" ")
  const cur = points[hover]

  return (
    <DiagramFrame title="范式地图 · 两条轴上的迁移" hint="横轴：学习信号从哪来　纵轴：训练任务从哪来">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center">
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[480px] w-full">
            {ys.map((y, i) => (
              <g key={y}>
                <line x1={L} x2={W - 10} y1={py(i)} y2={py(i)} stroke="#f4f4f5" strokeWidth={26} />
                <text x={L - 8} y={py(i) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{y}</text>
              </g>
            ))}
            {xs.map((x, i) => (
              <text key={x} x={px(i)} y={H - 14} textAnchor="middle" className="fill-muted-foreground text-[11px]">{x}</text>
            ))}
            <path d={path} stroke="#18181b" strokeOpacity={0.25} strokeWidth={2} strokeDasharray="5 4" fill="none" className="flow-dash" />
            {points.map((p, i) => {
              const s = stageById[p.id]
              const cx = px(p.x) + (p.dx ?? 0)
              const cy = py(p.y) + (p.dy ?? 0)
              const on = hover === i
              return (
                <g key={p.label} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} className="cursor-pointer">
                  <circle cx={cx} cy={cy} r={on ? 11 : 8} fill={s.color} stroke="#fff" strokeWidth={2.5} className="transition-all" />
                  <text x={cx} y={cy - 15} textAnchor="middle" className="fill-foreground text-[11px] font-semibold" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 4 }}>
                    {p.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: stageById[cur.id].color }} />
            <span className="text-sm font-semibold">{cur.label}</span>
          </div>
          <div className="mb-2 text-[11px] text-muted-foreground">
            {xs[cur.x]} × {ys[cur.y]}
          </div>
          <p className="text-sm leading-relaxed">{cur.why}</p>
          <p className="mt-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            整条路线朝右上方移动：学习信号从“模仿老师”变成“环境反馈”，再变成“自我对弈”；训练任务从“人工标注”变成“自动合成”，再变成“模型自己生成”。每一步都在减少对人类数据的依赖。
          </p>
        </div>
      </div>
    </DiagramFrame>
  )
}
