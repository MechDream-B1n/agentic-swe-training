"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

type Node = { id: string; x: number; y: number; w: number; title: string; sub: string; detail: string }

const nodes: Node[] = [
  { id: "task", x: 10, y: 20, w: 120, title: "真实任务", sub: "2,438 道 · 11 仓库", detail: "每题和 SWE-bench 同构：真实 GitHub issue，仓库停在修复前，交一份补丁。仓库刻意避开 SWE-bench 的 12 个测试仓库。这些测试只在训练时当 0/1 奖励，对外报分仍要拿到 SWE-bench 上再考一次。" },
  { id: "env", x: 10, y: 120, w: 120, title: "可执行环境", sub: "每题一个容器", detail: "预装依赖，agent 可以在里面跑命令和测试。SWE-bench 早期训练集没有这种环境和成功信号，只能模仿金补丁。这也是最贵的部分，镜像总计约 6TB。" },
  { id: "rollout", x: 175, y: 70, w: 130, title: "教师滚轨迹", sub: "CodeActAgent 2.1", detail: "OpenHands 里的通用 ReAct，不是写死的「先定位、再改代码、再挑补丁」。工具只有 bash 和文件编辑器，浏览器关掉了。教师是 gpt-4o-2024-08-06 和 claude-3-5-sonnet-20241022。模型自己决定何时结束，一条成功轨迹平均大约 19 轮，结束时抽出 git diff。" },
  { id: "filter", x: 350, y: 70, w: 120, title: "拒绝采样", sub: "留下 491 条", detail: "用 SWE-Gym 的测试判定这道题是否 resolved。没过的轨迹丢掉，不拿去教策略模型。「拒绝」的是失败样本。主实验只留 491 条，并且限制在 32k token 以内。" },
  { id: "sft", x: 515, y: 20, w: 130, title: "策略模型", sub: "Qwen2.5-Coder", detail: "Rejection Sampling Fine-Tuning，也叫 filtered behavior cloning：学生按负对数似然模仿成功轨迹里的动作。基座是 Qwen2.5-Coder-Instruct 的 7B、14B、32B。这不是在线强化学习，没有逐步价值函数，也没有 PPO。教师来采样叫 off-policy；学生自己采样、留下自己的成功再微调，叫 on-policy self-improvement。后一条在 MoatlessTools 上把 32B 的 Lite 做到 19.7%。" },
  { id: "verifier", x: 515, y: 120, w: 130, title: "验证器", sub: "成功和失败配平", detail: "同一个 Qwen2.5-Coder 再训一个结果判别模型。输入一条完整轨迹（Moatless 那条线则是任务、上下文和补丁拼起来的文本），输出一个 token，表示成功或失败。分数是「成功」相对「失败」的归一化概率。训练数据把两类配平，并混合教师轨迹和学生自己的轨迹。它不改代码，只在多份答案里挑一份。" },
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
          <text x="330" y="186" textAnchor="middle" className="fill-muted-foreground text-[10px]">失败轨迹不进策略模型，但和成功轨迹一起训练验证器</text>
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
