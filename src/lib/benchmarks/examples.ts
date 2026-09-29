export type Snippet = {
  label: string;
  lang: string;
  code: string;
  caption: string;
};

export type ExampleBlock = {
  heading: string;
  prose: string;
  snippets: Snippet[];
};

export const sweExample: ExampleBlock[] = [
  {
    heading: "解题时只看见 issue 和起点代码",
    prose: "教学例叫 acme__ports-17。仓库、issue 和测试是为了把字段走通而缩小的，不是榜上的真题，也没有官方镜像。模型拿到的是 base_commit 上的 ports.py，以及这段问题说明。",
    snippets: [
      {
        label: "ports.py @ base_commit",
        lang: "python",
        code: `def parse_port(text: str) -> int:
    port = int(text)
    if port <= 0 or port > 65535:
        raise ValueError("port out of range")
    return port`,
        caption: "0 被 `<= 0` 拒绝。这是 bug 所在的起点，还不是补丁。",
      },
      {
        label: "problem_statement",
        lang: "text",
        code: `parse_port rejects port 0

Calling parse_port("0") raises ValueError.
Port 0 is a valid port number and should be returned.
Ports above 65535 must still be rejected.`,
        caption: "多条真实 issue 会拼成一份说明。hints_text 是另一份更早的讨论，论文主实验不发给模型。",
      },
    ],
  },
  {
    heading: "人类 PR 被拆成两份 diff",
    prose: "出题方把已合并的修复拆开。行为改动是金补丁 patch。测试改动是 test_patch。解题时两份都不可见。仓库里原有的 test_port_80 和 test_port_too_high 已经在起点上，模型可以读、可以跑。test_port_zero 这时还不存在。",
    snippets: [
      {
        label: "patch（金补丁）",
        lang: "diff",
        code: `diff --git a/ports.py b/ports.py
--- a/ports.py
+++ b/ports.py
@@ -1,6 +1,6 @@
 def parse_port(text: str) -> int:
     port = int(text)
-    if port <= 0 or port > 65535:
+    if port < 0 or port > 65535:
         raise ValueError("port out of range")
     return port`,
        caption: "金补丁是人类当时的一种写法。评测用它做 gold 自检，以及当初生成测试名单。",
      },
      {
        label: "test_patch",
        lang: "diff",
        code: `diff --git a/tests/test_ports.py b/tests/test_ports.py
--- a/tests/test_ports.py
+++ b/tests/test_ports.py
@@ -6,3 +6,6 @@ def test_port_too_high():
     with pytest.raises(ValueError):
         parse_port("70000")
+
+def test_port_zero():
+    assert parse_port("0") == 0`,
        caption: "交卷之后，仓库评测脚本才把这份测试打进干净容器。",
      },
    ],
  },
  {
    heading: "两遍日志变成 FAIL_TO_PASS 和 PASS_TO_PASS",
    prose: "出题方先只打 test_patch，再打上金补丁，各跑一次。从失败变成通过的测试名进入 FAIL_TO_PASS。两次都通过的进入 PASS_TO_PASS。公开数据里这两个字段有时是数组，有时是数组的 JSON 字符串。",
    snippets: [
      {
        label: "两次 pytest 摘要",
        lang: "text",
        code: `只有 test_patch
FAILED tests/test_ports.py::test_port_zero
PASSED tests/test_ports.py::test_port_80
PASSED tests/test_ports.py::test_port_too_high

test_patch + 金补丁
PASSED tests/test_ports.py::test_port_zero
PASSED tests/test_ports.py::test_port_80
PASSED tests/test_ports.py::test_port_too_high`,
        caption: "标准答案是这组状态过渡。diff 文本不必和金补丁逐字相同。",
      },
      {
        label: "写进题目的名单",
        lang: "json",
        code: `{
  "instance_id": "acme__ports-17",
  "FAIL_TO_PASS": ["tests/test_ports.py::test_port_zero"],
  "PASS_TO_PASS": [
    "tests/test_ports.py::test_port_80",
    "tests/test_ports.py::test_port_too_high"
  ]
}`,
        caption: "FAIL_TO_PASS 看问题有没有修好。PASS_TO_PASS 看旧行为还在不在。",
      },
    ],
  },
  {
    heading: "模型交另一份补丁，仍可以 resolved",
    prose: "scaffold 在起点上改代码，结束时抽出 git diff。下面这份把判断写成区间，和人类 PR 的 diff 不同。三道测试的过渡与金补丁相同，这道题 resolved。若模型删掉上界检查，test_port_zero 会过，test_port_too_high 会失败，resolved 仍是 false。",
    snippets: [
      {
        label: "一份同样算对的 model_patch",
        lang: "diff",
        code: `diff --git a/ports.py b/ports.py
--- a/ports.py
+++ b/ports.py
@@ -1,6 +1,6 @@
 def parse_port(text: str) -> int:
     port = int(text)
-    if port <= 0 or port > 65535:
+    if not (0 <= port <= 65535):
         raise ValueError("port out of range")
     return port`,
        caption: "上下文必须对得上 base_commit。对不上时，日志是无法应用补丁，而不是测试失败。",
      },
      {
        label: "preds.jsonl 里的一行",
        lang: "json",
        code: `{
  "instance_id": "acme__ports-17",
  "model_name_or_path": "demo-model",
  "model_patch": "diff --git a/ports.py b/ports.py\\n..."
}`,
        caption: "官方预测至少这三个字段。一个模型一次运行通常是一个 JSONL 文件。",
      },
    ],
  },
  {
    heading: "干净容器里重放，再写报告",
    prose: "解题容器里的现场丢掉。评测从 base_commit 另起容器。镜像大致三层：基础语言、这个仓库的依赖、停在该提交的题目。harness 写入 model_patch，多次尝试 git apply；失败可能弄脏工作区，所以下一次前会先恢复干净树。都失败时，再用反向检查确认补丁是不是其实已经完整打上。应用成功后，评测脚本才打 test_patch 并跑测试。",
    snippets: [
      {
        label: "评测入口",
        lang: "bash",
        code: `python -m swebench.harness.run_evaluation \\
  --dataset_name princeton-nlp/SWE-bench_Lite \\
  --predictions_path preds.jsonl \\
  --max_workers 4 \\
  --run_id ports-demo-001`,
        caption: "参数名来自当前官方文档。predictions_path 设为 gold 时，用金补丁做镜像自检，那不是模型成绩。",
      },
      {
        label: "这道题的报告",
        lang: "json",
        code: `{
  "acme__ports-17": {
    "patch_exists": true,
    "patch_successfully_applied": true,
    "resolved": true
  }
}`,
        caption: "同一 run_id 和 instance_id 会复用已有日志，缓存不看补丁内容。换了 model_patch 就要换 run_id。",
      },
    ],
  },
];

