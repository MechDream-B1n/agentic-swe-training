"use client"

import { useMemo, useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

type Status = "pass" | "fail" | "timeout" | "max_steps" | "max_ctx"
type Traj = { id: number; status: Status; steps: number; r: 0 | 1; note: string }

const group: Traj[] = [
  { id: 1, status: "pass", steps: 18, r: 1, note: "定位 → 复现 → 修复 → 回归测试 → 提交" },
  { id: 2, status: "fail", steps: 34, r: 0, note: "改错了文件，测试失败" },
  { id: 3, status: "pass", steps: 27, r: 1, note: "正常修复并提交" },
  { id: 4, status: "max_steps", steps: 100, r: 1, note: "第 12 步已修好，之后一直乱改，步数耗尽时测试碰巧通过" },
  { id: 5, status: "timeout", steps: 41, r: 0, note: "测试运行超过 20 分钟被终止" },
  { id: 6, status: "fail", steps: 22, r: 0, note: "修复不完整，P2P 测试挂了" },
  { id: 7, status: "max_ctx", steps: 63, r: 0, note: "反复 cat 大文件，撑爆 64k 上下文" },
  { id: 8, status: "fail", steps: 15, r: 0, note: "过早提交" },
]

const statusMeta: Record<Status, { label: string; cls: string }> = {
  pass: { label: "通过", cls: "bg-emerald-100 text-emerald-700" },
  fail: { label: "失败", cls: "bg-zinc-100 text-zinc-600" },
  timeout: { label: "超时", cls: "bg-amber-100 text-amber-700" },
  max_steps: { label: "步数耗尽", cls: "bg-amber-100 text-amber-700" },
  max_ctx: { label: "上下文超限", cls: "bg-amber-100 text-amber-700" },
}

const tricks = [
  { name: "Clip High", src: "DAPO", desc: "放宽 PPO 截断的上界，鼓励探索，稳定熵。" },
  { name: "去掉 KL 损失", src: "DAPO", desc: "不再把策略拴在 SFT 模型附近。" },
  { name: "去掉奖励标准差归一化", src: "Dr.GRPO", desc: "消除难度偏置：太难或太简单的题不会被放大。" },
  { name: "长度归一化", src: "Dr.GRPO", desc: "用最大上下文长度归一化 loss，避免错误回答越写越长。" },
  { name: "Leave-One-Out", src: "RLOO", desc: "基线用组内其他样本的均值，方差更低且无偏。" },
  { name: "Compact Filtering", src: "DeepSWE", desc: "屏蔽上下文超限、超时或步数耗尽的轨迹。" },
  { name: "去掉熵损失", src: "DeepSWE", desc: "熵损失会导致熵爆炸、训练崩溃。" },
]

function computeAdvantages(cf: boolean, loo: boolean, stdNorm: boolean) {
  const masked = (t: Traj) => cf && t.status !== "pass" && t.status !== "fail"
  const valid = group.filter((t) => !masked(t))
  const rs: number[] = valid.map((t) => t.r)
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length
  const std = Math.sqrt(rs.reduce((a, b) => a + (b - mean) ** 2, 0) / rs.length)
  return group.map((t) => {
    if (masked(t)) return { ...t, adv: null as number | null }
    const base = loo ? (rs.reduce((a, b) => a + b, 0) - t.r) / (rs.length - 1) : mean
    let adv = t.r - base
    if (stdNorm) adv = adv / (std + 1e-6)
    return { ...t, adv }
  })
}

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors", on ? "border-pink-500 bg-pink-50" : "hover:bg-muted")}
    >
      <span className={cn("relative h-4 w-7 shrink-0 rounded-full transition-colors", on ? "bg-pink-500" : "bg-zinc-300")}>
        <span className={cn("absolute top-0.5 size-3 rounded-full bg-white transition-all", on ? "left-3.5" : "left-0.5")} />
      </span>
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}

