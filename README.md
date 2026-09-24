# Agentic SWE 训练范式 · 图解学习站

一个交互式的中文学习网站，按下面这条脉络讲解软件工程 Agent 的训练范式是怎样演进的：

**SWE-agent → CodeAct → SWE-Gym → SWE-smith / R2E-Gym → SWE-RL → DeepSWE → Self-play SWE-RL**

每一章包含：要解决的问题、核心做法、关键数字、局限（也就是下一章的出发点），以及一张可以动手操作的图：

| 章节 | 交互图 |
| --- | --- |
| SWE-agent | 逐步播放一条 ACI 轨迹，包括 linter 护栏拦截错误编辑 |
| CodeAct | 同一任务下 JSON 工具调用与代码动作的对比 |
| SWE-Gym | 训练流水线（可点击节点）和提升幅度柱状图 |
| SWE-smith / R2E-Gym | 四类造 bug 策略、环境存储对比、混合验证器权重滑块 |
| SWE-RL | 在线计算相似度奖励（TypeScript 复刻的 `difflib.SequenceMatcher`） |
| DeepSWE | RL 循环图，以及切换 Compact Filtering / LOO / 标准差归一化时优势值的变化 |
| Self-play SWE-RL | 一轮自博弈的分步图，以及注入者奖励曲线（可调 α 和解决率 s） |

另外还有范式地图（学习信号 × 任务来源）、横向对比表、SWE-bench Verified 成绩图和术语表。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

然后打开 <http://localhost:43127>。

## 技术栈

Next.js（App Router）、TypeScript、Tailwind CSS、shadcn/ui。图表全部使用手写 SVG，没有引入额外的图表库。

## 目录

- `src/lib/stages.ts`：各章节的文字内容与数字
- `src/components/diagrams/`：各章节的交互图
- `src/components/`：总览图、范式地图、成绩图、总结表等

数字来自各论文和官方博客。不同工作的基座模型、脚手架和采样预算不同，横向比较时请注意口径。