export const tbV1Example: ExampleBlock[] = [
  {
    heading: "指令和解析器写在同一个 YAML 里",
    prose: "教学例叫 summarize：修好一个打印行数的脚本。它不是 Terminal-Bench 仓库里的真题。说明嵌在 task.yaml。很多真题还有 docker-compose.yaml；这里只用 Dockerfile，方便看清每个文件在哪一步被读取。",
    snippets: [
      {
        label: "summarize/ 目录",
        lang: "text",
        code: `summarize/
  task.yaml
  Dockerfile
  run-tests.sh
  solution.sh
  tests/test_outputs.py`,
        caption: "agent 解题时读得到指令。run-tests.sh、tests/ 和 solution.sh 在它停止之后才由框架使用。",
      },
      {
        label: "task.yaml",
        lang: "yaml",
        code: `instruction: |-
  /app/bin/summarize.sh should print how many lines are in
  /app/data/notes.txt. Print one integer and nothing else.
  The script currently fails.
parser_name: pytest
max_agent_timeout_sec: 300
max_test_timeout_sec: 60`,
        caption: "真实任务还会写作者、难度和更多超时。这里的 300 和 60 只是示例。parser_name 指向评测仓库里的解析器。",
      },
    ],
  },
  {
    heading: "工作容器里是一台已经坏了的机器",
    prose: "Dockerfile 建出 agent 生活的环境。notes.txt 有 3 行，脚本却去读一个不存在的文件。agent 可以 cat 数据、可以改脚本、可以自己运行 summarize.sh，并看见命令输出。",
    snippets: [
      {
        label: "Dockerfile",
        lang: "dockerfile",
        code: `FROM python:3.11-slim
WORKDIR /app
RUN mkdir -p /app/bin /app/data
RUN printf 'alpha\\nbeta\\ngamma\\n' > /app/data/notes.txt
RUN printf '#!/bin/bash\\nwc -l /app/data/missing.txt\\n' > /app/bin/summarize.sh
RUN chmod +x /app/bin/summarize.sh`,
        caption: "测试文件不要打进这张镜像。验收发生在 agent 停止之后。",
      },
      {
        label: "solution.sh（仅 oracle）",
        lang: "bash",
        code: `#!/bin/bash
wc -l < /app/data/notes.txt | awk '{print $1}'`,
        caption: "参考解用来确认这道题能通过解析器。agent 看不到这份脚本。",
      },
    ],
  },
  {
    heading: "停止之后才跑测试，解析器在框架里",
    prose: "框架把 tests/ 放到环境中的 /tests，执行 run-tests.sh。pytest 断言标准输出去掉空白后是 3。Terminal-Bench 仓库里的 pytest 解析器读这份输出，映射成通过或失败。",
    snippets: [
      {
        label: "tests/test_outputs.py",
        lang: "python",
        code: `import subprocess

def test_line_count():
    out = subprocess.check_output(["/app/bin/summarize.sh"], text=True)
    assert out.strip() == "3"`,
        caption: "指令已经要求打印行数，所以隐藏测试核对的是指令写出的行为。测试没覆盖到的行为，解析器不会额外判。",
      },
      {
        label: "run-tests.sh",
        lang: "bash",
        code: `#!/bin/bash
pytest -q /tests/test_outputs.py`,
        caption: "退出码和 pytest 摘要交给 parser_name 指定的解析器。计分对象是 agent 加模型。",
      },
    ],
  },
];
