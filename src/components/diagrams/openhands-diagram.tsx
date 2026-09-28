"use client"

import { DiagramFrame, StepControls } from "@/components/diagram-frame"
import { useStepper } from "@/hooks/use-stepper"
import { cn } from "@/lib/utils"

const steps = [
  {
    who: "事件流",
    kind: "事件",
    text: "User Message\n请修复 separable.py 里嵌套模型的可分性矩阵。",
    note: "任务先写成一条事件。事件流只负责把后来的动作和观察追加进去。模型下一轮读到的上下文，是从这份记录里取出的视图。",
  },
  {
    who: "CodeActAgent",
    kind: "Action",
    text: "thought: 先按文件名定位。\nCmdRunAction\nfind . -name separable.py",
    note: "模型用工具调用发出动作。回复正文记为 thought，和动作一起进入事件流。这一轮没有第二次模型调用。",
  },
  {
    who: "Docker Runtime",
    kind: "Observation",
    text: "CmdOutputObservation\n./astropy/modeling/separable.py\nexit code: 0",
    note: "沙箱里的 API 在仍活着的 shell 中执行。标准输出、标准错误和退出码写成观察，再追加到事件流。",
  },
  {
    who: "CodeActAgent",
    kind: "Action",
    text: "str_replace_editor\ncommand: view\npath: separable.py\nview_range: [230, 260]",
    note: "编辑器是后来加上的专用工具：带行号查看、按原文精确替换、可以撤销。它不是 SWE-agent 那种写坏就自动跑 linter 并回滚的 edit。",
  },
  {
    who: "CodeActAgent",
    kind: "Action",
    text: "IPythonRunCellAction\nfrom astropy.modeling import separability_matrix\nprint(separability_matrix(model))",
    note: "同一沙箱里还有 Jupyter。Python 动作可以调用已经导入的 AgentSkills。SWE-Gym 采集轨迹时关掉了浏览器，bash 和编辑器是主要工具。",
  },
  {
    who: "评测",
    kind: "结束",
    text: "AgentFinish / bash exit\n→ git diff\n→ SWE-bench 隐藏测试",
    note: "模型可以发结束动作。若它停下来向人提问，SWE-bench 评测会要求它继续，并用 execute_bash exit 收尾。补丁从容器里的 diff 取出，不在训练循环里打分。",
  },
]

const choices = [
  ["CmdRunAction", "任意 bash。会话保持，下一条命令还能用当前目录。"],
  ["IPythonRunCellAction", "一段 Python。工具函数以 AgentSkills 的形式已经在解释器里。"],
  ["编辑器", "查看、创建、按字符串替换、撤销。匹配不到原文就报错，不自动回滚语法错误。"],
  ["结束", "AgentFinish，或在评测里执行 exit。浏览器在通用版本里可选，SWE-Gym 关掉了它。"],
]

export function OpenHandsDiagram() {
  const { step, setStep, playing, togglePlay } = useStepper(steps.length, 2400)
  const cur = steps[step]
  return (
    <DiagramFrame title="图 2 · 一条事件流里的修复" hint="点击步骤查看 Action 和 Observation">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 680 168" className="min-w-[560px] w-full">
          <rect x="188" y="18" width="304" height="132" rx="16" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="340" y="40" textAnchor="middle" className="fill-violet-800 text-[12px] font-semibold">事件流（只追加）</text>
          {steps.map((s, i) => (
            <g key={s.kind + i} onClick={() => setStep(i)} className="cursor-pointer">
              <rect x={204} y={50 + i * 15} width={272} height={13} rx={3} fill={i === step ? "#8b5cf6" : i < step ? "#ddd6fe" : "#ffffff"} />
              <text x={214} y={60 + i * 15} className={cn("text-[8px]", i === step ? "fill-white" : "fill-zinc-600")}>
                {i + 1}. {s.who} · {s.kind}
              </text>
            </g>
          ))}
          <rect x="16" y="48" width="150" height="72" rx="12" fill={cur.who === "CodeActAgent" ? "#8b5cf6" : "#fafafa"} stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="91" y="78" textAnchor="middle" className={cn("text-[12px] font-semibold", cur.who === "CodeActAgent" ? "fill-white" : "fill-foreground")}>CodeActAgent</text>
          <text x="91" y="96" textAnchor="middle" className={cn("text-[9px]", cur.who === "CodeActAgent" ? "fill-violet-100" : "fill-muted-foreground")}>工具调用，不改权重</text>
          <rect x="514" y="48" width="150" height="72" rx="12" fill={cur.who === "Docker Runtime" ? "#8b5cf6" : "#fafafa"} stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="589" y="78" textAnchor="middle" className={cn("text-[12px] font-semibold", cur.who === "Docker Runtime" ? "fill-white" : "fill-foreground")}>Docker 沙箱</text>
          <text x="589" y="96" textAnchor="middle" className={cn("text-[9px]", cur.who === "Docker Runtime" ? "fill-violet-100" : "fill-muted-foreground")}>bash + IPython</text>
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">{cur.text}</pre>
        <div className="flex flex-col gap-3">
          <p className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-3 text-sm leading-relaxed text-violet-950">
            <span className="font-semibold">{step + 1}. {cur.who}。 </span>
            {cur.note}
          </p>
          <StepControls step={step} total={steps.length} onChange={setStep} playing={playing} onTogglePlay={togglePlay} />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map(([title, body]) => (
          <div key={title} className="rounded-lg border p-3">
            <div className="font-mono text-xs font-semibold">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </DiagramFrame>
  )
}
