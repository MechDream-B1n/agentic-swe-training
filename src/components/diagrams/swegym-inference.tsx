"use client"

import { useState } from "react"
import { DiagramFrame, StepControls } from "@/components/diagram-frame"
import { useStepper } from "@/hooks/use-stepper"
import { cn } from "@/lib/utils"

type Mode = "once" | "tts"

const once = [
  { t: "题目容器", s: "停在修复前", d: "SWE-bench 的一道题：仓库停在修复前的提交。评测用的隐藏测试始终不给模型看。SWE-Gym 的测试只在训练时当奖励。" },
  { t: "CodeAct 循环", s: "温度 0", d: "微调后的策略模型在 CodeActAgent 里循环调用 bash 和文件编辑器，直到自己结束，或者步数用完。温度设为 0。" },
  { t: "抽出补丁", s: "git diff", d: "结束时从容器里抽出 git diff。这一份补丁就是模型的答案。" },
  { t: "SWE-bench 评测", s: "隐藏测试", d: "补丁交给 SWE-bench 的评测容器。32B 这一档：Lite 15.3%，Verified 20.6%，相对未微调大约各加 12 到 14 个百分点。" },
]

const tts = [
  { t: "重复采样", s: "1 条温度 0，其后 0.5", d: "同一道题采样多条轨迹。第一条温度 0，后面的温度 0.5。论文里拿来挑的是 16 条。" },
  { t: "16 份补丁", s: "每条一个 diff", d: "每条轨迹各自结束，各自抽出一份 git diff。这些补丁还没有经过 SWE-bench 的隐藏测试。" },
  { t: "验证器打分", s: "32B 判别模型", d: "验证器读入一条完整轨迹，输出「成功」或「失败」一个 token。分数是「成功」相对「失败」的归一化概率。它不改代码。" },
  { t: "挑最高分", s: "再去考试", d: "取得分最高的那份补丁，交给 SWE-bench。32B 策略加 32B 验证器：Verified 32.0%，Lite 26.0%。16 条里至少有一条做对的上限更高，Verified 大约 42.8%。中间的差距是验证器还没能把对的那条都挑出来。" },
]

const samples = [
  { id: "1", score: 0.22, ok: false },
  { id: "2", score: 0.81, ok: false },
  { id: "3", score: 0.47, ok: true },
  { id: "4", score: 0.63, ok: false },
  { id: "5", score: 0.15, ok: false },
  { id: "6", score: 0.58, ok: false },
  { id: "7", score: 0.91, ok: false },
  { id: "8", score: 0.34, ok: false },
]

const scores = [
  { label: "只跑一次", v: 20.6, note: "温度 0" },
  { label: "验证器 16 选 1", v: 32.0, note: "论文结果" },
  { label: "16 条里至少一对", v: 42.8, note: "挑选上限" },
]

export function SweGymInference() {
  const [mode, setMode] = useState<Mode>("once")
  const steps = mode === "once" ? once : tts
  const { step, setStep, playing, togglePlay } = useStepper(steps.length, 2400)
  const cur = steps[Math.min(step, steps.length - 1)]
  const showPicker = mode === "tts" && step >= 2

  return (
    <DiagramFrame title="图 3 续 · 推理流水线" hint="训练场的奖励不拿来报榜">
      <div className="mb-4 inline-flex rounded-lg bg-muted p-1 text-sm">
        {(
          [
            ["once", "只跑一次"],
            ["tts", "16 条里挑 1 条"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setMode(k)
              setStep(0)
            }}
            className={cn("rounded-md px-3 py-1.5 transition-all", mode === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="overflow-x-auto">
          <svg viewBox="0 0 560 150" className="min-w-[480px] w-full">
            <defs>
              <marker id="inf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
              </marker>
            </defs>
            {steps.map((s, i) => (
              <g key={s.t}>
                <rect x={i * 140 + 4} y={36} width={124} height={58} rx={12} fill={i === step ? "#10b981" : i < step ? "#d1fae5" : "#fafafa"} stroke="#10b981" strokeWidth={i === step ? 0 : 1.5} className="transition-all" />
                <text x={i * 140 + 66} y={60} textAnchor="middle" className={cn("text-[12px] font-semibold", i === step ? "fill-white" : "fill-foreground")}>{s.t}</text>
                <text x={i * 140 + 66} y={78} textAnchor="middle" className={cn("text-[10px]", i === step ? "fill-emerald-50" : "fill-muted-foreground")}>{s.s}</text>
                {i < steps.length - 1 && <path d={`M${i * 140 + 128} 65 L${i * 140 + 142} 65`} stroke="#10b981" strokeWidth={1.6} markerEnd="url(#inf-arrow)" />}
              </g>
            ))}
            <text x="280" y="24" textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {mode === "once" ? "一份补丁，直接交卷" : "多份补丁，验证器先挑再交卷"}
            </text>
            <text x="280" y="128" textAnchor="middle" className="fill-muted-foreground text-[10px]">隐藏测试只出现在最后的 SWE-bench 容器里</text>
          </svg>
        </div>
        <div className="flex flex-col gap-3">
          <div className="min-h-28 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/70 p-3 text-sm leading-relaxed">
            <span className="font-semibold">{step + 1}. {cur.t}。 </span>
            {cur.d}
          </div>
          <StepControls step={step} total={steps.length} onChange={setStep} playing={playing} onTogglePlay={togglePlay} />
        </div>
      </div>

      {showPicker && (
        <div className="mt-5">
          <div className="mb-2 text-xs text-muted-foreground">示意：8 条轨迹的验证器分数。绿色才是真正做对的，最高分不一定是它。</div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {samples.map((s) => {
              const picked = s.score === Math.max(...samples.map((x) => x.score))
              return (
                <div key={s.id} className={cn("rounded-lg border p-2 text-center", picked && "border-emerald-500 ring-2 ring-emerald-500", s.ok && !picked && "border-dashed border-amber-400")}>
                  <div className="text-[11px] font-semibold">轨迹 {s.id}</div>
                  <div className="relative mx-auto mt-1 h-16 w-5 rounded bg-muted">
                    <div className={cn("absolute bottom-0 w-full rounded", s.ok ? "bg-amber-400" : "bg-emerald-500")} style={{ height: `${s.score * 100}%` }} />
                  </div>
                  <div className="mt-1 font-mono text-[10px]">{s.score.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">{s.ok ? "其实做对" : picked ? "被挑中" : "做错"}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 text-xs text-muted-foreground">SWE-bench Verified，32B（%）</div>
        <div className="flex flex-col gap-2">
          {scores.map((s) => (
            <div key={s.label} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-xs sm:grid-cols-[9rem_1fr]">
              <span>
                {s.label}
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{s.note}</span>
              </span>
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-sm bg-emerald-500" style={{ width: `${(s.v / 50) * 100}%`, opacity: s.v === 42.8 ? 0.45 : 1 }} />
                <span className="font-mono text-[11px]">{s.v.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DiagramFrame>
  )
}
