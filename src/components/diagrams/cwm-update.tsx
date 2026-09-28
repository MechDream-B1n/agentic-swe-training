"use client"

import { useState } from "react"
import { DiagramFrame, StepControls } from "@/components/diagram-frame"
import { useStepper } from "@/hooks/use-stepper"
import { cn } from "@/lib/utils"

const steps = [
  {
    t: "采样一组",
    d: "同一道题用当前策略采样一组轨迹，通常是 8 条。软件工程任务里，模型在 Docker 中多轮使用 bash、edit、create 和 submit，最多 128 轮、131k token。Worker 一边采样，一边把轨迹送进队列。",
  },
  {
    t: "结束时打分",
    d: "每条轨迹结束时得到一个回报。软件工程：隐藏测试全过是 1；没过、但和 oracle 补丁的相似度高于 0.5 是 0；否则是 −1。竞赛编程和数学是对为 +1、错为 −1。Self-play 沿用同一种更新，只把这个回报换成注入者和修复者的标量。",
  },
  {
    t: "算优势",
    d: "优势 Â = R − μ。μ 是这一组回报按动作 token 数加权后的平均，不除以标准差。8 条回报完全相同，优势就是 0，这条轨迹不进入梯度。下面的例子假设每条轨迹一样长，所以 μ 就是 8 个数的平均。",
  },
  {
    t: "掩掉观察",
    d: "一条轨迹里交错着模型动作和环境观察。损失只加在模型生成的 token 上。命令输出、报错和测试日志乘上 0，不推动权重。",
  },
  {
    t: "截断梯度",
    d: "重要性比 ρ 是当前权重下这个 token 的概率，除以采样当时的概率。优势为正就提高这些 token 的概率，为负就降低。ρ 被限制在 0.8 到 1.25。没有把策略拉回参考模型的 KL 项。",
  },
  {
    t: "写回权重",
    d: "Trainer 从队列取出轨迹，凑满 token 上限就做一次梯度。同一组 8 条可以拆进不同的梯度步。CWM 每 4 次梯度广播一次新权重，落后超过 100 步的轨迹丢掉，学习率是 2.5×10⁻⁷。Self-play 把陈旧容忍收成 8 步，学习率到 3×10⁻⁶，共 150 个全局步。",
  },
]

const presets = [
  { id: "mix", label: "有高有低", rs: [1, 1, 0, 0, -1, -1, -1, -1] },
  { id: "pass", label: "8 条都过", rs: [1, 1, 1, 1, 1, 1, 1, 1] },
  { id: "fail", label: "8 条都不过", rs: [-1, -1, -1, -1, -1, -1, -1, -1] },
] as const

const tokens = [
  { who: "提示", train: false },
  { who: "动作", train: true },
  { who: "观察", train: false },
  { who: "动作", train: true },
  { who: "观察", train: false },
  { who: "动作", train: true },
]

export function CwmUpdate() {
  const flow = useStepper(steps.length, 2800)
  const [preset, setPreset] = useState<(typeof presets)[number]["id"]>("mix")
  const rs: number[] = [...presets.find((p) => p.id === preset)!.rs]
  const mu = rs.reduce((a, b) => a + b, 0) / rs.length
  const adv = rs.map((r) => r - mu)
  const cur = steps[flow.step]

  return (
    <DiagramFrame title="图 7 续 · CWM 的一次参数更新" hint="Self-play 沿用这套 GRPO 变体">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        CWM 在监督微调之后做联合强化学习：软件工程、竞赛编程和数学混在同一套权重里。更新没有价值网络。Self-play SWE-RL 使用同一个算法，任务换成自己出的 bug。
      </p>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 720 88" className="min-w-[640px] w-full">
          {steps.map((s, i) => (
            <g key={s.t} onClick={() => flow.setStep(i)} className="cursor-pointer">
              <rect x={i * 120 + 4} y={16} width={110} height={52} rx={10} fill={i === flow.step ? "#6366f1" : i < flow.step ? "#e0e7ff" : "#fafafa"} stroke="#6366f1" strokeWidth={i === flow.step ? 0 : 1.4} />
              <text x={i * 120 + 59} y={46} textAnchor="middle" className={cn("text-[12px] font-semibold", i === flow.step ? "fill-white" : "fill-foreground")}>{s.t}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-col gap-3">
        <div className="min-h-20 rounded-lg border-l-4 border-indigo-500 bg-indigo-50/70 p-3 text-sm leading-relaxed">
          <span className="font-semibold">{flow.step + 1}. {cur.t}。 </span>
          {cur.d}
        </div>
        <StepControls step={flow.step} total={steps.length} onChange={flow.setStep} playing={flow.playing} onTogglePlay={flow.togglePlay} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">一组 8 条的优势</div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px]",
                    preset === p.id ? "border-indigo-600 bg-indigo-600 text-white" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {adv.map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className={cn("w-full max-w-6 rounded-sm", a > 0 ? "bg-indigo-500" : a < 0 ? "bg-zinc-300" : "bg-zinc-200")}
                    style={{ height: `${Math.max(4, Math.abs(a) * 28)}px` }}
                  />
                </div>
                <div className="font-mono text-[10px]">{a === 0 ? "0" : a.toFixed(2)}</div>
                <div className="font-mono text-[10px] text-muted-foreground">R={rs[i]}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            μ = {mu.toFixed(2)}。优势为正的轨迹会被提高概率，为负的会被压低。全过或全不过时每一条都是 0，这组不更新权重。
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold">哪些 token 进入损失</div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {tokens.map((tok, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center text-[11px]",
                    tok.train ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-800" : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <div>{tok.who}</div>
                  <div className="mt-1 font-mono">M={tok.train ? 1 : 0}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              标成靛色的是模型写下的推理和工具调用。灰色的提示和观察留在上下文里，梯度不经过它们。
            </p>
          </div>
          <div className="rounded-xl border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
            <div className="font-mono text-[11px] text-foreground">Â = R − μ，ρ 限制在 [0.8, 1.25]</div>
            <p className="mt-2">
              CWM 的联合训练大约 40% 软件工程、40% 竞赛编程、20% 数学，另有约三分之一的 batch 用旧监督数据复习。Self-play 只保留这套更新，任务改成注入者和修复者。
            </p>
          </div>
        </div>
      </div>
    </DiagramFrame>
  )
}
