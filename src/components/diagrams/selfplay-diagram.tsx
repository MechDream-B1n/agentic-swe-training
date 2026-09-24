"use client"

import { useState } from "react"
import { DiagramFrame, StepControls } from "@/components/diagram-frame"
import { useStepper } from "@/hooks/use-stepper"
import { cn } from "@/lib/utils"

const W = 124
const H = 56

const nodes = [
  { x: 8, y: 30, t: "Docker 镜像", s: "只有源码与依赖" },
  { x: 176, y: 30, t: "注入者 Injector", s: "探索仓库 · 找测试方式" },
  { x: 344, y: 30, t: "bug 工件", s: "5 个文件" },
  { x: 512, y: 30, t: "一致性校验", s: "不通过 → r = −1" },
  { x: 512, y: 200, t: "构造修复环境", s: "打补丁 · 清空 .git" },
  { x: 344, y: 200, t: "修复者 Solver", s: "只看反向弱化补丁" },
  { x: 176, y: 200, t: "原始测试评估", s: "多次尝试 → 解决率 s" },
  { x: 8, y: 200, t: "高阶 bug", s: "失败的修复再利用" },
]

const details = [
  "输入只有一个预构建的 Docker 镜像：仓库源码加上装好的依赖。没有 issue，没有测试命令，也不告诉模型用什么测试框架。",
  "同一个模型用“注入者”提示启动，使用 Bash 和编辑器探索仓库，自己摸索怎么运行测试。论文发现，鼓励大段删除代码，或者参考 git 历史去回滚改动，比朴素提示产生的 bug 更有价值。",
  "注入者提交 5 个工件：bug_inject.diff（引入 bug）、test_script.sh（运行测试）、测试文件列表、test_parser.py（把输出解析成“测试名 → 通过/失败”）、test_weaken.diff（删除或弱化能暴露 bug 的测试）。",
  "执行校验：测试脚本在原代码上能跑出足够多的通过用例；注入后至少有若干测试失败；弱化补丁确实把 bug 藏住；逆变异测试要求每个被改动的文件都对 bug 有贡献。",
  "依次打上 bug_inject.diff 和 test_weaken.diff，然后删除 .git 目录重新初始化，防止修复者从历史记录里直接看到答案。",
  "修复者用“修复者”提示启动（参数相同）。它看不到任何自然语言描述，只看到反向的 test_weaken.diff，也就是“这些测试应该存在并通过”，以此作为形式化规格去写修复补丁。",
  "用原始（未弱化）的测试评估修复者的多次尝试：每次成功 +1、失败 −1；统计解决率 s，回传给注入者计算奖励，两个角色一起用 RL 更新。",
  "修复失败的尝试会留下新的错误状态，把它们包装成高阶 bug 再交给修复者，模拟开发者在修 bug 时引入新 bug 的过程。论文只做到二阶。",
]

const edges: { d: string; label?: string; lx?: number; ly?: number; active: number[] }[] = [
  { d: `M${8 + W} 58 L174 58`, active: [1] },
  { d: `M${176 + W} 58 L342 58`, active: [2] },
  { d: `M${344 + W} 58 L510 58`, active: [3] },
  { d: `M574 86 L574 198`, active: [4] },
  { d: `M512 228 L${344 + W + 2} 228`, active: [5] },
  { d: `M344 228 L${176 + W + 2} 228`, active: [6] },
  { d: `M238 200 L238 88`, label: "r_inject(s)", lx: 244, ly: 150, active: [6] },
  { d: `M176 228 L${8 + W + 2} 228`, label: "失败", lx: 144, ly: 222, active: [7] },
  { d: `M70 256 C 70 300, 406 300, 406 258`, label: "再次修复", lx: 238, ly: 308, active: [7] },
]

