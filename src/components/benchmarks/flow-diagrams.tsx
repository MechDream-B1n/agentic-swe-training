"use client";

import { useState, type ReactNode } from "react";
import { sweHarness, sweTimeline, tbV1Harness, type Step } from "@/lib/benchmarks/content";

export function LayerDiagram() {
  const layers = [
    {
      name: "模型",
      role: "读题，决定下一步",
      detail: "它只产出下一步要说的话。隐藏测试和金补丁都不在它手里。换一个模型，分数当然会变。",
    },
    {
      name: "scaffold",
      role: "循环、工具、何时停",
      detail: "看文件、搜索、编辑、跑命令，都是这一层接上的。SWE-bench 不附送工具。同一个模型换一套循环，分数可以差一截。",
    },
    {
      name: "harness",
      role: "隐藏测试，负责打分",
      detail: "出题方的环境和判分程序。SWE-bench 只收补丁，在干净容器里重放。Terminal-Bench 等 agent 停下，再验证那台机器。",
    },
  ];
  const [index, setIndex] = useState(0);
  const active = layers[index];

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">三层交卷 · 点一层看它负责什么</p>
      <div className="mt-3 flex items-stretch gap-1 sm:gap-2">
        {layers.map((layer, i) => (
          <div key={layer.name} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={`min-w-0 flex-1 rounded-xl border px-2 py-3 text-left transition-colors sm:px-3 ${
                i === index ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted"
              }`}
            >
              <p className="truncate text-sm font-semibold">{layer.name}</p>
              <p className={`mt-1 text-[11px] leading-4 sm:text-xs ${i === index ? "text-white/75" : "text-muted-foreground"}`}>
                {layer.role}
              </p>
            </button>
            {i < layers.length - 1 ? (
              <span className="shrink-0 text-xs text-sky-500" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-xl bg-muted px-3 py-3 text-sm leading-6">{active.detail}</p>
    </div>
  );
}

export function SweDiagram() {
  return (
    <Stage
      title="流程"
      eyebrow="教学例 acme__ports-17"
      stages={[
        { label: "造题", hint: "已合并的 PR 拆成行为改动和测试改动。", scene: <MakeScene /> },
        { label: "贴名单", hint: "只打测试、再加上金补丁，各跑一遍。", scene: <ListScene /> },
        { label: "解题", hint: "模型只看见 issue 和起点上的代码。", scene: <SolveScene /> },
        { label: "打分", hint: "另起干净容器。先应用补丁，再注入测试。", scene: <GradeScene /> },
        { label: "判定", hint: "两份名单都要全过。补丁文本不必等于金补丁。", scene: <VerdictScene /> },
      ]}
    />
  );
}

export function TbDiagram() {
  return (
    <Stage
      title="流程"
      eyebrow="教学例 summarize"
      stages={[
        { label: "工作", hint: "机器里只有坏脚本和数据。测试还在外面。", scene: <TbWork /> },
        { label: "停止", hint: "自己停，或时间用完。这时测试才进机器。", scene: <TbStop /> },
        { label: "判分", hint: "框架解析 pytest 输出。", scene: <TbGrade /> },
      ]}
    />
  );
}

export function HarnessPlayer({ steps }: { steps: Step[] }) {
  return (
    <Stage
      title="评测步骤"
      eyebrow="点数字，或用上一步 / 下一步"
      numbered
      stages={steps.map((step) => ({
        label: step.title,
        hint: step.body,
        scene: step.code ? <CodePane label={step.codeLabel ?? "片段"} code={step.code} /> : null,
      }))}
    />
  );
}

export function SweHarnessPlayer() {
  return <HarnessPlayer steps={sweHarness} />;
}

export function TbHarnessPlayer() {
  return <HarnessPlayer steps={tbV1Harness} />;
}

export function TimelinePlayer() {
  return (
    <Stage
      title="三段时间"
      eyebrow="同一条路，换成时间顺序再看一遍"
      stages={sweTimeline.map((item) => ({
        label: item.phase,
        hint: item.phase === "打分" ? "解题现场不能留下来。" : item.phase === "解题" ? "模型看不到名单和金补丁。" : "丢掉装不上或测不稳的样本。",
        scene: (
          <ol className="space-y-2">
            {item.points.map((point, i) => (
              <li key={point} className="flex gap-3 rounded-xl border bg-background px-3 py-2.5 text-sm leading-6">
                <span className="font-mono text-xs text-sky-600">{i + 1}</span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        ),
      }))}
    />
  );
}

export function StepBar({
  labels,
  index,
  onChange,
  numbered = false,
}: {
  labels: string[];
  index: number;
  onChange: (index: number) => void;
  numbered?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(index - 1)}
        disabled={index === 0}
        className="shrink-0 rounded-full border px-3 py-1.5 text-sm disabled:opacity-35"
      >
        上一步
      </button>
      <div className="no-scrollbar flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-current={i === index ? "step" : undefined}
            onClick={() => onChange(i)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
              i === index ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {numbered ? i + 1 : label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(index + 1)}
        disabled={index === labels.length - 1}
        className="shrink-0 rounded-full border px-3 py-1.5 text-sm disabled:opacity-35"
      >
        下一步
      </button>
    </div>
  );
}

function Stage({
  title,
  eyebrow,
  stages,
  numbered = false,
}: {
  title: string;
  eyebrow: string;
  stages: { label: string; hint: string; scene: ReactNode | null }[];
  numbered?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const current = stages[index];

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground">{eyebrow}</p>
        </div>
        <p className="shrink-0 font-mono text-xs text-muted-foreground">
          {index + 1}/{stages.length}
        </p>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {stages.map((stage, i) => (
          <span key={stage.label} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-foreground" : "bg-muted"}`} />
        ))}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium">{current.label}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{current.hint}</p>
      </div>
      {current.scene ? (
        <div className="mt-4" aria-live="polite">
          {current.scene}
        </div>
      ) : null}
      <StepBar labels={stages.map((stage) => stage.label)} index={index} onChange={setIndex} numbered={numbered} />
    </section>
  );
}

function MakeScene() {
  return (
    <div>
      <div className="mx-auto w-fit rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm">
        已合并 PR
      </div>
      <Fork />
      <div className="grid gap-3 sm:grid-cols-2">
        <DiffCard
          title="金补丁"
          badge="解题时藏住"
          tone="sky"
          lines={[
            { kind: "del", text: "if port <= 0 or port > 65535:" },
            { kind: "add", text: "if port < 0 or port > 65535:" },
          ]}
          note="只改行为。评测用它做 gold 自检，也用它当初生成名单。"
        />
        <DiffCard
          title="test_patch"
          badge="交卷后才注入"
          tone="amber"
          lines={[
            { kind: "add", text: "def test_port_zero():" },
            { kind: "add", text: '    assert parse_port("0") == 0' },
          ]}
          note="起点上还没有 test_port_zero。已有的 test_port_80 不在这份 diff 里。"
        />
      </div>
    </div>
  );
}

function ListScene() {
  const rows = [
    { name: "test_port_zero", before: false, after: true, list: "FAIL_TO_PASS" },
    { name: "test_port_80", before: true, after: true, list: "PASS_TO_PASS" },
    { name: "test_port_too_high", before: true, after: true, list: "PASS_TO_PASS" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Terminal title="只有 test_patch" lines={rows.map((row) => ({ name: row.name, ok: row.before }))} />
        <Terminal title="再加上金补丁" lines={rows.map((row) => ({ name: row.name, ok: row.after }))} />
      </div>
      <ul className="overflow-hidden rounded-xl border bg-background">
        {rows.map((row) => (
          <li key={row.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-3 py-2 text-xs first:border-t-0 sm:text-sm">
            <span className="font-mono">{row.name}</span>
            <span className="text-muted-foreground">
              <Status ok={row.before} light /> → <Status ok={row.after} light />
            </span>
            <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[11px] ${row.list === "FAIL_TO_PASS" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {row.list}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SolveScene() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border-2 border-emerald-600/30">
          <p className="bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">看得见 · issue 和 base_commit</p>
          <div className="space-y-3 bg-background px-3 py-3">
            <p className="text-sm leading-6">parse_port rejects port 0. Port 0 should be returned. Ports above 65535 must still be rejected.</p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-relaxed text-zinc-100">
              <span className="text-amber-300">if port &lt;= 0 or port &gt; 65535:</span>
              {"\n"}    raise ValueError(...)
            </pre>
            <div className="flex flex-wrap gap-1.5">
              <Chip>test_port_80</Chip>
              <Chip>test_port_too_high</Chip>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-red-300">
          <p className="bg-red-50 px-3 py-2 text-xs font-medium text-red-700">藏起来 · 交卷前不出现</p>
          <ul className="space-y-2 bg-background px-3 py-3 text-sm">
            <Seal name="金补丁" text="port <= 0 改成 port < 0" />
            <Seal name="test_patch" text="新增 test_port_zero" />
            <Seal name="两份名单" text="FAIL_TO_PASS 与 PASS_TO_PASS" />
          </ul>
        </div>
      </div>
      <p className="rounded-xl bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-6 text-zinc-100">
        preds.jsonl → instance_id, model_name_or_path, model_patch
      </p>
    </div>
  );
}

function GradeScene() {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-xs text-muted-foreground">干净容器 · 从 base_commit 重新启动，解题现场丢掉</p>
      <div className="mx-auto mt-3 w-fit rounded-full border px-3 py-1 font-mono text-xs">git apply model_patch</div>
      <Fork />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-sm font-medium text-red-700">打不上</p>
          <p className="mt-2 text-sm leading-6">几种 apply 都失败，就停在这里。没有测试日志。这题未解决，但原因不是测试没过。</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
          <p className="text-sm font-medium text-emerald-800">打得上</p>
          <ol className="mt-2 space-y-1.5 text-sm leading-6">
            <li>1. 注入 test_patch，test_port_zero 这时才出现</li>
            <li>2. 跑测试，留下日志</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function VerdictScene() {
  const cases = [
    {
      id: "gold",
      label: "金补丁",
      code: "if port < 0 or port > 65535",
      zero: true,
      high: true,
      note: "人类当时的写法。三则测试都过。",
    },
    {
      id: "alt",
      label: "另一种写法",
      code: "if not (0 <= port <= 65535)",
      zero: true,
      high: true,
      note: "diff 文本和金补丁不同。两份名单都过，仍然 resolved。",
    },
    {
      id: "break",
      label: "去掉上界",
      code: "if port < 0",
      zero: true,
      high: false,
      note: "0 被修好了，但 70000 不再报错。PASS_TO_PASS 没守住。",
    },
  ];
  const [id, setId] = useState(cases[0].id);
  const current = cases.find((item) => item.id === id) ?? cases[0];
  const resolved = current.zero && current.high;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {cases.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setId(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs sm:text-sm ${id === item.id ? "bg-foreground text-background" : "border text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 font-mono text-[12px] text-zinc-100">{current.code}</p>
      <ul className="mt-3 space-y-1.5">
        <TestLamp name="test_port_zero" ok={current.zero} list="FAIL_TO_PASS" />
        <TestLamp name="test_port_80" ok list="PASS_TO_PASS" />
        <TestLamp name="test_port_too_high" ok={current.high} list="PASS_TO_PASS" />
      </ul>
      <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-3 ${resolved ? "bg-emerald-50" : "bg-red-50"}`}>
        <p className="text-sm leading-6">{current.note}</p>
        <p className={`font-mono text-sm font-semibold ${resolved ? "text-emerald-700" : "text-red-600"}`}>
          {resolved ? "resolved" : "未解决"}
        </p>
      </div>
    </div>
  );
}

function TbWork() {
  return (
    <div className="space-y-3">
      <p className="rounded-xl border bg-background px-3 py-2 text-sm leading-6">
        指令写在 task.yaml 里。让 /app/bin/summarize.sh 打印 /app/data/notes.txt 的行数。
      </p>
      <Machine caption="agent 正在改这台机器">
        <File name="bin/summarize.sh" tone="bad" body="wc -l /app/data/missing.txt" />
        <File name="data/notes.txt" tone="ok" body={"alpha\nbeta\ngamma"} />
      </Machine>
      <Outside label="还在机器外面">
        <Ghost>tests/</Ghost>
        <Ghost>参考解</Ghost>
      </Outside>
    </div>
  );
}

function TbStop() {
  return (
    <div className="space-y-3">
      <Machine caption="agent 已停止">
        <File name="bin/summarize.sh" tone="ok" body="wc -l < /app/data/notes.txt" />
        <File name="run-tests.sh + tests/" tone="new" body="pytest -q /tests/test_outputs.py" />
      </Machine>
      <p className="text-xs leading-5 text-muted-foreground">图里是改对之后的机器。改错或没改完就停，下一拍会判失败。</p>
      <Outside label="仍然不交给 agent">
        <Ghost>参考解</Ghost>
      </Outside>
    </div>
  );
}

function TbGrade() {
  return (
    <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
      <Panel kicker="pytest 输出" body={"PASSED test_line_count\nassert strip() == \"3\""} />
      <div className="flex items-center justify-center text-xs text-emerald-600 sm:flex-col">
        <span aria-hidden>→</span>
        <span className="px-2 text-center text-muted-foreground">parser_name: pytest</span>
      </div>
      <div className="flex flex-col justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
        <p className="text-sm font-medium text-emerald-800">通过或失败</p>
        <p className="mt-1 text-sm leading-6 text-emerald-900/80">解析器在 Terminal-Bench 仓库里，不在任务目录。run-tests.sh 只负责跑测试。</p>
      </div>
    </div>
  );
}

function Fork() {
  return (
    <svg viewBox="0 0 400 44" className="h-10 w-full text-sky-500" aria-hidden>
      <path d="M200 0 V12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M200 12 H92 V44" fill="none" stroke="currentColor" strokeWidth="1.5" className="flow-dash" />
      <path d="M200 12 H308 V44" fill="none" stroke="currentColor" strokeWidth="1.5" className="flow-dash" />
    </svg>
  );
}

function DiffCard({
  title,
  badge,
  tone,
  lines,
  note,
}: {
  title: string;
  badge: string;
  tone: "sky" | "amber";
  lines: { kind: "add" | "del"; text: string }[];
  note: string;
}) {
  const badgeClass = tone === "sky" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-800";
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="text-sm font-medium">{title}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${badgeClass}`}>{badge}</span>
      </div>
      <pre className="overflow-x-auto bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-relaxed text-zinc-100">
        {lines.map((line) => (
          <div key={line.text} className={line.kind === "add" ? "text-emerald-300" : "text-red-300"}>
            {line.kind === "add" ? "+ " : "- "}
            {line.text}
          </div>
        ))}
      </pre>
      <p className="px-3 py-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function Terminal({ title, lines }: { title: string; lines: { name: string; ok: boolean }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="size-2 rounded-full bg-red-400" />
        <span className="size-2 rounded-full bg-amber-300" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-1 font-mono text-[11px] text-zinc-400">{title}</span>
      </div>
      <ul className="space-y-1 px-3 py-3 font-mono text-[12px]">
        {lines.map((line) => (
          <li key={line.name} className="flex items-center justify-between gap-3">
            <span className="truncate">{line.name}</span>
            <Status ok={line.ok} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Status({ ok, light = false }: { ok: boolean; light?: boolean }) {
  const tone = light
    ? ok
      ? "text-emerald-700"
      : "text-red-600"
    : ok
      ? "text-emerald-400"
      : "text-red-400";
  return <span className={tone}>{ok ? "PASSED" : "FAILED"}</span>;
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{children}</span>;
}

function Seal({ name, text }: { name: string; text: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="font-medium text-red-700">{name}</span>
      <span className="text-right text-muted-foreground">{text}</span>
    </li>
  );
}

function TestLamp({ name, ok, list }: { name: string; ok: boolean; list: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
      <span className={`size-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      <span className="font-mono text-xs sm:text-sm">{name}</span>
      <span className="ml-auto font-mono text-[11px] text-muted-foreground">{list}</span>
    </li>
  );
}

function Machine({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-300" />
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="ml-1 font-mono">/app</span>
        </span>
        <span>{caption}</span>
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </div>
  );
}

function File({ name, body, tone }: { name: string; body: string; tone: "bad" | "ok" | "new" }) {
  const ring = tone === "bad" ? "border-red-400/50" : tone === "new" ? "border-amber-300/60" : "border-emerald-400/40";
  return (
    <div className={`rounded-lg border ${ring} bg-white/5 px-3 py-2`}>
      <p className="font-mono text-[11px] text-zinc-400">{name}</p>
      <pre className="mt-1 font-mono text-[12px] leading-5 whitespace-pre-wrap text-zinc-100">{body}</pre>
    </div>
  );
}

function Outside({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {label}
      {children}
    </div>
  );
}

function Ghost({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-dashed border-red-300 px-2 py-1 text-red-600">{children}</span>;
}

function Panel({ kicker, body }: { kicker: string; body: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-zinc-950 text-zinc-100">
      <p className="border-b border-white/10 px-3 py-2 font-mono text-[11px] text-zinc-400">{kicker}</p>
      <pre className="px-3 py-3 font-mono text-[12px] leading-6 whitespace-pre-wrap">{body}</pre>
    </div>
  );
}

function CodePane({ label, code }: { label: string; code: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border bg-card">
      <figcaption className="border-b px-3 py-2 text-xs font-medium">{label}</figcaption>
      <pre className="overflow-x-auto bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-zinc-100">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

