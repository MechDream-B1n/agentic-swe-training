"use client"

import { DiagramFrame, StepControls } from "@/components/diagram-frame"
import { useStepper } from "@/hooks/use-stepper"
import { cn } from "@/lib/utils"

const trainSteps = [
  {
    t: "拼提示词",
    weight: "不动",
    d: "从 27.3 万个 PR 种子里取题。提示词只有 issue 和相关文件全文，要求先推理再写 SEARCH/REPLACE。真实合并的 oracle 补丁不放进去。",
  },
  {
    t: "采样 512 条",
    weight: "不动",
    d: "把当前权重复制成旧策略 π_old，用它采样。32 道题，每题 16 条，共 512 条。生成过程不改权重，也没有第二轮观察。",
  },
  {
    t: "组内打分",
    weight: "不动",
    d: "格式不合法记 −1，否则用 difflib.SequenceMatcher 和 oracle 比，得到 0 到 1。优势只在同一道题的 16 条里计算：A = (r − 均值) / 标准差。奖励函数没有参数，也不反传。",
  },
  {
    t: "前向算损失",
    weight: "不动",
    d: "此时要更新的 π_θ 还等于 π_old，所以 ratio = π_θ / π_old = 1，落在截断区间内部。这一步的策略项就是 −A。另外加上和训练起点 Llama-3.3-70B-Instruct 的 KL；训过很多步之后这项不是 0。",
  },
  {
    t: "反向传播",
    weight: "只算梯度",
    d: "梯度穿过 ratio 的分子，分母 π_old 断开梯度。ratio 的数值仍是 1，截断不改变导数。A 为正就准备提高这串 token 的概率，为负就准备降低。权重还没写回去。",
  },
  {
    t: "Adam 一次",
    weight: "全量更新",
    d: "512 条的梯度加总后，Adam 改一次策略的全部参数。更新只发生在这里。这 512 条随即丢弃，不会拿离开 1 的 ratio 再做第二次前向。下一步把新权重复制成新的 π_old。",
  },
]

const examSteps = [
  {
    t: "文件级定位",
    d: "模型从仓库里选出要改的文件。训练时文件是直接给好的，这一步没有单独的训练目标。",
  },
  {
    t: "采样补丁",
    d: "把选中文件的全文和 issue 交给模型，温度 1.0，每道题生成 500 份 SEARCH/REPLACE。这一步才和训练时的提示词同构。",
  },
  {
    t: "写复现测试",
    d: "模型再为这个问题写测试。训练时也没有这个目标。主实验取其中 30 个。",
  },
  {
    t: "执行并重排",
    d: "这 30 个测试是真的跑的。能通过复现测试的补丁排在前面。训练奖励仍不参与。",
  },
  {
    t: "只交一份",
    d: "每道题只提交排名最高的补丁，交给 SWE-bench 的隐藏测试。500 道的解决率是 41.0%。若跳过定位和重排，把正确文件直接给模型并贪心只写一份，修复率是 34.8%。",
  },
]

function WeightPill({ text }: { text: string }) {
  const hot = text === "全量更新"
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", hot ? "bg-red-600 text-white" : "bg-muted text-muted-foreground")}>
      权重：{text}
    </span>
  )
}

export function SweRlTrain() {
  const train = useStepper(trainSteps.length, 2600)
  const cur = trainSteps[train.step]
  return (
    <DiagramFrame title="图 5 续 · 一个全局步里权重何时改变" hint="1,600 个这样的步，每步只更新一次">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          ["参考策略 π_ref", "起点 Llama，永不更新，只出现在 KL 里"],
          ["旧策略 π_old", "本步采样用的拷贝，不接收梯度"],
          ["新策略 π_θ", "唯一被 Adam 修改的全量权重"],
        ].map(([t, s]) => (
          <div key={t} className="rounded-lg border px-3 py-2">
            <div className="text-xs font-semibold">{t}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 720 92" className="min-w-[640px] w-full">
          {trainSteps.map((s, i) => (
            <g key={s.t} onClick={() => train.setStep(i)} className="cursor-pointer">
              <rect x={i * 120 + 4} y={16} width={110} height={52} rx={10} fill={i === train.step ? "#ef4444" : i < train.step ? "#fee2e2" : "#fafafa"} stroke="#ef4444" strokeWidth={i === train.step ? 0 : 1.4} />
              <text x={i * 120 + 59} y={38} textAnchor="middle" className={cn("text-[11px] font-semibold", i === train.step ? "fill-white" : "fill-foreground")}>{s.t}</text>
              <text x={i * 120 + 59} y={54} textAnchor="middle" className={cn("text-[9px]", i === train.step ? "fill-red-50" : "fill-muted-foreground")}>{s.weight}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-col gap-3">
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50/70 p-3 text-sm leading-relaxed">
          <div className="mb-1"><WeightPill text={cur.weight} /></div>
          <span className="font-semibold">{train.step + 1}. {cur.t}。 </span>
          {cur.d}
        </div>
        <StepControls step={train.step} total={trainSteps.length} onChange={train.setStep} playing={train.playing} onTogglePlay={train.togglePlay} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        因为每批样本只做一次 Adam，算梯度时 ratio 始终是 1，公式里的截断不会改变这一步的梯度。一步走多远由学习率决定。论文没有给出学习率、ε 和 β 的具体数字。512 张 H100，大约 32 小时。
      </p>
    </DiagramFrame>
  )
}

export function SweRlExam() {
  const exam = useStepper(examSteps.length, 2400)
  const cur = examSteps[exam.step]
  return (
    <DiagramFrame title="图 5 续 · 考场是另一条流水线" hint="训练奖励不参与评测">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 700 88" className="min-w-[600px] w-full">
          <defs>
            <marker id="exam-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#ef4444" />
            </marker>
          </defs>
          {examSteps.map((s, i) => (
            <g key={s.t} onClick={() => exam.setStep(i)} className="cursor-pointer">
              <rect x={i * 140 + 2} y={18} width={124} height={46} rx={10} fill={i === exam.step ? "#ef4444" : "#fef2f2"} stroke="#ef4444" strokeWidth={i === exam.step ? 0 : 1.4} />
              <text x={i * 140 + 64} y={46} textAnchor="middle" className={cn("text-[12px] font-semibold", i === exam.step ? "fill-white" : "fill-foreground")}>{s.t}</text>
              {i < examSteps.length - 1 && <path d={`M${i * 140 + 126} 41 L${i * 140 + 140} 41`} stroke="#ef4444" strokeWidth={1.5} markerEnd="url(#exam-arrow)" />}
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-col gap-3">
        <div className="min-h-20 rounded-lg border-l-4 border-red-500 bg-red-50/70 p-3 text-sm leading-relaxed">
          <span className="font-semibold">{exam.step + 1}. {cur.t}。 </span>
          {cur.d}
        </div>
        <StepControls step={exam.step} total={examSteps.length} onChange={exam.setStep} playing={exam.playing} onTogglePlay={exam.togglePlay} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="font-semibold">41.0%</div>
          <p className="mt-1 text-muted-foreground">每题 500 份补丁、30 个复现测试，只交排名最高的一份。这是流水线的 pass@1，不是训练奖励。</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="font-semibold">34.8%</div>
          <p className="mt-1 text-muted-foreground">正确文件直接给定，贪心只生成一份。这个动作更接近训练。原版 Llama 在同一设定下是 5.4%，SFT 基线是 29.6%。</p>
        </div>
      </div>
    </DiagramFrame>
  )
}