function RewardCurve() {
  const [alpha, setAlpha] = useState(0.6)
  const [s, setS] = useState(0.4)
  const w = 300
  const h = 170
  const px = (v: number) => 30 + v * (w - 40)
  const py = (v: number) => 12 + ((1 - v) / 2) * (h - 30)
  const rInject = (x: number) => (x <= 0 || x >= 1 ? -alpha : 1 - (1 + alpha) * x)
  const line = `M${px(0.0001)} ${py(1 - (1 + alpha) * 0.0001)} L${px(0.9999)} ${py(1 - (1 + alpha) * 0.9999)}`

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-center">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <line x1={px(0)} x2={px(1)} y1={py(0)} y2={py(0)} stroke="#d4d4d8" />
        <line x1={px(0)} x2={px(0)} y1={py(1)} y2={py(-1)} stroke="#d4d4d8" />
        {[-1, 0, 1].map((v) => (
          <text key={v} x={22} y={py(v) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{v}</text>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={px(v)} y={h - 2} textAnchor="middle" className="fill-muted-foreground text-[9px]">{v}</text>
        ))}
        <text x={px(1)} y={py(0) + 12} textAnchor="end" className="fill-muted-foreground text-[9px]">解决率 s</text>
        <path d={`M${px(0)} ${py(-1)} L${px(1)} ${py(1)}`} stroke="#a1a1aa" strokeDasharray="4 3" />
        <text x={px(0.22)} y={py(-0.72)} className="fill-zinc-500 text-[9px]">E[r_solve] = 2s−1</text>
        <path d={line} stroke="#6366f1" strokeWidth={2.2} fill="none" />
        <circle cx={px(0)} cy={py(-alpha)} r={3.5} fill="#6366f1" />
        <circle cx={px(1)} cy={py(-alpha)} r={3.5} fill="#6366f1" />
        <circle cx={px(0)} cy={py(1)} r={3.5} fill="#fff" stroke="#6366f1" strokeWidth={1.5} />
        <line x1={px(s)} x2={px(s)} y1={py(1)} y2={py(-1)} stroke="#6366f1" strokeOpacity={0.25} />
        <circle cx={px(s)} cy={py(rInject(s))} r={5} fill="#6366f1" />
        <circle cx={px(s)} cy={py(2 * s - 1)} r={4} fill="#a1a1aa" />
        <text x={px(0.2)} y={py(1) + 4} className="fill-indigo-600 text-[9.5px] font-semibold">r_inject</text>
      </svg>
      <div className="flex flex-col gap-3 text-xs">
        <label className="flex flex-col gap-1">
          <span>惩罚系数 α = {alpha.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.05} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} className="accent-indigo-500" />
        </label>
        <label className="flex flex-col gap-1">
          <span>bug 的解决率 s = {s.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.05} value={s} onChange={(e) => setS(parseFloat(e.target.value))} className="accent-indigo-500" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-indigo-50 p-2 text-center">
            <div className="font-mono text-lg font-bold text-indigo-700">{rInject(s).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">注入者奖励</div>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="font-mono text-lg font-bold">{(2 * s - 1).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">修复者期望奖励</div>
          </div>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          {s === 0
            ? "没人修得好：可能不可解，惩罚 −α。"
            : s === 1
              ? "谁都修得好：没有学习信号，同样惩罚 −α。"
              : "处于学习区：s 越低（越难）注入者奖励越高，修复者则希望 s 越高越好，两者形成对抗。"}
        </p>
      </div>
    </div>
  )
}

export function SelfPlayDiagram() {
  const { step, setStep, playing, togglePlay } = useStepper(nodes.length, 3200)

  return (
    <DiagramFrame title="图 7 · Self-play SWE-RL：一个模型，两个角色" hint="逐步走完一轮自博弈">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 650 316" className="min-w-[560px] w-full">
          <defs>
            <marker id="sp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
          <rect x="176" y="118" width="292" height="44" rx="22" fill="#eef2ff" stroke="#6366f1" strokeDasharray="4 3" />
          <text x="322" y="137" textAnchor="middle" className="fill-indigo-700 text-[11px] font-semibold">同一个策略 π_θ（参数共享）</text>
          <text x="322" y="152" textAnchor="middle" className="fill-indigo-500 text-[9.5px]">只靠提示区分两种角色，联合 RL 训练</text>

          {edges.map((e, i) => {
            const on = e.active.includes(step)
            return (
              <g key={i} style={{ color: on ? "#6366f1" : "#c4c4cc" }}>
                <path d={e.d} stroke="currentColor" strokeWidth={on ? 2.2 : 1.5} fill="none" markerEnd="url(#sp-arrow)" className={cn("transition-all", on && "flow-dash")} strokeDasharray={on ? "6 4" : undefined} />
                {e.label && (
                  <text x={e.lx} y={e.ly} textAnchor={e.lx === 238 ? "middle" : "start"} className="text-[9.5px]" fill="currentColor">
                    {e.label}
                  </text>
                )}
              </g>
            )
          })}

          {nodes.map((n, i) => {
            const on = i === step
            const role = i === 1 ? "inj" : i === 5 ? "sol" : null
            return (
              <g key={i} onClick={() => setStep(i)} className="cursor-pointer">
                <rect
                  x={n.x}
                  y={n.y}
                  width={W}
                  height={H}
                  rx={12}
                  fill={on ? "#6366f1" : role ? "#eef2ff" : "#fafafa"}
                  stroke={on || role ? "#6366f1" : "#d4d4d8"}
                  strokeWidth={role ? 2 : 1.4}
                  className="transition-all duration-300"
                />
                <text x={n.x + W / 2} y={n.y + 24} textAnchor="middle" className={cn("text-[12px] font-semibold", on ? "fill-white" : "fill-foreground")}>{n.t}</text>
                <text x={n.x + W / 2} y={n.y + 41} textAnchor="middle" className={cn("text-[9.5px]", on ? "fill-indigo-100" : "fill-muted-foreground")}>{n.s}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <div className="min-h-20 rounded-lg border-l-4 border-indigo-500 bg-indigo-50/60 p-3 text-sm">
          <span className="mr-1 font-semibold">{step + 1}. {nodes[step].t}：</span>
          {details[step]}
        </div>
        <StepControls step={step} total={nodes.length} onChange={setStep} playing={playing} onTogglePlay={togglePlay} />
      </div>

      <div className="mt-8">
        <div className="mb-1 text-sm font-semibold">注入者的奖励：鼓励“难但可解”</div>
        <p className="mb-3 text-xs text-muted-foreground">
          校验失败：r = −1；s = 0 或 s = 1：r = −α；0 &lt; s &lt; 1：r = 1 − (1+α)·s。拖动滑块观察两个角色的利益冲突。
        </p>
        <RewardCurve />
      </div>
    </DiagramFrame>
  )
}
