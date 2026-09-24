"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

type Turn = { role: "agent" | "env"; text: string; error?: boolean }

const jsonTurns: Turn[] = [
  { role: "agent", text: '{"tool": "get_weather", "args": {"city": "北京"}}' },
  { role: "env", text: '{"temp_c": 24}' },
  { role: "agent", text: '{"tool": "get_weather", "args": {"city": "上海"}}' },
  { role: "env", text: '{"temp_c": 29}' },
  { role: "agent", text: '{"tool": "get_weather", "args": {"city": "深圳"}}' },
  { role: "env", text: '{"temp_c": 31}' },
  { role: "agent", text: '{"tool": "c_to_f", "args": {"c": 31}}' },
  { role: "env", text: '{"f": 87.8}' },
  { role: "agent", text: "最热的是深圳，87.8°F" },
]

const codeTurns: Turn[] = [
  {
    role: "agent",
    text: 'temps = {c: get_weather(c)["temp"] for c in ["北京", "上海", "深圳"]}\nhot = max(temps, key=temps.get)\nprint(hot, c_to_f(temps[hot]))',
  },
  { role: "env", text: "KeyError: 'temp'  （返回字段其实叫 temp_c）", error: true },
  {
    role: "agent",
    text: 'temps = {c: get_weather(c)["temp_c"] for c in ["北京", "上海", "深圳"]}\nhot = max(temps, key=temps.get)\nprint(hot, c_to_f(temps[hot]))',
  },
  { role: "env", text: "深圳 87.8" },
  { role: "agent", text: "最热的是深圳，87.8°F" },
]

export function CodeActDiagram() {
  const [mode, setMode] = useState<"json" | "code">("json")
  const turns = mode === "json" ? jsonTurns : codeTurns
  const agentTurns = (t: Turn[]) => t.filter((x) => x.role === "agent").length

  return (
    <DiagramFrame title="图 2 · 同一任务：JSON 工具调用 vs 代码动作" hint="任务：三个城市中哪个最热？结果换算为华氏度">
      <div className="mb-4 inline-flex rounded-lg bg-muted p-1 text-sm">
        {(
          [
            ["json", "JSON 工具调用"],
            ["code", "CodeAct（Python 代码）"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={cn(
              "rounded-md px-3 py-1.5 transition-all",
              mode === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ol className="flex max-h-[380px] flex-col gap-2 overflow-y-auto pr-1">
          {turns.map((t, i) => (
            <li
              key={`${mode}-${i}`}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-1 fill-mode-both flex gap-2",
                t.role === "env" && "pl-8"
              )}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span
                className={cn(
                  "mt-1 h-5 shrink-0 rounded px-1.5 text-[10px] font-medium leading-5",
                  t.role === "agent" ? "bg-violet-100 text-violet-700" : t.error ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {t.role === "agent" ? "Agent" : t.error ? "报错" : "环境"}
              </span>
              <pre
                className={cn(
                  "min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap rounded-md px-3 py-2 font-mono text-[12px]",
                  t.role === "agent" ? "bg-violet-50/70" : t.error ? "bg-red-50 text-red-700" : "bg-muted/60"
                )}
              >
                {t.text}
              </pre>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Agent 发言轮数</div>
            {(
              [
                ["JSON", agentTurns(jsonTurns), "#a1a1aa"],
                ["CodeAct", agentTurns(codeTurns), "#8b5cf6"],
              ] as const
            ).map(([label, n, color]) => (
              <div key={label} className="mb-2 flex items-center gap-2 text-xs">
                <span className="w-14 shrink-0">{label}</span>
                <div className="h-5 flex-1 rounded bg-muted">
                  <div className="h-5 rounded transition-all duration-500" style={{ width: `${(n / 5) * 100}%`, background: color }} />
                </div>
                <span className="w-6 text-right font-mono">{n}</span>
              </div>
            ))}
            <p className="mt-2 text-xs text-muted-foreground">
              CodeAct 即使多了一轮报错和自我修复，总轮数依然更少：循环、变量和 max() 把多次工具调用合并成一个动作。
            </p>
          </div>

          <svg viewBox="0 0 260 150" className="w-full">
            <defs>
              <marker id="ca-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#8b5cf6" />
              </marker>
            </defs>
            <rect x="10" y="50" width="80" height="44" rx="10" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth={1.5} />
            <text x="50" y="76" textAnchor="middle" className="fill-foreground text-[11px] font-semibold">LLM</text>
            <rect x="170" y="50" width="80" height="44" rx="10" fill="#fafafa" stroke="#a1a1aa" strokeWidth={1.5} />
            <text x="210" y="70" textAnchor="middle" className="fill-foreground text-[11px] font-semibold">Python</text>
            <text x="210" y="84" textAnchor="middle" className="fill-muted-foreground text-[9px]">解释器</text>
            <path d="M90 60 C 120 30, 140 30, 168 60" stroke="#8b5cf6" strokeWidth={1.6} fill="none" markerEnd="url(#ca-arrow)" />
            <text x="130" y="28" textAnchor="middle" className="fill-violet-600 text-[10px]">代码动作</text>
            <path d="M170 86 C 140 118, 120 118, 92 86" stroke="#8b5cf6" strokeWidth={1.6} strokeDasharray="4 3" fill="none" markerEnd="url(#ca-arrow)" />
            <text x="130" y="132" textAnchor="middle" className="fill-violet-600 text-[10px]">stdout / 报错 → 自我调试</text>
          </svg>
        </div>
      </div>
    </DiagramFrame>
  )
}
