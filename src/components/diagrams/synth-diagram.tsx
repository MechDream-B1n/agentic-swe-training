"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

const strategies = [
  {
    id: "lm",
    name: "LM 改写 / 修改",
    desc: "让 LM 重写某个函数，或者有意引入一个细微错误。",
    diff: "def is_leap(y):\n-    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)\n+    return y % 4 == 0 and y % 100 != 0",
  },
  {
    id: "ast",
    name: "程序化 AST 变异",
    desc: "不调用 LM，直接对语法树做确定性变换：翻转条件、改运算符、删分支、调换语句顺序。",
    diff: "-    if start <= idx < end:\n+    if start < idx <= end:",
  },
  {
    id: "combine",
    name: "组合多个 bug",
    desc: "把已验证有效的多个 bug 合并成一个实例，得到跨函数/跨文件的更难任务。",
    diff: "  bug#12 (utils.py)  ✓ 已验证\n+ bug#37 (parser.py) ✓ 已验证\n= 新实例：2 个文件同时出错",
  },
  {
    id: "pr",
    name: "PR 镜像（反转 PR）",
    desc: "找到仓库历史上修复过 bug 的真实 PR，让 LM 在当前代码上把它“撤销”，重现真实 bug。",
    diff: "PR #4211: fix off-by-one in paginate()\n→ 在当前版本上反向应用\n-    return items[offset:offset + size]\n+    return items[offset:offset + size - 1]",
  },
]

const storage = [
  { name: "SWE-Gym", tasks: 2.4, tb: 6 },
  { name: "R2E-Gym 子集", tasks: 4.6, tb: 4 },
  { name: "SWE-smith", tasks: 50, tb: 0.295 },
]

type Cand = { id: string; exec: number; free: number; ok: boolean; note: string }
const cands: Cand[] = [
  { id: "A", exec: 1.0, free: 0.62, ok: false, note: "通过了生成的测试，但测试覆盖不足，其实是错的" },
  { id: "B", exec: 1.0, free: 0.78, ok: true, note: "正确修复" },
  { id: "C", exec: 0.4, free: 0.91, ok: false, note: "代码风格漂亮，打分模型很喜欢，但跑测试会失败" },
  { id: "D", exec: 0.8, free: 0.55, ok: false, note: "部分修复" },
  { id: "E", exec: 0.2, free: 0.3, ok: false, note: "明显错误" },
  { id: "F", exec: 1.0, free: 0.45, ok: false, note: "只针对测试硬编码了特殊情况" },
]

