export type Phase = "solve" | "grade";

export type Field = {
  name: string;
  what: string;
  solve: string;
  grade: string;
};

export type Step = { title: string; body: string; code?: string; codeLabel?: string };

export const glossary = [
  {
    term: "评测 harness",
    def: "出题方的环境、隐藏测试和打分程序。SWE-bench 的 swebench.harness 属于这一层。",
  },
  {
    term: "Agent scaffold",
    def: "模型外面的循环和工具。benchmark 不附送工具时，工具属于 scaffold。",
  },
];

export const sweFields: Field[] = [
  { name: "instance_id", what: "通常是 owner__repo-PR号", solve: "可见", grade: "可见" },
  { name: "repo", what: "GitHub 仓库", solve: "可见", grade: "可见" },
  { name: "base_commit", what: "修复 PR 落上去之前的提交", solve: "可见，作为代码起点", grade: "容器从这里开始" },
  { name: "problem_statement", what: "issue 标题加正文。多条 issue 会拼在一起", solve: "可见，这是任务说明", grade: "不参与打分" },
  { name: "hints_text", what: "PR 首次提交之前的评论，里面可能有解法暗示", solve: "数据集里有；论文主实验不用", grade: "不用" },
  { name: "patch", what: "金补丁，PR 中的非测试改动", solve: "不可见", grade: "仅在用 gold 自检时当作待测补丁" },
  { name: "test_patch", what: "PR 中新增或修改的测试", solve: "不可见", grade: "先打进仓库，再跑测试" },
  { name: "FAIL_TO_PASS", what: "打上测试后应失败、修复后应通过的测试名", solve: "不可见", grade: "决定问题有没有被解决" },
  { name: "PASS_TO_PASS", what: "修复前后都应该通过的测试名", solve: "不可见", grade: "决定有没有打坏原有行为" },
  { name: "FAIL_TO_FAIL / PASS_TO_FAIL", what: "其他过渡，用于附加统计", solve: "不可见", grade: "默认可选，不决定 resolved" },
];

export const sweHarness: Step[] = [
  {
    title: "读预测文件",
    body: "run_evaluation 读 JSONL。每行要有 instance_id、model_name_or_path 和 model_patch。predictions_path 为 gold 时，待测补丁换成数据集里的金补丁，用来确认镜像和测试能通。",
    codeLabel: "preds.jsonl 的一行",
    code: `{"instance_id":"acme__ports-17","model_name_or_path":"demo-model","model_patch":"diff --git a/ports.py ..."}`,
  },
  {
    title: "从 base_commit 起容器",
    body: "解题现场丢掉。这道题的容器重新停在 base_commit。镜像大致三层：基础语言、该仓库的依赖、停在该提交的题目镜像。依赖层可以给同一仓库的多道题复用。",
  },
  {
    title: "应用 model_patch",
    body: "补丁写进容器后尝试 git apply。一次失败可能弄脏工作区，所以下一种方式之前会先恢复干净树。几种方式都失败时，再用反向检查看补丁是不是其实已经完整打上。仍然没有，这题停在无法应用，后面不再产生测试日志。",
    codeLabel: "概念顺序，具体参数以当前 harness 为准",
    code: `git apply /tmp/patch.diff
# 失败则恢复干净树，再换一种 apply
git checkout -- .
git clean -fd`,
  },
  {
    title: "注入 test_patch 并跑测试",
    body: "仓库评测脚本在模型补丁之后应用 test_patch、执行测试、留下日志。以教学例来说，这时 test_port_zero 才出现。多模态题还要把文本 diff 带不走的图片基线放回测试期望的路径。",
  },
  {
    title: "对照两份名单",
    body: "解析器把每条测试标成通过、失败或错误。FAIL_TO_PASS 全部通过，并且 PASS_TO_PASS 全部保持通过，resolved 才是 true。主指标是这次预测里 resolved 的比例。日志里缺了哪个测试名算过还是算挂，随 harness 版本变化，报告要写版本。",
    codeLabel: "教学例里的判定",
    code: `resolved = (
    test_port_zero == PASSED
    and test_port_80 == PASSED
    and test_port_too_high == PASSED
)`,
  },
  {
    title: "按 run_id 落盘",
    body: "结果按 run_id 加 instance_id 缓存，不看补丁内容。同一 run、同一题再次运行会复用第一次的日志。换了 model_patch 必须换 run_id。",
    codeLabel: "报告片段",
    code: `{
  "acme__ports-17": {
    "patch_successfully_applied": true,
    "resolved": true
  }
}`,
  },
];

export const sweTools: { name: string; can: string; loop: string; use: string; href?: string }[] = [
  { name: "Oracle 检索", can: "直接看到金补丁改过的文件，一次写出补丁", loop: "无", use: "上限参照，不是真实 agent" },
  { name: "BM25 检索", can: "用 issue 文本检索若干文件，一次写出补丁", loop: "无", use: "早期非 agent 基线" },
  { name: "SWE-agent ACI", can: "窗口看文件、有界搜索、按行编辑；语法不过则回滚", loop: "多步", use: "说明界面本身会改变分数", href: "/#swe-agent" },
  { name: "mini-swe-agent", can: "只有 bash。每步是一次独立命令", loop: "多步", use: "Bash Only：同一 scaffold 下比模型", href: "/#swe-agent" },
  { name: "Agentless", can: "定位文件，生成补丁，再用回归测试挑选", loop: "固定流水线", use: "不一定要自由循环" },
  { name: "OpenHands", can: "bash、Python、文件编辑", loop: "多步", use: "更接近通用编程 agent", href: "/#openhands" },
  { name: "厂商 agent", can: "各自的编辑、搜索、终端，有的还有浏览器", loop: "多步，预算不同", use: "不能和 Bash Only 直接横比" },
];

