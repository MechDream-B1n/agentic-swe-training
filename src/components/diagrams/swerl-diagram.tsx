"use client"

import { useMemo, useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { Textarea } from "@/components/ui/textarea"
import { sequenceRatio } from "@/lib/sequence-matcher"
import { cn } from "@/lib/utils"

const ORACLE = `<<<<<<< SEARCH
        cright[-right.shape[0]:, -right.shape[1]:] = 1
=======
        cright[-right.shape[0]:, -right.shape[1]:] = right
>>>>>>> REPLACE`

const presets = [
  { id: "same", label: "与 oracle 一致", text: ORACLE, correct: true },
  {
    id: "alt",
    label: "写法不同，同样正确",
    text: `<<<<<<< SEARCH
        cright[-right.shape[0]:, -right.shape[1]:] = 1
=======
        rows, cols = right.shape
        cright[-rows:, -cols:] = right
>>>>>>> REPLACE`,
    correct: true,
  },
  {
    id: "near",
    label: "只差一个词，但是错的",
    text: `<<<<<<< SEARCH
        cright[-right.shape[0]:, -right.shape[1]:] = 1
=======
        cright[-right.shape[0]:, -right.shape[1]:] = left
>>>>>>> REPLACE`,
    correct: false,
  },
  {
    id: "bad",
    label: "格式错误",
    text: `把 245 行的 = 1 改成 = right 就行了。`,
    correct: false,
  },
]

function reward(pred: string) {
  const ok = /<<<<<<< SEARCH[\s\S]*?=======[\s\S]*?>>>>>>> REPLACE/.test(pred)
  if (!ok) return { r: -1, formatOk: false }
  return { r: sequenceRatio(pred, ORACLE), formatOk: true }
}

export function SweRlDiagram() {
  const [pred, setPred] = useState(presets[1].text)
  const [presetId, setPresetId] = useState<string | null>("alt")
  const { r, formatOk } = useMemo(() => reward(pred), [pred])
  const preset = presets.find((p) => p.id === presetId)

  return (
    <DiagramFrame title="图 5 · SWE-RL：免执行的相似度奖励" hint="修改右侧补丁，实时计算奖励">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 680 170" className="mb-4 min-w-[560px] w-full">
          <defs>
            <marker id="rl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#ef4444" />
            </marker>
          </defs>
          {[
            { x: 0, t: "GitHub PR", s: "24M 事件 → 273k 种子" },
            { x: 140, t: "提示", s: "issue + 相关文件全文" },
            { x: 280, t: "策略 LLM", s: "<think> 推理 → 编辑" },
            { x: 420, t: "奖励", s: "格式错 −1 / 相似度" },
            { x: 560, t: "GRPO", s: "组内相对优势更新" },
          ].map((n, i) => (
            <g key={i}>
              <rect x={n.x + 2} y={30} width={116} height={54} rx={10} fill={i === 3 ? "#ef4444" : "#fef2f2"} stroke="#ef4444" strokeWidth={1.5} />
              <text x={n.x + 60} y={53} textAnchor="middle" className={cn("text-[12.5px] font-semibold", i === 3 ? "fill-white" : "fill-foreground")}>{n.t}</text>
              <text x={n.x + 60} y={70} textAnchor="middle" className={cn("text-[9.5px]", i === 3 ? "fill-red-50" : "fill-muted-foreground")}>{n.s}</text>
              {i < 4 && <path d={`M${n.x + 118} 57 L${n.x + 140} 57`} stroke="#ef4444" strokeWidth={1.6} markerEnd="url(#rl-arrow)" />}
            </g>
          ))}
          <path d="M620 84 C 620 140, 340 140, 340 88" stroke="#ef4444" strokeWidth={1.6} strokeDasharray="5 4" fill="none" markerEnd="url(#rl-arrow)" className="flow-dash" />
          <text x="480" y="148" textAnchor="middle" className="fill-red-500 text-[10px]">更新策略参数</text>
          <text x="480" y="20" textAnchor="middle" className="fill-muted-foreground text-[10px]">oracle 补丁（真实合并的 PR）</text>
          <path d="M480 24 L480 28" stroke="#a1a1aa" />
          <text x="340" y="165" textAnchor="middle" className="fill-muted-foreground text-[10px]">单轮生成，不与环境交互；评测时用 Agentless Mini 流水线</text>
        </svg>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">Oracle 补丁（来自真实 PR）</div>
          <pre className="flex-1 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-200">{ORACLE}</pre>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">模型输出（可编辑）</div>
          <Textarea
            value={pred}
            onChange={(e) => {
              setPred(e.target.value)
              setPresetId(null)
            }}
            spellCheck={false}
            className="min-h-40 flex-1 font-mono text-[11.5px]"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPred(p.text)
              setPresetId(p.id)
            }}
            className={cn("rounded-full border px-3 py-1 text-xs", presetId === p.id ? "border-red-500 bg-red-500 text-white" : "hover:bg-muted")}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center">
          <div className={cn("font-mono text-4xl font-bold tabular-nums", r < 0 ? "text-red-600" : "text-foreground")}>{r.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground">奖励 r</div>
        </div>
        <div>
          <div className="relative h-4 rounded-full bg-gradient-to-r from-red-200 via-zinc-100 to-emerald-200">
            <div className="absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded bg-foreground transition-all duration-300" style={{ left: `${((r + 1) / 2) * 100}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>−1 格式错误</span>
            <span>0</span>
            <span>1 完全一致</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {!formatOk
              ? "没有合法的 SEARCH/REPLACE 块，直接给 −1。"
              : preset && !preset.correct
                ? "文本几乎一样，奖励很高，但这个补丁是错的：相似度奖励没法判断语义。"
                : preset?.id === "alt"
                  ? "功能上完全正确，但写法不同，奖励明显变低：这就是相似度奖励的主要局限。"
                  : "difflib.SequenceMatcher 字符级相似度，范围 0–1（本页用 TypeScript 复刻了该算法）。"}
          </p>
        </div>
      </div>
    </DiagramFrame>
  )
}