export function DeepSweDiagram() {
  const [cf, setCf] = useState(true)
  const [loo, setLoo] = useState(true)
  const [stdNorm, setStdNorm] = useState(false)
  const rows = useMemo(() => computeAdvantages(cf, loo, stdNorm), [cf, loo, stdNorm])
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.adv ?? 0)))

  return (
    <DiagramFrame title="图 6 · DeepSWE：多轮 Agentic RL 与 GRPO++" hint="切换开关，观察同一组轨迹的优势值如何变化">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 680 200" className="mb-2 min-w-[560px] w-full">
          <defs>
            <marker id="ds-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#ec4899" />
            </marker>
          </defs>
          <rect x="10" y="60" width="130" height="70" rx="12" fill="#fdf2f8" stroke="#ec4899" strokeWidth={1.8} />
          <text x="75" y="88" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">策略 Qwen3-32B</text>
          <text x="75" y="106" textAnchor="middle" className="fill-muted-foreground text-[10px]">思考 + 工具调用</text>

          <rect x="250" y="20" width="180" height="150" rx="12" fill="#fafafa" stroke="#a1a1aa" strokeWidth={1.5} />
          <text x="340" y="42" textAnchor="middle" className="fill-foreground text-[12px] font-semibold">R2E-Gym Docker 环境 ×512</text>
          {["execute_bash", "search", "file_editor", "finish"].map((t, i) => (
            <g key={t}>
              <rect x={268} y={54 + i * 26} width={144} height={20} rx={5} fill="#fff" stroke="#e4e4e7" />
              <text x={340} y={68 + i * 26} textAnchor="middle" className="fill-zinc-600 font-mono text-[10px]">{t}</text>
            </g>
          ))}

          <path d="M140 80 L248 70" stroke="#ec4899" strokeWidth={1.6} markerEnd="url(#ds-arrow)" className="flow-dash" />
          <path d="M248 120 L142 110" stroke="#ec4899" strokeWidth={1.6} strokeDasharray="4 3" markerEnd="url(#ds-arrow)" />
          <text x="195" y="62" textAnchor="middle" className="fill-pink-600 text-[10px]">动作</text>
          <text x="195" y="132" textAnchor="middle" className="fill-pink-600 text-[10px]">观测</text>
          <text x="195" y="160" textAnchor="middle" className="fill-muted-foreground text-[10px]">最多 100 步 · 64k 上下文</text>

          <rect x="520" y="20" width="150" height="56" rx="12" fill="#fdf2f8" stroke="#ec4899" strokeWidth={1.5} />
          <text x="595" y="44" textAnchor="middle" className="fill-foreground text-[12px] font-semibold">运行测试</text>
          <text x="595" y="61" textAnchor="middle" className="fill-muted-foreground text-[10px]">F2P 与 P2P 全通过 → 1，否则 0</text>

          <rect x="520" y="114" width="150" height="56" rx="12" fill="#ec4899" />
          <text x="595" y="138" textAnchor="middle" className="fill-white text-[12px] font-semibold">GRPO++ 更新</text>
          <text x="595" y="155" textAnchor="middle" className="fill-pink-50 text-[10px]">组内比较 · 屏蔽截断轨迹</text>

          <path d="M430 48 L518 48" stroke="#ec4899" strokeWidth={1.6} markerEnd="url(#ds-arrow)" />
          <text x="474" y="40" textAnchor="middle" className="fill-muted-foreground text-[10px]">finish</text>
          <path d="M595 76 L595 112" stroke="#ec4899" strokeWidth={1.6} markerEnd="url(#ds-arrow)" />
          <path d="M520 160 C 300 215, 110 200, 75 132" stroke="#ec4899" strokeWidth={1.6} strokeDasharray="5 4" fill="none" markerEnd="url(#ds-arrow)" className="flow-dash" />
        </svg>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Toggle on={cf} onChange={setCf} label="Compact Filtering" sub="屏蔽截断的轨迹" />
        <Toggle on={loo} onChange={setLoo} label="Leave-One-Out 基线" sub="基线不含自身" />
        <Toggle on={stdNorm} onChange={setStdNorm} label="除以奖励标准差" sub="原版 GRPO 有，GRPO++ 去掉" />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[2rem_5.5rem_1fr_5rem] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground sm:grid-cols-[2rem_6rem_1fr_3rem_9rem]">
          <span>#</span>
          <span>结局</span>
          <span className="hidden sm:block">轨迹</span>
          <span className="hidden sm:block">奖励</span>
          <span className="col-span-2 text-center sm:col-span-1">优势 A</span>
        </div>
        {rows.map((t) => (
          <div
            key={t.id}
            className={cn(
              "grid grid-cols-[2rem_5.5rem_1fr_5rem] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0 sm:grid-cols-[2rem_6rem_1fr_3rem_9rem]",
              t.adv === null && "opacity-45"
            )}
          >
            <span className="font-mono">{t.id}</span>
            <span className={cn("w-fit rounded px-1.5 py-0.5 text-[10px] font-medium", statusMeta[t.status].cls)}>{statusMeta[t.status].label}</span>
            <span className="hidden min-w-0 truncate text-muted-foreground sm:block" title={t.note}>
              {t.steps} 步 · {t.note}
            </span>
            <span className="hidden font-mono sm:block">{t.r}</span>
            <span className="col-span-2 sm:col-span-1">
              {t.adv === null ? (
                <span className="block text-center text-[10px] text-muted-foreground">不计入 loss</span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="relative h-3 flex-1 rounded bg-muted">
                    <span className="absolute left-1/2 top-0 h-3 w-px bg-zinc-400" />
                    <span
                      className={cn("absolute top-0 h-3 rounded transition-all duration-300", t.adv >= 0 ? "bg-emerald-500" : "bg-red-400")}
                      style={
                        t.adv >= 0
                          ? { left: "50%", width: `${(t.adv / maxAbs) * 50}%` }
                          : { right: "50%", width: `${(-t.adv / maxAbs) * 50}%` }
                      }
                    />
                  </span>
                  <span className="w-10 text-right font-mono text-[10px]">{t.adv >= 0 ? "+" : ""}{t.adv.toFixed(2)}</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {cf
          ? "开启 Compact Filtering 后，第 4 条“碰巧通过”的轨迹不再获得正优势，乱改文件的行为不会被强化；超时和上下文超限的轨迹也不会被错误惩罚。"
          : "关闭 Compact Filtering：第 4 条轨迹（前面修好、后面乱改）拿到了正优势，这些无意义的动作也会被强化，积累下来会导致奖励崩溃。"}
      </p>

      <div className="mt-6">
        <div className="mb-2 text-sm font-semibold">GRPO++ 的七个改动</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {tricks.map((t) => (
            <div key={t.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{t.name}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[9px]", t.src === "DeepSWE" ? "bg-pink-100 text-pink-700" : "bg-zinc-100 text-zinc-600")}>{t.src}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DiagramFrame>
  )
}
