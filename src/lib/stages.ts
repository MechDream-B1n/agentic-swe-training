export type StageId =
  | "swe-agent"
  | "codeact"
  | "swe-gym"
  | "synth"
  | "swe-rl"
  | "deepswe"
  | "ssr"

export type Stage = {
  id: StageId
  index: number
  name: string
  short: string
  date: string
  org: string
  paradigm: string
  color: string
  tagline: string
  problem: string
  ideas: string[]
  stats: { value: string; label: string }[]
  limitation: string
  question: { q: string; a: string }
  links: { label: string; href: string }[]
}

export const stages: Stage[] = [
  {
    id: "swe-agent",
    index: 1,
    name: "SWE-agent",
    short: "SWE-agent",
    date: "2024.05",
    org: "Princeton",
    paradigm: "推理期：接口设计",
    color: "#0ea5e9",
    tagline: "不改模型，改“人机接口”：为 LM 设计专用的 Agent-Computer Interface（ACI）。",
    problem:
      "直接把 LM 丢进 Linux shell，它会被冗长输出淹没、用 sed 改错缩进、在大文件里迷路。问题不只是模型不够强，而是“界面”是为人类设计的。",
    ideas: [
      "ACI = 一组为 LM 量身定制的命令：find_file / search_dir / open / goto / scroll / edit / submit。",
      "窗口化文件查看器：每次只展示 ~100 行并带行号，避免上下文爆炸。",
      "带护栏的编辑：edit 后自动跑 linter，语法错误的修改直接回滚并告诉模型原因。",
      "简洁反馈：命令无输出时也明确返回“执行成功，无输出”，减少模型困惑。",
      "ReAct 式循环：Thought → Action → Observation，直到 submit 产出补丁。",
    ],
    stats: [
      { value: "12.47%", label: "SWE-bench 完整集（GPT-4 Turbo）" },
      { value: "~18%", label: "SWE-bench Lite" },
      { value: "0", label: "训练步数：纯提示 + 接口工程" },
    ],
    limitation:
      "效果完全依赖闭源大模型，开源小模型用同样的 ACI 表现很差。接下来的问题是：动作应该用什么形式表达，以及怎样让开源模型也学会当 agent。",
    question: {
      q: "为什么 edit 命令要内置 linter 检查，而不是让模型自己运行 python -m py_compile？",
      a: "每多一轮交互，就多一次出错和上下文膨胀的机会。把常见错误的检测前置到接口层，相当于替模型挡掉一类低级失败，同时给出结构化的错误信息。这是“接口设计影响 agent 表现”的核心论点。",
    },
    links: [{ label: "arXiv 2405.15793", href: "https://arxiv.org/abs/2405.15793" }],
  },
  {
    id: "codeact",
    index: 2,
    name: "CodeAct",
    short: "CodeAct",
    date: "2024.02",
    org: "UIUC · Xingyao Wang 等",
    paradigm: "动作空间：代码即动作",
    color: "#8b5cf6",
    tagline: "把可执行的 Python 代码作为统一的动作空间，替代 JSON / 文本格式的工具调用。",
    problem:
      "JSON 工具调用一次只能调用一个工具，没有变量、循环和条件分支，组合多个工具要来回很多轮；而且每新增一个工具都要改动作格式。",
    ideas: [
      "动作 = 一段 Python 代码，交给解释器执行；观测 = stdout / 报错信息。",
      "天然支持控制流与数据流：循环、条件、变量复用，一轮完成多步工具组合。",
      "可以直接调用现成的 Python 包，工具生态几乎无限。",
      "报错信息本身就是反馈，模型能据此自我调试（self-debug）。",
      "构建 CodeActInstruct（约 7k 条多轮交互轨迹）微调出 CodeActAgent，并成为 OpenHands（原 OpenDevin）默认 agent 的基础。",
    ],
    stats: [
      { value: "+20%", label: "M³ToolEval 上相对 JSON/文本动作的最高成功率提升" },
      { value: "~30%", label: "完成任务所需交互轮数最多减少" },
      { value: "7k", label: "CodeActInstruct 多轮轨迹" },
    ],
    limitation:
      "CodeAct 证明了用轨迹做 SFT 可以教会开源模型当 agent，但训练数据是通用任务。要在真实软件仓库上训练，还缺少可执行、可验证的训练环境。",
    question: {
      q: "注意：CodeAct（2024.02）其实早于 SWE-agent（2024.05）。为什么这条脉络仍把它放在第二位？",
      a: "按“思想依赖”而非时间排序：SWE-agent 回答“agent 和环境之间的接口长什么样”，CodeAct 回答“动作用什么语言表达、能否通过微调习得”。后面的 SWE-Gym 正是基于 OpenHands 的 CodeActAgent 脚手架采集轨迹，两条线在这里汇合。",
    },
    links: [{ label: "arXiv 2402.01030", href: "https://arxiv.org/abs/2402.01030" }],
  },
  {
    id: "swe-gym",
    index: 3,
    name: "SWE-Gym",
    short: "SWE-Gym",
    date: "2024.12",
    org: "UC Berkeley · UIUC · CMU · Apple",
    paradigm: "训练环境：真实任务 + SFT",
    color: "#10b981",
    tagline: "SWE-Gym 是训练场，SWE-bench 是考试。题目同构，但只有训练场能当场告诉你：测试过了没有。",
    problem:
      "SWE-bench 早期的训练集没有可执行环境，也没有「这道题做成了没有」的信号，模型只能模仿金补丁。想按测试结果来训练，需要每题自带仓库、依赖和单元测试。",
    ideas: [
      "2,438 道真实 Python 任务、11 个仓库，每题一个可执行环境。仓库避开 SWE-bench 的测试仓库，否则训练分没有意义。",
      "OpenHands 的 CodeActAgent 2.1 在训练场里自己决定下一步：bash 加文件编辑器，成功轨迹平均大约 19 轮，结束时抽出 git diff。",
      "拒绝采样丢掉测试没过的轨迹。留下的 491 条（来自 GPT-4o 和 Claude 3.5 Sonnet，32k token 内）做 Rejection Sampling Fine-Tuning，也就是用成功轨迹做监督微调。",
      "同一个 Qwen2.5-Coder 再训一个验证器。推理可以只跑一次，也可以采样 16 条、让验证器挑得分最高的补丁。",
    ],
    stats: [
      { value: "2,438", label: "训练题（11 个仓库）；考场是 Lite 300、Verified 500" },
      { value: "15.3% / 20.6%", label: "32B 只跑一次：Lite / Verified" },
      { value: "26.0% / 32.0%", label: "32B 策略 + 32B 验证器，16 条里挑 1 条" },
    ],
    limitation:
      "真实任务依赖人工写的 issue 和测试，数量受限；为每个任务单独构建 Docker 环境成本极高（约 6TB）。规模成为瓶颈，于是出现了“合成任务”的路线。",
    question: {
      q: "为什么只用 491 条轨迹就能带来 +13.6% 的提升？这说明了什么？",
      a: "基座模型已经具备代码能力，缺的是“在环境中多轮交互”的行为模式（怎么定位、怎么复现、何时提交）。少量高质量轨迹就能教会这种格式与策略，这类似于指令微调里的“表层对齐”效应。但想继续提升，数据规模和多样性就成了关键。",
    },
    links: [{ label: "arXiv 2412.21139", href: "https://arxiv.org/abs/2412.21139" }],
  },
  {
    id: "synth",
    index: 4,
    name: "SWE-smith / R2E-Gym",
    short: "SWE-smith / R2E-Gym",
    date: "2025.04",
    org: "Stanford · Princeton / UC Berkeley",
    paradigm: "数据合成：规模化任务",
    color: "#f59e0b",
    tagline: "不再依赖人工 issue：自动合成成千上万个可执行、可验证的任务。",
    problem:
      "真实的 “issue + 修复 PR + 测试” 三元组太少，环境构建又太贵。怎样以较低成本获得 10 倍以上的训练任务？",
    ideas: [
      "SWE-smith：每个仓库只建一个环境，然后在其中“造 bug”：LM 改写、AST 程序化变异、组合多个 bug、反向应用 PR。能让已有测试失败的才保留，再由 LM 写 issue。",
      "R2E-Gym（SWE-GEN）：直接从 commit 历史出发，自动构建环境、收集或生成 Fail→Pass 测试，再把代码变更“反向翻译”成问题描述。",
      "R2E-Gym 还提出混合验证器：基于执行的（生成测试）与免执行的（打分模型）各有盲区，组合后测试时扩展效果更好。",
    ],
    stats: [
      { value: "50k / 128", label: "SWE-smith 任务数 / 仓库数" },
      { value: "40.2%", label: "SWE-agent-LM-32B，Verified Pass@1（5k 条轨迹 SFT）" },
      { value: "34.4% → 51%", label: "R2E-Gym-32B Pass@1 → 混合验证器 26 次采样" },
    ],
    limitation:
      "两者的训练方式仍是 SFT 蒸馏：轨迹来自更强的闭源模型，学生的上限被老师卡住。要突破，需要让模型从环境奖励中自己学，也就是强化学习。",
    question: {
      q: "SWE-smith 为什么强调“每个仓库一个环境”？",
      a: "SWE-Gym 这类方法按任务实例构建环境（每个 issue 对应不同 commit 和依赖），存储约 6TB。SWE-smith 固定仓库版本，所有 bug 都注入同一份代码，环境可以复用，50k 任务只需约 295GB。环境成本从“按任务”变成“按仓库”，规模化才成为可能。",
    },
    links: [
      { label: "SWE-smith arXiv 2504.21798", href: "https://arxiv.org/abs/2504.21798" },
      { label: "R2E-Gym arXiv 2504.07164", href: "https://arxiv.org/abs/2504.07164" },
    ],
  },
  {
    id: "swe-rl",
    index: 5,
    name: "SWE-RL",
    short: "SWE-RL",
    date: "2025.02",
    org: "Meta FAIR · UIUC",
    paradigm: "强化学习：规则奖励",
    color: "#ef4444",
    tagline: "第一次把 R1 式的 RL 推理训练扩展到真实软件工程：奖励 = 与真实补丁的相似度。",
    problem:
      "DeepSeek-R1 证明了 RL 能激发推理能力，但它依赖可自动判分的数学/竞赛题。真实软件任务要跑测试，环境昂贵。能否不执行代码也获得奖励？",
    ideas: [
      "单轮：一次生成就是整条轨迹。提示词里是 issue 和文件全文，oracle 补丁只用来打分，训练时不建仓库、不跑测试。",
      "每个全局步抽 32 道题，每题采样 16 条回答。格式错记 −1，否则是和 oracle 的相似度。组内算出优势后，只在最后做一次 Adam，全量更新 70B 策略。",
      "算损失时新旧策略仍是同一套权重，概率比 ratio 等于 1，截断不起作用。真正每步都在拉住模型的，是和训练起点 Llama-3.3-70B-Instruct 的 KL。",
      "这样的全局步重复 1,600 次。考场是另一套程序：Agentless Mini 定位、采样 500 份补丁、用复现测试重排后只交一份。",
    ],
    stats: [
      { value: "1,600", label: "全局步 = 1,600 次全量 Adam" },
      { value: "32 × 16", label: "每步题数 × 每题回答数，然后才更新一次" },
      { value: "41.0%", label: "考场 pass@1；只修对文件、贪心一份是 34.8%" },
    ],
    limitation:
      "相似度奖励会惩罚“写法不同但同样正确”的修复，而且它是单轮生成，不是多轮 agent。下一步自然是：在真实可执行环境里做多轮 agentic RL，用测试结果当奖励。",
    question: {
      q: "相似度奖励最大的风险是什么？为什么它仍然有效？",
      a: "风险在于奖励与“正确性”不完全对齐：功能等价但文本不同的补丁得分低，文本相近但有一处关键错误的补丁得分高。它仍然有效，是因为在大规模数据上，接近 oracle 通常意味着定位对了、改动方向对了；再加上连续奖励比 0/1 更稠密，GRPO 更容易学到东西。",
    },
    links: [{ label: "arXiv 2502.18449", href: "https://arxiv.org/abs/2502.18449" }],
  },
  {
    id: "deepswe",
    index: 6,
    name: "DeepSWE",
    short: "DeepSWE",
    date: "2025.07",
    org: "Agentica × Together AI",
    paradigm: "Agentic RL：多轮 + 执行奖励",
    color: "#ec4899",
    tagline: "纯 RL、多轮交互、稀疏的 0/1 测试奖励：在 R2E-Gym 环境中从 Qwen3-32B 训练出 SOTA 开源 agent。",
    problem:
      "多轮 agent 的 RL 很难：轨迹长（可达上百步、64k 上下文），奖励稀疏，环境执行慢，训练容易崩溃。需要一套稳定的算法和工程配方。",
    ideas: [
      "环境：R2E-Gym 子集约 4.5k 个任务，每条轨迹在独立 Docker 里执行，训练时并行 512 个容器。",
      "工具：execute_bash、search、file_editor、finish/submit 四个工具，最多 100 步。",
      "奖励：提交后跑测试，全部通过（F2P 和 P2P）记 1，否则或超时记 0，也就是稀疏的结果奖励。",
      "GRPO++：Clip-High、去掉 KL、去掉奖励标准差归一化、长度归一化、Leave-One-Out 基线、去掉熵损失，再加上 Compact Filtering。",
      "Compact Filtering：因上下文超限、超时或步数用尽而被截断的轨迹不计入 loss，避免“碰巧通过”的轨迹被错误强化。",
    ],
    stats: [
      { value: "42.2%", label: "Verified Pass@1（16 次平均）" },
      { value: "59%", label: "混合测试时扩展（TTS）" },
      { value: "64×H100", label: "训练 6 天，约 200 步 RL：23% → 42%" },
    ],
    limitation:
      "训练任务依然来自人类的代码历史（commit、测试）。人类数据总会耗尽，也天然限制了能力上限。能否让模型自己出题、自己解题？",
    question: {
      q: "为什么被截断的轨迹要直接屏蔽（mask），而不是当作 0 奖励的失败样本？",
      a: "被截断不等于策略差。例如模型前 10 步已修好问题，后面乱改文件直到步数耗尽；或者只是环境运行慢导致超时。给它负信号会惩罚本来正确的行为；反过来，碰巧通过的长轨迹也会强化无意义的动作。屏蔽掉这些样本让信号更干净，也鼓励模型在限制内高效完成任务。",
    },
    links: [
      { label: "Together AI 博客", href: "https://www.together.ai/blog/deepswe" },
      { label: "rLLM 文档", href: "https://docs.rllm-project.com/examples/deep-swe" },
    ],
  },
  {
    id: "ssr",
    index: 7,
    name: "Self-play SWE-RL",
    short: "Self-play SWE-RL",
    date: "2025.12",
    org: "Meta FAIR",
    paradigm: "自博弈：自己出题自己解",
    color: "#6366f1",
    tagline: "只给沙箱中的原始仓库（一个 Docker 镜像）：同一个模型轮流扮演“造 bug 者”和“修 bug 者”，用 RL 共同进化。",
    problem:
      "所有前面的方法都需要人类的 issue、测试或测试命令。要走向“超越人类”的软件 agent，必须摆脱对人类标注数据的依赖。",
    ideas: [
      "单一策略、两种角色（共享参数，仅提示不同）：bug 注入者（Injector）与 bug 修复者（Solver）。",
      "注入者探索仓库、自己摸索怎么跑测试，产出 bug 工件：bug 补丁、测试脚本、测试文件、测试解析器，以及用来“藏住 bug”的测试弱化补丁。",
      "一致性校验：测试脚本在原代码上能通过、注入后有测试失败、弱化补丁确实藏住了 bug，并通过逆变异测试确认每个改动文件都是必要的。",
      "修复者看不到自然语言 issue，只看到“反向的测试弱化补丁”作为形式化规格，需要写出能通过所有测试的修复。仓库的 .git 历史会被清空，防止作弊。",
      "修复失败的尝试被转化为高阶 bug，形成不断进化的课程；注入者的奖励鼓励“难但可解”的 bug。",
    ],
    stats: [
      { value: "+10.4", label: "SWE-bench Verified 自我提升（点）" },
      { value: "+7.8", label: "SWE-Bench Pro 自我提升（点）" },
      { value: "0", label: "人工 issue / 测试命令" },
    ],
    limitation:
      "这是迈向“从经验中学习”的第一步：自博弈的课程质量依赖注入策略（朴素提示容易退化成一行小改动），高阶 bug 目前只到二阶，更复杂的多步任务仍待探索。",
    question: {
      q: "注入者的奖励为什么对“太简单（s=1）”和“太难（s=0）”都给负分？",
      a: "s=1 的 bug 对修复者没有学习信号（GRPO 组内优势全为 0）；s=0 的 bug 可能根本不可解，或描述不充分，同样学不到东西。只有 0<s<1 的“学习区”才能产生有效梯度，而且在区间内 s 越低奖励越高，推动注入者出更难的题，形成对抗式的课程。",
    },
    links: [{ label: "arXiv 2512.18552", href: "https://arxiv.org/abs/2512.18552" }],
  },
]

export const stageById = Object.fromEntries(stages.map((s) => [s.id, s])) as Record<
  StageId,
  Stage
>
