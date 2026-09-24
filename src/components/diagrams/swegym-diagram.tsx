"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

type Node = { id: string; x: number; y: number; w: number; title: string; sub: string; detail: string }

const nodes: Node[] = [
  { id: "task", x: 10, y: 20, w: 120, title: "真实任务", sub: "2,438 个 · 11 仓库", detail: "每个实例 = 某个 commit 的代码库 + 人类写的 GitHub issue + 用来判定修复的单元测试（Fail→Pass / Pass→Pass）。" },
  { id: "env", x: 10, y: 120, w: 120, title: "可执行环境", sub: "每任务一个 Docker", detail: "预装好依赖，agent 可以在里面随便运行代码和测试。这是“能训练”的前提，也是最贵的部分（总计约 6TB 镜像）。" },
  { id: "rollout", x: 175, y: 70, w: 130, title: "强模型采样轨迹", sub: "OpenHands · 闭源强模型", detail: "用 OpenHands 的 CodeActAgent 脚手架，让闭源强模型在环境中多轮交互，产生大量候选轨迹。" },
  { id: "filter", x: 350, y: 70, w: 120, title: "测试过滤", sub: "保留 491 条成功", detail: "运行隐藏的单元测试：通过即成功轨迹。这一步把“可执行测试”变成了自动标注器，也就是拒绝采样。" },
  { id: "sft", x: 515, y: 20, w: 130, title: "SFT 策略模型", sub: "Qwen2.5-Coder-32B", detail: "用成功轨迹做监督微调（Rejection Sampling Fine-Tuning），学习完整的多轮行为：定位、复现、编辑、验证、提交。" },
  { id: "verifier", x: 515, y: 120, w: 130, title: "Verifier（ORM）", sub: "成功/失败轨迹训练", detail: "同时利用成功与失败的轨迹训练一个结果奖励模型，输入整条轨迹，输出成功概率。" },
]

const edges: [string, string][] = [
  ["task", "rollout"],
  ["env", "rollout"],
  ["rollout", "filter"],
  ["filter", "sft"],
  ["filter", "verifier"],
]

const bars = [
  { label: "Qwen2.5-Coder-32B 基座", v: 7.0, l: 3.0 },
  { label: "+ SWE-Gym SFT", v: 20.6, l: 15.3 },
  { label: "+ Verifier best-of-16", v: 32.0, l: 26.0 },
]

export function SweGymDiagram() {
  const [active, setActive] = useState("filter")
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const cur = byId[active]

  return (
    <DiagramFrame title="图 3 · SWE-Gym 训练流水线" hint="点击任一节点查看说明">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 660 190" className="min-w-[560px] w-full">
          <defs>
            <marker id="sg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
            </marker>
          </defs>
          {edges.map(([a, b]) => {
            const A = byId[a]
            const B = byId[b]
            const x1 = A.x + A.w
            const y1 = A.y + 25
            const x2 = B.x
            const y2 = B.y + 25
            const mx = (x1 + x2) / 2
            return (
              <path
                key={a + b}
                d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 2} ${y2}`}
                stroke="#10b981"
                strokeWidth={1.6}
                fill="none"
                markerEnd="url(#sg-arrow)"
                className="flow-dash"
              />
            )
          })}
          {nodes.map((n) => (
            <g key={n.id} onClick={() => setActive(n.id)} className="cursor-pointer">
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={50}
                rx={10}
                fill={active === n.id ? "#10b981" : "#ecfdf5"}
                stroke="#10b981"
                strokeWidth={1.5}
                className="transition-all"
              />
              <text x={n.x + n.w / 2} y={n.y + 22} textAnchor="middle" className={cn("text-[12px] font-semibold", active === n.id ? "fill-white" : "fill-foreground")}>
                {n.title}
              </text>
              <text x={n.x + n.w / 2} y={n.y + 38} textAnchor="middle" className={cn("text-[9.5px]", active === n.id ? "fill-emerald-50" : "fill-muted-foreground")}>
                {n.sub}
              </text>
            </g>
          ))}
          <text x="580" y="186" textAnchor="middle" className="fill-muted-foreground text-[10px]">推理时：采样 N 条轨迹 → verifier 选最优</text>
        </svg>
      </div>

      <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">
        <span className="font-semibold">{cur.title}：</span>
        {cur.detail}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>解决率（%）</span>
          <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-emerald-500" />SWE-bench Verified</span>
          <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-emerald-200" />SWE-bench Lite</span>
        </div>
        <div className="flex flex-col gap-3">
          {bars.map((b) => (
            <div key={b.label} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-xs sm:grid-cols-[12rem_1fr]">
              <span className="truncate">{b.label}</span>
              <div className="flex flex-col gap-1">
                {[
                  [b.v, "bg-emerald-500"],
                  [b.l, "bg-emerald-200"],
                ].map(([val, cls]) => (
                  <div key={cls as string} className="flex items-center gap-2">
                    <div className={cn("h-3 rounded-sm transition-all duration-700", cls as string)} style={{ width: `${((val as number) / 40) * 100}%` }} />
                    <span className="font-mono text-[11px]">{(val as number).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DiagramFrame>
  )
}
