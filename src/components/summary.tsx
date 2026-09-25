import { stages } from "@/lib/stages"

const table = [
  { id: "swe-agent", policy: "GPT-4（闭源）", env: "Docker + ACI", task: "—（只评测）", signal: "无", opt: "提示工程" },
  { id: "codeact", policy: "Llama2 / Mistral-7B", env: "Python 解释器", task: "通用多轮任务", signal: "强模型轨迹", opt: "SFT" },
  { id: "swe-gym", policy: "Qwen2.5-Coder-32B", env: "每任务一个 Docker", task: "人类 issue + 测试", signal: "测试过滤后的轨迹", opt: "拒绝采样 SFT + ORM" },
  { id: "synth", policy: "Qwen2.5-Coder-32B", env: "每仓库一个 / 自动构建", task: "合成 bug / commit 反向翻译", signal: "测试过滤后的轨迹", opt: "SFT + 混合验证器" },
  { id: "swe-rl", policy: "Llama-3.3-70B 全量", env: "无需执行", task: "真实 PR", signal: "与 oracle 的相似度", opt: "单轮 GRPO，每步 1 次 Adam" },
  { id: "deepswe", policy: "Qwen3-32B", env: "R2E-Gym Docker", task: "R2E-Gym 合成任务", signal: "测试 0/1", opt: "GRPO++（多轮）" },
  { id: "ssr", policy: "CWM（32B）", env: "原始仓库镜像", task: "模型自己注入 bug", signal: "测试 ±1 与解决率", opt: "自博弈 RL" },
] as const

const threads = [
  {
    title: "交互形式：从“提示”到“动作空间”",
    body: "SWE-agent 让我们意识到接口本身就是 agent 的一部分；CodeAct 把动作统一成代码。后来的训练工作几乎都继承了“bash + 编辑器 + 提交”的动作集合，训练的对象从“单次回答”变成了“整条轨迹”。",
  },
  {
    title: "数据：从“人工标注”到“自己生成”",
    body: "SWE-Gym 用真实 issue，规模只有几千；SWE-smith 和 R2E-Gym 把规模推到数万；Self-play SWE-RL 连 issue 和测试都交给模型自己生成。环境的构建成本和任务来源，始终是这条线上的主要瓶颈。",
  },
  {
    title: "学习信号：从“模仿老师”到“环境反馈”",
    body: "SFT 的上限是老师，RL 的上限是环境。SWE-RL 先用免执行的相似度奖励验证了 RL 在 SWE 上可行；DeepSWE 在多轮可执行环境里用 0/1 测试奖励做到了纯 RL；自博弈则让任务难度也随策略一起进化。",
  },
]

const glossary = [
  ["ACI", "Agent-Computer Interface，为 LM 设计的命令、反馈格式和护栏。"],
  ["SWE-bench Verified", "OpenAI 人工校验过的 500 道 SWE-bench 子集，是目前最常用的评测。"],
  ["F2P / P2P", "Fail-to-Pass：修复前失败、修复后应通过的测试；Pass-to-Pass：修复前后都应通过的回归测试。"],
  ["拒绝采样", "在环境里采样很多条轨迹，只留下测试判定成功的，失败样本丢掉。"],
  ["RSFT", "Rejection Sampling Fine-Tuning，也叫 filtered behavior cloning：用留下的成功轨迹做普通监督微调，不是在线强化学习。"],
  ["ORM / Verifier", "结果奖励模型：输入整条轨迹，预测它成功的概率，用于 best-of-N 选择。"],
  ["GRPO", "Group Relative Policy Optimization：同一题采样一组回答，用组内相对奖励作为优势，不需要价值网络。"],
  ["Pass@k", "k 次独立尝试中至少一次成功的概率；Pass@1 就是单次成功率。"],
  ["TTS", "Test-Time Scaling，测试时扩展：推理时多采样，再用验证器挑选最好的结果。"],
  ["Agentless", "不做自主多轮决策，而是走固定流水线（定位 → 修复 → 验证）的方案。"],
  ["高阶 bug", "Self-play SWE-RL 中，由修复者失败的尝试叠加原 bug 形成的新任务。"],
]

export function Summary() {
  return (
    <section id="summary" className="scroll-mt-20 border-t py-14 sm:py-20">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">把七步串起来</h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">把每项工作拆成同样的五个维度，可以清楚看到每一步具体替换了哪个部分。</p>

      <div className="mt-8 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              {["工作", "策略模型", "环境", "任务来源", "学习信号", "优化方式"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((r) => {
              const s = stages.find((x) => x.id === r.id)!
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <a href={`#${s.id}`} className="flex items-center gap-2 hover:underline">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                      {s.short}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.policy}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.env}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.task}</td>
                  <td className="px-4 py-3">{r.signal}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.opt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {threads.map((t, i) => (
          <div key={t.title} className="rounded-2xl border bg-card p-5">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">主线 {i + 1}</div>
            <h3 className="mb-2 font-semibold">{t.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </div>

      <div id="glossary" className="mt-14">
        <h3 className="mb-4 text-lg font-bold">术语速查</h3>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {glossary.map(([k, v]) => (
            <div key={k} className="border-b pb-3">
              <dt className="text-sm font-semibold">{k}</dt>
              <dd className="mt-0.5 text-sm text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
