import { DiagramFrame } from "@/components/diagram-frame"

const rows = [
  ["角色", "对外考试", "训练环境"],
  ["规模", "Lite 300、Verified 500，来自 12 个 Python 测试仓库", "论文里 2,438 道，11 个仓库"],
  ["环境", "评测时才有可执行容器", "每题自带可执行环境和单元测试，用来当场给奖励"],
  ["分数含义", "resolved 比例，用来报榜", "训练时的 0/1 奖励；报成绩时仍要拿到 SWE-bench 上再考一次"],
]

export function SweGymCompare() {
  return (
    <DiagramFrame title="对照 · 训练场和考场" hint="题目长得一样，拿来干的事不一样">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        两边都是真实 GitHub issue，仓库停在修复前，交一份补丁，用测试判对错。SWE-bench 早期的训练集没有可执行环境和成功信号，只能模仿金补丁。SWE-Gym 补的就是这个缺口，并且避开 SWE-bench 的测试仓库，否则训练分没有意义。
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="w-28 px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">SWE-bench · 考试</th>
              <th className="px-4 py-3 font-medium text-emerald-700">SWE-Gym · 训练场</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, exam, gym]) => (
              <tr key={k} className="border-t">
                <th className="px-4 py-3 text-left text-xs font-semibold">{k}</th>
                <td className="px-4 py-3 text-muted-foreground">{exam}</td>
                <td className="px-4 py-3">{gym}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DiagramFrame>
  )
}

export function SweGymMethod() {
  return (
    <DiagramFrame title="采样和微调 · 拒绝的是失败轨迹" hint="不是在线强化学习">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="text-sm font-semibold">拒绝采样</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            先让模型在环境里做很多遍。每遍得到一条轨迹和一个奖励，只留下奖励达标的。在这里，达标就是 SWE-Gym 的测试判定这道题 resolved。失败轨迹不拿去教策略模型。
          </p>
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {[
              "教师在训练场里多轮交互，抽出 git diff。",
              "单元测试给 0 或 1。",
              "1 留下，0 丢掉。",
            ].map((t, i) => (
              <li key={t} className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-semibold">Rejection Sampling Fine-Tuning</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            把留下的成功轨迹拿去对较小的模型做普通监督微调：学生按负对数似然模仿轨迹里的动作。论文也把它叫 filtered behavior cloning。没有每一步的价值函数，也没有 PPO 那种更新。
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-950">
              <div className="mb-1 font-semibold">off-policy</div>
              教师是 GPT-4o 或 Claude。主实验的 491 条就是这条路，轨迹限制在 32k token 内。
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed">
              <div className="mb-1 font-semibold">on-policy</div>
              学生自己采样，留下自己的成功再微调。论文里的 self-improvement 走的是 MoatlessTools 这条固定工作流。
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox="0 0 680 118" className="min-w-[520px] w-full">
          <defs>
            <marker id="gym-loop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
            </marker>
          </defs>
          {[
            [8, "CodeActAgent", "自己决定下一步"],
            [176, "bash / 编辑器", "浏览器已关闭"],
            [344, "运行时", "stdout 或编辑结果"],
            [512, "git diff", "平均约 19 轮后结束"],
          ].map(([x, t, s], i) => (
            <g key={t as string}>
              <rect x={x as number} y={28} width={150} height={52} rx={12} fill={i === 0 ? "#10b981" : "#ecfdf5"} stroke="#10b981" strokeWidth={1.5} />
              <text x={(x as number) + 75} y={50} textAnchor="middle" className={i === 0 ? "fill-white text-[12px] font-semibold" : "fill-foreground text-[12px] font-semibold"}>{t}</text>
              <text x={(x as number) + 75} y={67} textAnchor="middle" className={i === 0 ? "fill-emerald-50 text-[10px]" : "fill-muted-foreground text-[10px]"}>{s}</text>
              {i < 3 && <path d={`M${(x as number) + 150} 54 L${(x as number) + 174} 54`} stroke="#10b981" strokeWidth={1.6} markerEnd="url(#gym-loop)" />}
            </g>
          ))}
          <path d="M512 80 C 430 112, 250 112, 158 82" stroke="#10b981" strokeWidth={1.4} strokeDasharray="5 4" fill="none" markerEnd="url(#gym-loop)" className="flow-dash" />
          <text x="340" y="108" textAnchor="middle" className="fill-emerald-700 text-[10px]">观测塞回上下文，模型再决定下一步</text>
        </svg>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        这是 OpenHands 的 CodeActAgent 2.1，通用 ReAct，不是专用工作流。它和 mini-swe-agent 的差别是：不只有 bash，还有专门的编辑器，并且走模型的工具调用。它和 Agentless 的差别是：没有人规定必须先定位再修补，规划留给模型。
      </p>
    </DiagramFrame>
  )
}