export const sweTimeline = [
  {
    phase: "造题",
    points: [
      "从仓库里找被 PR 关掉的 issue。",
      "拆成金补丁和 test_patch。",
      "在「只有测试」和「测试加金补丁」两种状态下跑测试。",
      "记下 FAIL_TO_PASS 与 PASS_TO_PASS。丢掉装不上或测不稳的样本。",
    ],
  },
  {
    phase: "解题",
    points: [
      "工作区停在 base_commit。",
      "模型只拿到 problem_statement 和这棵代码树。",
      "scaffold 按自己的工具循环行动。",
      "抽出 git diff，写成预测 JSONL 的一行。",
    ],
  },
  {
    phase: "打分",
    points: [
      "换一个干净容器，仍然从 base_commit 开始。解题现场不能留下来。",
      "应用模型补丁。应用失败则该题未解决。",
      "应用 test_patch 并跑测试。",
      "解析日志，汇总 resolved 比例。报告要写数据集、scaffold、超时和 harness 版本。",
    ],
  },
];

export const sweBranches = [
  { name: "Full", text: "原始测试集，约 2294 道，12 个 Python 仓库。上面的流程就是这一套。" },
  { name: "Lite", text: "约 300 道，从 Full 抽出，方便少跑容器。字段和判分不变。Lite 的比例不能写成 Full 或 Verified。" },
  { name: "Verified", text: "约 500 道。人看过问题陈述和失败测试，说不清或测试对不上的会被拿掉。不是随机抽样，也不表示题更简单。" },
  { name: "Bash Only", text: "题就是 Verified。所有模型用同一个 mini-swe-agent，唯一动作是 bash。厂商自己的 agent 再跑一遍，不是这一列。" },
  { name: "Multimodal", text: "issue 里带截图。评测时要把图片基线放回容器。不能读图的 scaffold 看到的题目是残缺的。榜上约 517，开发集约 100，不要合成一个数字。" },
  { name: "Multilingual", text: "官方多语言切片，约 300 道、42 个仓库、9 种语言。日志解析按语言分开。" },
  { name: "Pro", text: "改动更长。解题时还有需求列表和可选的接口说明。公开、保留、商业三个子集的分数要分开报。" },
  { name: "Live", text: "用新 issue 降低整库被背下来的可能。full 按月追加，报告要写截止月份。Windows 题在 PowerShell 里打分。" },
];

export const tbV1Fields: Field[] = [
  { name: "task.yaml 里的指令", what: "任务说明，嵌在配置里", solve: "可见", grade: "不参与文本匹配" },
  { name: "task.yaml 其余项", what: "超时、资源、解析器名称", solve: "运行配置", grade: "决定怎么读测试输出" },
  { name: "Dockerfile", what: "agent 的工作容器，放在任务根目录", solve: "生活在其中", grade: "被检查的那台机器" },
  { name: "run-tests.sh", what: "验证入口，常见是跑 pytest", solve: "不可见", grade: "agent 结束后执行" },
  { name: "tests/", what: "测试与期望数据", solve: "不可见", grade: "随验证脚本运行" },
  { name: "solution.sh", what: "参考解", solve: "不可见", grade: "用来确认题本身可解" },
];

export const tbV1Harness: Step[] = [
  {
    title: "按 Dockerfile 拉起",
    body: "教学例 summarize 的镜像里有 3 行 notes.txt，以及一个读错路径的 summarize.sh。task.yaml 里的 instruction 交给 agent。parser_name、超时写在同一个文件里，agent 用到的是指令正文。",
    codeLabel: "task.yaml 里和流程有关的字段",
    code: `instruction: |-
  Print how many lines are in /app/data/notes.txt.
parser_name: pytest
max_agent_timeout_sec: 300
max_test_timeout_sec: 60`,
  },
  {
    title: "在机器上改到自己停",
    body: "agent 可以执行命令、改文件、起进程，并看见输出。它看不见 run-tests.sh、tests/ 和 solution.sh。时间用完也算结束。",
  },
  {
    title: "结束后放入测试",
    body: "框架把 tests/ 放到 /tests，执行 run-tests.sh。教学例里 pytest 检查标准输出去掉空白后是不是 3。",
    codeLabel: "run-tests.sh",
    code: `#!/bin/bash
pytest -q /tests/test_outputs.py`,
  },
  {
    title: "框架里的解析器判分",
    body: "parser_name: pytest 指向 Terminal-Bench 仓库中的解析器。它读 pytest 的输出，映射成通过或失败。被计分的是这一次接入的 agent 加模型。",
  },
];

export const compareRows = [
  { dim: "起点", swe: "真实仓库的一个 commit", tb: "为题目构建的容器" },
  { dim: "完成定义", swe: "隐藏测试从失败变为通过，且原有测试仍通过", tb: "指令是否做完，由框架解析 pytest 输出" },
  { dim: "提交物", swe: "unified diff", tb: "结束时的那台机器" },
  { dim: "测试何时出现", swe: "交卷后注入 test_patch", tb: "agent 结束后才运行验证" },
  { dim: "现场", swe: "打分前丢掉，只认补丁", tb: "打分就认这台被改过的机器" },
  { dim: "报告单位", swe: "常写成模型名，实际含 scaffold", tb: "必须写成 agent 加模型" },
];
