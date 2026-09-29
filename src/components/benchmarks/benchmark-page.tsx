"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  compareRows,
  glossary,
  sweBranches,
  sweFields,
  sweTools,
  tbV1Fields,
  type Field,
  type Phase,
} from "@/lib/benchmarks/content";
import { sweExample, tbV1Example, type ExampleBlock, type Snippet } from "@/lib/benchmarks/examples";
import { LayerDiagram, StepBar, SweDiagram, SweHarnessPlayer, TbDiagram, TbHarnessPlayer, TimelinePlayer } from "@/components/benchmarks/flow-diagrams";

export function BenchmarkPage() {
  const [phase, setPhase] = useState<Phase>("solve");
  const [branch, setBranch] = useState(sweBranches[0].name);
  const activeBranch = sweBranches.find((item) => item.name === branch) ?? sweBranches[0];

  return (
    <div className="min-h-full">
      <SiteNav />
      <main id="top" className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6">
        <section className="py-12 sm:py-16">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">学习笔记 · Coding agent benchmarks</p>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            两份考试，
            <span className="bg-gradient-to-r from-sky-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent">两种交卷方式</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            SWE-bench 要一份补丁。Terminal-Bench 要一台被改完的机器。分数都带着 scaffold，不能只看模型名。
          </p>
          <div className="mt-8 flex flex-col gap-4">
            <LayerDiagram />
            <dl className="grid gap-3">
              {glossary.map((item) => (
                <div key={item.term} className="rounded-xl border bg-card px-4 py-3">
                  <dt className="text-sm font-medium">{item.term}</dt>
                  <dd className="mt-1 text-sm leading-6 text-muted-foreground">{item.def}</dd>
                </div>
              ))}
            </dl>
            <Callout>
              <b>阅读顺序：</b>
              先看上面三层，分清谁在做事、谁在判分。然后读 SWE-bench 的流程图和教学例，再读 Terminal-Bench 的两代目录。最后用对照把交卷物和现场对上。
            </Callout>
          </div>
        </section>

        <section id="swe" className="scroll-mt-20 flex flex-col gap-6 border-t py-14 sm:py-20">
          <SectionHeading
            index="01"
            color="#0ea5e9"
            kicker="交一份补丁"
            title="SWE-bench"
            tagline="真实仓库停在 base_commit。模型只看见 issue。评测把补丁打进干净容器，再注入当时 PR 新增的测试。"
          />
          <SweIntro />
          <SweDiagram />
          <Walkthrough blocks={sweExample} />
          <Visibility phase={phase} onPhase={setPhase} fields={sweFields} />
          <SweHarnessPlayer />
          <Tools />
          <TimelinePlayer />
          <section className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-6">
            <h2 className="text-xl font-bold tracking-tight">切片</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              都是交补丁、看测试过渡。差别在题从哪来，以及榜单有没有把 scaffold 写死。带约数的规模以官方页面为准。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sweBranches.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setBranch(item.name)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    branch === item.name ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <p className="mt-4 text-base leading-7">{activeBranch.text}</p>
          </section>
        </section>

        <section id="tb" className="scroll-mt-20 flex flex-col gap-6 border-t py-14 sm:py-20">
          <SectionHeading
            index="02"
            color="#10b981"
            kicker="交一台机器"
            title="Terminal-Bench"
            tagline="给一台准备好的机器和一段指令。结束后跑 run-tests.sh，由框架解析 pytest 输出。"
          />
          <TbIntro />
          <TbDiagram />
          <Walkthrough blocks={tbV1Example} />
          <Visibility phase={phase} onPhase={setPhase} fields={tbV1Fields} />
          <TbHarnessPlayer />
        </section>

        <section id="train" className="scroll-mt-20 flex flex-col gap-4 border-t py-14 sm:py-20">
          <SectionHeading
            index="03"
            color="#f59e0b"
            kicker="和训练场接上"
            title="这些考试在训练路线里"
            tagline="SWE-Gym、SWE-smith、R2E-Gym 用同一套「补丁 + 测试过渡」当训练信号。报出来的 SWE-bench 分数仍是在这里重考一次。"
          />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["SWE-Gym", "真实 issue 做成可执行环境。训练时测试当 0/1 奖励。对外的 Lite / Verified 分数仍走 SWE-bench 的干净容器。", "/#swe-gym"],
              ["SWE-smith / R2E-Gym", "合成或从 commit 挖出的任务，判分语义仍是 FAIL_TO_PASS 与 PASS_TO_PASS。", "/#synth"],
              ["SWE-RL", "训练奖励是和 oracle 补丁的文本相似度，不跑这套隐藏测试。", "/#swe-rl"],
              ["DeepSWE / Self-play", "DeepSWE 在合成环境里用测试 0/1。Self-play 的测试由模型自己写，不使用这里的人工 test_patch。", "/#deepswe"],
            ].map(([title, body, href]) => (
              <li key={title} className="rounded-xl border bg-card p-4">
                <a href={href} className="text-sm font-semibold underline-offset-2 hover:underline">{title}</a>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="compare" className="scroll-mt-20 border-t py-14 sm:py-20">
          <SectionHeading
            index="04"
            color="#6366f1"
            kicker="放在一起"
            title="对照"
            tagline="同一类「把仓库或机器改到目标状态」的考试，交卷物和打分现场不一样。"
          />
          <ul className="mt-8 space-y-3">
            {compareRows.map((row) => (
              <li key={row.dim} className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold">{row.dim}</p>
                <p className="mt-2 text-sm leading-6">
                  <span className="font-medium text-sky-600">SWE-bench · </span>
                  {row.swe}
                </p>
                <p className="mt-1 text-sm leading-6">
                  <span className="font-medium text-emerald-600">Terminal-Bench · </span>
                  {row.tb}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        教学例不是榜上的真题。规模若与官方页面不一致，以 swebench.com 和 Terminal-Bench 仓库为准。
      </footer>
    </div>
  );
}

const NAV = [
  { id: "swe", label: "SWE-bench", color: "#0ea5e9" },
  { id: "tb", label: "Terminal-Bench", color: "#10b981" },
  { id: "train", label: "训练场", color: "#f59e0b" },
  { id: "compare", label: "对照", color: "#6366f1" },
];

function SiteNav() {
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setProgress(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight));
      let cur: string | null = null;
      for (const item of NAV) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) cur = item.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-sm font-bold tracking-tight">
          训练范式
        </Link>
        <a href="#top" className="shrink-0 text-sm font-medium text-muted-foreground">
          两份 Benchmark
        </a>
        <nav className="no-scrollbar -mx-2 flex min-w-0 flex-1 gap-1 overflow-x-auto px-2">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                active === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="size-1.5 rounded-full" style={{ background: item.color }} />
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="h-0.5 bg-foreground transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
    </header>
  );
}

function SectionHeading({
  index,
  color,
  kicker,
  title,
  tagline,
}: {
  index: string;
  color: string;
  kicker: string;
  title: string;
  tagline: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
        style={{ background: color }}
      >
        {index}
      </span>
      <div>
        <p className="mb-1 text-xs font-medium" style={{ color }}>{kicker}</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">{tagline}</p>
      </div>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
      <span className="mt-0.5 text-amber-500" aria-hidden>✦</span>
      <div>{children}</div>
    </div>
  );
}

function Visibility({
  phase,
  onPhase,
  fields,
}: {
  phase: Phase;
  onPhase: (phase: Phase) => void;
  fields: Field[];
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">谁能看见什么</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">切换阶段，每一行只显示这一侧。</p>
        </div>
        <div className="inline-flex self-start rounded-full border bg-background p-1 text-sm">
          <BenchButton active={phase === "solve"} onClick={() => onPhase("solve")}>解题时</BenchButton>
          <BenchButton active={phase === "grade"} onClick={() => onPhase("grade")}>评测时</BenchButton>
        </div>
      </div>
      <FieldList fields={fields} phase={phase} />
    </section>
  );
}

function BenchButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ${active ? "bg-foreground text-background" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

function SweIntro() {
  return (
    <section className="h-full rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-6">
      <h2 className="text-xl font-semibold">SWE-bench 在问什么</h2>
      <p className="mt-3 leading-7">
        给定真实仓库在 <code className="font-mono text-sm">base_commit</code> 的样子，以及对应的 GitHub issue，交出一份 unified diff。评测把这份补丁打进干净容器，再注入当时 PR 新增的测试。
      </p>
      <p className="mt-3 leading-7 text-muted-foreground">
        下面的图用缩小的 <code className="font-mono text-sm">acme__ports-17</code> 串起造题、交卷和打分。代码块在图的后面。
      </p>
    </section>
  );
}

function TbIntro() {
  return (
    <section className="h-full rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-6">
      <h2 className="text-xl font-semibold">Terminal-Bench 在问什么</h2>
      <p className="mt-2 leading-7 text-muted-foreground">
        给一台准备好的机器和一段指令，让 agent 把机器做成指令描述的状态。教学例 summarize 用这套目录走一遍。
      </p>
      <p className="mt-4 leading-7">
        指令嵌在 task.yaml 里。结束后跑 run-tests.sh，由评测仓库里的解析器读 pytest 输出。
      </p>
    </section>
  );
}

function FieldList({ fields, phase }: { fields: Field[]; phase: Phase }) {
  return (
    <ul className="mt-4">
      {fields.map((field) => {
        const cell = phase === "solve" ? field.solve : field.grade;
        const hidden = cell.includes("不可见") || cell === "不用" || cell.startsWith("不参与");
        return (
          <li key={field.name} className="border-t border-border py-3">
            <p className="font-mono text-xs">{field.name}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{field.what}</p>
            <p className={`mt-1 text-sm leading-6 ${hidden ? "text-red-600" : "text-emerald-700"}`}>{cell}</p>
          </li>
        );
      })}
    </ul>
  );
}

function Tools() {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-6">
      <h2 className="text-xl font-semibold">工具不是 benchmark 发的</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        SWE-bench 只收 unified diff。看文件、搜索、编辑、跑 bash，都是 scaffold 决定的。可以跑起点上已有的测试，那不等于看见了交卷后才注入的 test_patch。
      </p>
      <ul className="mt-4 grid gap-3">
        {sweTools.map((tool) => (
          <li key={tool.name} className="rounded-2xl border border-border bg-background p-3">
            <div className="flex items-baseline justify-between gap-3">
              {tool.href ? (
                <a href={tool.href} className="text-sm font-medium underline-offset-2 hover:underline">{tool.name}</a>
              ) : (
                <p className="text-sm font-medium">{tool.name}</p>
              )}
              <p className="shrink-0 font-mono text-[11px] text-muted-foreground">{tool.loop}</p>
            </div>
            <p className="mt-2 text-sm leading-6">{tool.can}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{tool.use}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Walkthrough({ blocks }: { blocks: ExampleBlock[] }) {
  const [index, setIndex] = useState(0);
  const clamped = Math.min(index, Math.max(0, blocks.length - 1));
  const block = blocks[clamped];

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">对照代码</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            一次看一段。字段名对齐公开格式。仓库、脚本和超时都是教学例，不能拿去对官方榜。
          </p>
        </div>
        <p className="shrink-0 font-mono text-xs text-muted-foreground">
          {clamped + 1}/{blocks.length}
        </p>
      </div>
      <article className="mt-4">
        <h3 className="text-lg font-semibold">{block.heading}</h3>
        <p className="mt-2 text-sm leading-7">{block.prose}</p>
        {block.snippets.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {block.snippets.map((snippet) => (
              <CodeBlock key={snippet.label} snippet={snippet} />
            ))}
          </div>
        ) : null}
      </article>
      <StepBar labels={blocks.map((item) => item.heading)} index={clamped} onChange={setIndex} numbered />
    </section>
  );
}

function CodeBlock({ snippet }: { snippet: Snippet }) {
  return (
    <figure className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <figcaption className="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs">
        <span className="font-medium">{snippet.label}</span>
        <span className="font-mono text-muted-foreground">{snippet.lang}</span>
      </figcaption>
      <pre className="overflow-x-auto bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-zinc-100">
        <code>{snippet.code}</code>
      </pre>
      {snippet.caption ? (
        <figcaption className="border-t px-3 py-2 text-sm leading-6 text-muted-foreground">
          {snippet.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
