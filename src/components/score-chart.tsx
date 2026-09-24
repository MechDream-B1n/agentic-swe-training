import { DiagramFrame } from "@/components/diagram-frame"

const rows = [
  { name: "SWE-Gym-32B", date: "2024.12", base: 20.6, tts: 32.0, ttsNote: "verifier best-of-16", color: "#10b981" },
  { name: "R2E-Gym-32B", date: "2025.04", base: 34.4, tts: 51.0, ttsNote: "混合验证器 ×26", color: "#f59e0b" },
  { name: "SWE-agent-LM-32B", date: "2025.04", base: 40.2, color: "#f59e0b" },
  { name: "Llama3-SWE-RL-70B", date: "2025.02", base: 41.0, color: "#ef4444", note: "Agentless Mini，含多次采样与重排序" },
  { name: "DeepSWE-32B", date: "2025.07", base: 42.2, tts: 59.0, ttsNote: "混合 TTS", color: "#ec4899" },
]

const MAX = 60

export function ScoreChart() {
  return (
    <DiagramFrame title="成绩对比 · SWE-bench Verified 解决率（%）" hint="实色：单次尝试　浅色：测试时扩展（多次采样后择优）">
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-xs sm:grid-cols-[11rem_1fr]">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.name}</div>
              <div className="text-[10px] text-muted-foreground">{r.date}</div>
            </div>
            <div>
              <div className="relative h-6 rounded bg-muted/60">
                {r.tts && (
                  <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(r.tts / MAX) * 100}%`, background: `${r.color}40` }} />
                )}
                <div className="absolute inset-y-0 left-0 flex items-center justify-end rounded pr-1.5" style={{ width: `${(r.base / MAX) * 100}%`, background: r.color }}>
                  <span className="font-mono text-[10px] font-semibold text-white">{r.base.toFixed(1)}</span>
                </div>
                {r.tts && (
                  <span className="absolute top-1/2 -translate-y-1/2 pl-1.5 font-mono text-[10px] font-semibold" style={{ left: `${(r.tts / MAX) * 100}%`, color: r.color }}>
                    {r.tts.toFixed(1)}
                  </span>
                )}
              </div>
              {(r.ttsNote || r.note) && <div className="mt-0.5 text-[10px] text-muted-foreground">{r.ttsNote ?? r.note}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="rounded-lg bg-muted/50 p-3">
          SWE-agent 当时还没有 Verified 子集：它在完整 SWE-bench 上是 12.47%（GPT-4 Turbo）。CodeAct 没有在 SWE-bench 上评测。
        </p>
        <p className="rounded-lg bg-muted/50 p-3">
          Self-play SWE-RL 报告的是相对基座 CWM-sft 的自我提升：Verified +10.4、SWE-Bench Pro +7.8，并且在整个训练过程中都优于使用人类数据的 RL 基线。
        </p>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">各工作的基座模型、脚手架和采样预算不同，数字只适合看趋势，不宜直接横向排名。</p>
    </DiagramFrame>
  )
}
