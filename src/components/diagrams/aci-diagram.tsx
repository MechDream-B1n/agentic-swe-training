"use client"

import { DiagramFrame, StepControls } from "@/components/diagram-frame"
import { useStepper } from "@/hooks/use-stepper"
import { cn } from "@/lib/utils"

type Step = {
  thought: string
  action: string
  obs: string
  kind: "nav" | "edit" | "guard" | "run" | "submit"
}

const steps: Step[] = [
  {
    thought: "issue 说嵌套 CompoundModel 的 separability_matrix 算错了，先找实现文件。",
    action: "find_file separable.py",
    obs: 'Found 1 matches for "separable.py":\n/astropy/modeling/separable.py',
    kind: "nav",
  },
  {
    thought: "打开文件。ACI 的查看器一次只给 100 行，并带行号。",
    action: "open astropy/modeling/separable.py 240",
    obs: "[File: separable.py (317 lines total)]\n(189 more lines above)\n240: def _cstack(left, right):\n...\n245:     cright[-right.shape[0]:, -right.shape[1]:] = 1\n(72 more lines below)",
    kind: "nav",
  },
  {
    thought: "先写脚本复现 bug，确认问题存在。",
    action: "python reproduce.py",
    obs: "[[ True  True False False]\n [ True  True False False]\n [False False  True  True]\n [False False  True  True]]   ← 应为对角块",
    kind: "run",
  },
  {
    thought: "第 245 行把右侧矩阵写死成 1，应该用 right 本身。",
    action: "edit 245:245\ncright[-right.shape[0]:, -right.shape[1]:] = right\nend_of_edit",
    obs: "Your proposed edit has introduced new syntax error(s):\n- E999 IndentationError: unexpected indent\nYour changes have NOT been applied.",
    kind: "guard",
  },
  {
    thought: "linter 护栏拦下了缩进错误，修正缩进后重试。",
    action: "edit 245:245\n    cright[-right.shape[0]:, -right.shape[1]:] = right\nend_of_edit",
    obs: "[File: separable.py (317 lines total)]\n245:     cright[-right.shape[0]:, -right.shape[1]:] = right\nFile updated.",
    kind: "edit",
  },
  {
    thought: "再跑一次复现脚本验证。",
    action: "python reproduce.py",
    obs: "[[ True False False False]\n [False  True False False]\n [False False  True False]\n [False False False  True]]   ✓",
    kind: "run",
  },
  {
    thought: "结果正确，提交补丁。",
    action: "submit",
    obs: "diff --git a/astropy/modeling/separable.py ...\n-    cright[...] = 1\n+    cright[...] = right",
    kind: "submit",
  },
]

const kindColor: Record<Step["kind"], string> = {
  nav: "#0ea5e9",
  run: "#10b981",
  edit: "#8b5cf6",
  guard: "#ef4444",
  submit: "#f59e0b",
}

export function AciDiagram() {
  const { step, setStep, playing, togglePlay } = useStepper(steps.length, 2600)
  const s = steps[step]
  const c = kindColor[s.kind]

  return (
    <DiagramFrame title="图 1 · Agent-Computer Interface 中的一条轨迹" hint="逐步查看 Thought → Action → Observation">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <svg viewBox="0 0 340 300" className="w-full">
          <defs>
            <marker id="aci-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>

          <g>
            <rect x="110" y="10" width="120" height="56" rx="12" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth={2} />
            <text x="170" y="34" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">LM（GPT-4）</text>
            <text x="170" y="52" textAnchor="middle" className="fill-muted-foreground text-[10px]">Thought + Action</text>
          </g>

          <g>
            <rect x="30" y="112" width="280" height="76" rx="12" fill="#fff" stroke={c} strokeWidth={2.5} strokeDasharray="0" />
            <text x="170" y="132" textAnchor="middle" className="fill-foreground text-[12px] font-semibold">ACI 接口层</text>
            {[
              ["find_file", "nav"],
              ["open/goto", "nav"],
              ["edit+lint", s.kind === "guard" ? "guard" : "edit"],
              ["python", "run"],
              ["submit", "submit"],
            ].map(([label, k], i) => {
              const active =
                (k === s.kind) ||
                (label === "edit+lint" && (s.kind === "edit" || s.kind === "guard"))
              return (
                <g key={label}>
                  <rect
                    x={40 + i * 54}
                    y={144}
                    width={50}
                    height={30}
                    rx={6}
                    fill={active ? kindColor[k as Step["kind"]] : "#f4f4f5"}
                    className="transition-all duration-300"
                  />
                  <text
                    x={65 + i * 54}
                    y={163}
                    textAnchor="middle"
                    className={cn("text-[8px] font-mono", active ? "fill-white" : "fill-zinc-500")}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </g>

          <g>
            <rect x="80" y="234" width="180" height="56" rx="12" fill="#f4f4f5" stroke="#a1a1aa" strokeWidth={1.5} />
            <text x="170" y="258" textAnchor="middle" className="fill-foreground text-[12px] font-semibold">计算机：仓库 + Shell</text>
            <text x="170" y="276" textAnchor="middle" className="fill-muted-foreground text-[10px]">Docker 沙箱</text>
          </g>

          <g style={{ color: c }} className="transition-colors">
            <path d="M150 66 L150 110" stroke="currentColor" strokeWidth={2} markerEnd="url(#aci-arrow)" />
            <path d="M150 188 L150 232" stroke="currentColor" strokeWidth={2} markerEnd="url(#aci-arrow)" />
          </g>
          <g style={{ color: s.kind === "guard" ? "#ef4444" : "#71717a" }}>
            <path d="M190 232 L190 190" stroke="currentColor" strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#aci-arrow)" opacity={s.kind === "guard" ? 0.25 : 1} />
            <path d="M190 110 L190 68" stroke="currentColor" strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#aci-arrow)" />
          </g>
          <text x="140" y="92" textAnchor="end" className="fill-muted-foreground text-[10px]">动作</text>
          <text x="200" y="92" className="fill-muted-foreground text-[10px]">精简反馈</text>
          {s.kind === "guard" && (
            <text x="200" y="215" className="fill-red-500 text-[10px] font-semibold">护栏拦截，未写入</text>
          )}
        </svg>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-lg border-l-4 bg-muted/50 p-3 text-sm" style={{ borderColor: c }}>
            <div className="mb-1 text-[11px] font-medium text-muted-foreground">Thought · 第 {step + 1}/{steps.length} 步</div>
            {s.thought}
          </div>
          <div className="overflow-hidden rounded-lg bg-zinc-950 font-mono text-[12px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-400">bash-$ Action</div>
            <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-2 text-sky-300">{s.action}</pre>
            <div className="border-y border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-400">Observation</div>
            <pre
              className={cn(
                "min-h-24 overflow-x-auto whitespace-pre-wrap px-3 py-2",
                s.kind === "guard" ? "text-red-300" : "text-zinc-300"
              )}
            >
              {s.obs}
            </pre>
          </div>
          <StepControls step={step} total={steps.length} onChange={setStep} playing={playing} onTogglePlay={togglePlay} />
        </div>
      </div>
    </DiagramFrame>
  )
}