function SweSmithPanel() {
  const [sid, setSid] = useState("lm")
  const s = strategies.find((x) => x.id === sid)!
  const maxTasks = 50
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div>
        <svg viewBox="0 0 440 120" className="mb-3 w-full">
          <defs>
            <marker id="sm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" />
            </marker>
          </defs>
          {[
            [0, "1 个仓库", "1 个环境"],
            [110, "造 bug", "4 类策略"],
            [220, "跑测试", "有测试挂掉？"],
            [330, "LM 写 issue", "→ 任务实例"],
          ].map(([x, t, sub], i) => (
            <g key={i}>
              <rect x={(x as number) + 4} y={30} width={96} height={48} rx={10} fill={i === 1 ? "#f59e0b" : "#fffbeb"} stroke="#f59e0b" strokeWidth={1.5} />
              <text x={(x as number) + 52} y={51} textAnchor="middle" className={cn("text-[12px] font-semibold", i === 1 ? "fill-white" : "fill-foreground")}>{t}</text>
              <text x={(x as number) + 52} y={67} textAnchor="middle" className={cn("text-[9.5px]", i === 1 ? "fill-amber-50" : "fill-muted-foreground")}>{sub}</text>
              {i < 3 && <path d={`M${(x as number) + 100} 54 L${(x as number) + 112} 54`} stroke="#f59e0b" strokeWidth={1.6} markerEnd="url(#sm-arrow)" />}
            </g>
          ))}
          <path d="M272 78 L272 96" stroke="#a1a1aa" strokeWidth={1.2} strokeDasharray="3 3" />
          <text x="272" y="110" textAnchor="middle" className="fill-muted-foreground text-[9.5px]">否 → 丢弃</text>
          <text x="330" y="46" textAnchor="middle" className="fill-muted-foreground text-[9.5px]">是</text>
        </svg>
        <div className="mb-3 flex flex-wrap gap-2">
          {strategies.map((x) => (
            <button
              key={x.id}
              onClick={() => setSid(x.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                sid === x.id ? "border-amber-500 bg-amber-500 text-white" : "hover:bg-muted"
              )}
            >
              {x.name}
            </button>
          ))}
        </div>
        <p className="mb-2 text-sm text-muted-foreground">{s.desc}</p>
        <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed">
          {s.diff.split("\n").map((l, i) => (
            <div key={i} className={l.startsWith("+") ? "text-emerald-300" : l.startsWith("-") ? "text-red-300" : "text-zinc-300"}>
              {l}
            </div>
          ))}
        </pre>
      </div>
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">任务数（千）与环境存储</div>
        <div className="flex flex-col gap-4">
          {storage.map((d) => (
            <div key={d.name} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">{d.tasks}k 任务 · {d.tb >= 1 ? `${d.tb} TB` : `${Math.round(d.tb * 1000)} GB`}</span>
              </div>
              <div className="mb-1 h-2.5 rounded bg-muted">
                <div className="h-2.5 rounded bg-amber-500" style={{ width: `${(d.tasks / maxTasks) * 100}%` }} />
              </div>
              <div className="h-2.5 rounded bg-muted">
                <div className="h-2.5 rounded bg-zinc-400" style={{ width: `${(d.tb / 6) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-amber-500" />任务数</span>
            <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-zinc-400" />存储</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            关键在于环境复用：所有 bug 都注入到同一个仓库快照里，任务多了约 10 倍，存储反而少一个数量级。数据来自 SWE-smith 论文表 1。
          </p>
        </div>
      </div>
    </div>
  )
}

function R2EPanel() {
  const [w, setW] = useState(0.5)
  const scored = cands.map((c) => ({ ...c, score: w * c.exec + (1 - w) * c.free }))
  const best = Math.max(...scored.map((c) => c.score))
  const winners = scored.filter((c) => Math.abs(c.score - best) < 1e-9)
  const pick = winners[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 640 90" className="min-w-[520px] w-full">
          <defs>
            <marker id="r2e-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" />
            </marker>
          </defs>
          {[
            ["Commit 历史", "筛选有意义的改动"],
            ["自动构建环境", "安装依赖 · Docker"],
            ["F2P 测试", "收集已有 / LM 生成"],
            ["反向翻译", "代码变更 → issue"],
            ["任务实例", "8.1k · 13 仓库"],
          ].map(([t, sub], i) => (
            <g key={i}>
              <rect x={i * 128 + 2} y={18} width={112} height={50} rx={10} fill={i === 4 ? "#f59e0b" : "#fffbeb"} stroke="#f59e0b" strokeWidth={1.5} />
              <text x={i * 128 + 58} y={40} textAnchor="middle" className={cn("text-[12px] font-semibold", i === 4 ? "fill-white" : "fill-foreground")}>{t}</text>
              <text x={i * 128 + 58} y={56} textAnchor="middle" className={cn("text-[9.5px]", i === 4 ? "fill-amber-50" : "fill-muted-foreground")}>{sub}</text>
              {i < 4 && <path d={`M${i * 128 + 114} 43 L${i * 128 + 128} 43`} stroke="#f59e0b" strokeWidth={1.6} markerEnd="url(#r2e-arrow)" />}
            </g>
          ))}
          <text x="320" y="86" textAnchor="middle" className="fill-muted-foreground text-[10px]">SWE-GEN：不需要人写的 issue，也不需要人写的测试</text>
        </svg>
      </div>

      <div>
        <div className="mb-1 text-sm font-semibold">混合验证器（简化示意）</div>
        <p className="mb-4 text-xs text-muted-foreground">
          同一问题采样 6 个候选补丁。执行式验证器（跑生成的测试）区分度低，容易出现并列；免执行验证器（打分模型）会被代码风格误导。拖动滑块改变两者的权重。
        </p>
        <div className="mb-4 flex items-center gap-3 text-xs">
          <span className="w-20 shrink-0 text-right">只看打分模型</span>
          <input type="range" min={0} max={1} step={0.05} value={w} onChange={(e) => setW(parseFloat(e.target.value))} className="flex-1 accent-amber-500" />
          <span className="w-20 shrink-0">只看执行测试</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {scored.map((c) => {
            const isPick = c.id === pick.id
            const tied = winners.length > 1 && winners.some((x) => x.id === c.id)
            return (
              <div
                key={c.id}
                className={cn(
                  "flex flex-col items-center rounded-lg border p-2 text-center transition-all",
                  isPick && (c.ok ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500" : "border-red-500 bg-red-50 ring-2 ring-red-500"),
                  !isPick && tied && "border-amber-400 border-dashed"
                )}
              >
                <div className="text-sm font-bold">补丁 {c.id}</div>
                <div className="relative mt-2 h-24 w-8 rounded bg-muted">
                  <div className="absolute bottom-0 w-full rounded bg-amber-500 transition-all duration-300" style={{ height: `${c.score * 100}%` }} />
                </div>
                <div className="mt-1 font-mono text-[11px]">{c.score.toFixed(2)}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">执行 {c.exec.toFixed(1)} · 打分 {c.free.toFixed(2)}</div>
              </div>
            )
          })}
        </div>
        <div className={cn("mt-4 rounded-lg p-3 text-sm", pick.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900")}>
          选中补丁 {pick.id}：{pick.note}。
          {winners.length > 1 && ` 注意：有 ${winners.length} 个候选并列最高分，只能随机挑一个。`}
          {pick.ok ? " 两类信号互补，挑对了。" : " 单一信号的盲区导致选错。"}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">论文结果：两种验证器单独使用都在约 42–43% 饱和，组合后达到 51%（SWE-bench Verified，26 次采样）。</p>
      </div>
    </div>
  )
}

export function SynthDiagram() {
  const [tab, setTab] = useState<"smith" | "r2e">("smith")
  return (
    <DiagramFrame title="图 4 · 两条规模化路线：造 bug vs 挖 commit" hint="切换查看两篇工作">
      <div className="mb-5 inline-flex rounded-lg bg-muted p-1 text-sm">
        {(
          [
            ["smith", "SWE-smith：向仓库注入 bug"],
            ["r2e", "R2E-Gym：从 commit 生成任务"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn("rounded-md px-3 py-1.5 transition-all", tab === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "smith" ? <SweSmithPanel /> : <R2EPanel />}
    </DiagramFrame>
  )
}
