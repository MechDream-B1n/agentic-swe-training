"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

const agents = [
  {
    name: "SWE-agent",
    color: "#0ea5e9",
    tools:
      "暴露的是一套 ACI 命令：find_file、search_dir、search_file、open、goto、scroll_up、scroll_down、create、edit、submit。它们以 shell 函数的形式装进容器。配置若允许，这一轮也可以改成一条普通命令，例如 python reproduce.py。论文里的 shell-only 对照会拿掉这套专用命令。",
    turnTitle: "这一轮模型提交的原文",
    turn: "Thought: 先按文件名定位实现。\n\n```\nfind_file separable.py\n```",
    turnNote:
      "一次补全。代码块外是 Thought，代码块里恰好一条命令。程序把两段切开；格式不合规则再向模型要一次。思考不会被执行。",
    context:
      "系统提示和少量示例一直留在提示里。文件查看器每次大约 100 行、带行号，所以 open 的观察本身只有这一窗。最近约 5 条观察在下一轮提示里保留全文，更早的收成一行。当前打开的文件和窗口位置记在 ACI 里，下一条 scroll 不用再写路径。",
    trajTitle: "轨迹文件里的一轮",
    traj: '{\n  "thought": "先按文件名定位实现。",\n  "action": "find_file separable.py",\n  "observation": "Found 1 matches for \\"separable.py\\":\\n/astropy/modeling/separable.py"\n}',
    trajNote:
      "按轮保存 Thought、Action、Observation。提示里被收成一行的旧观察，轨迹文件里通常仍是全文。最后一轮的命令是 submit，里面不写补丁；补丁是容器里的 git diff。",
    edit: "edit 245:245\n    cright[-right.shape[0]:, -right.shape[1]:] = right\nend_of_edit",
    editNote: "edit 后面跟替换文本，用 end_of_edit 结束。写完跑 linter，语法错误回滚，观察写明没有写入。",
  },
  {
    name: "mini-swe-agent",
    color: "#71717a",
    tools:
      "只暴露 bash。没有工具调用 API，也没有 find_file、open、edit 这些专用命令。模型用 ls、grep、sed、python，或任何 shell 里存在的程序。2025 年由 SWE-agent 同一路线收薄，放在这一章里对照；时间上晚于 OpenHands。",
    turnTitle: "这一轮模型提交的原文",
    turn: "THOUGHT: 目录不会保留，所以在同一条命令里进入仓库再查找。\n\n```mswea_bash_command\ncd /repo && find . -name separable.py\n```",
    turnNote:
      "一次补全，恰好一个 bash 代码块，块里一条命令，可以用 && 或 || 串起来。块外的文字留在助手消息里，不会被执行。格式不对就拒绝这次输出。",
    context:
      "历史是线性的：系统提示、任务、助手消息、观察，按顺序全部进入下一轮。默认不把旧观察收成一行，轨迹和提示是同一份消息列表。单条输出过长时，环境可以先截断再追加，截断后的文本就是记录里的那一条。没有文件窗口这种隐藏状态。",
    trajTitle: "轨迹文件里的两则消息",
    traj: '{\n  "role": "assistant",\n  "content": "THOUGHT: ...\\n```mswea_bash_command\\ncd /repo && find . -name separable.py\\n```"\n}\n{\n  "role": "user",\n  "content": "<returncode>0</returncode>\\n<output>\\n./astropy/modeling/separable.py\\n</output>"\n}',
    trajNote:
      "每一步只是往消息列表末尾追加。结束命令必须单独一条：echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT。补丁同样来自 git diff，不写在这条 echo 里。",
    edit: "cd /repo && python - <<'PY'\nfrom pathlib import Path\np = Path(\"astropy/modeling/separable.py\")\nfile = p.read_text()\np.write_text(file.replace(\"= 1\", \"= right\", 1))\nPY",
    editNote: "没有 edit 命令，也没有 linter 回滚。改文件就是一条会写仓库的 bash。每条命令都是新的子进程，上一条的 cd 不会留下来，所以要写在同一条里。",
  },
]

export function SweAgentNotes() {
  const [i, setI] = useState(0)
  const cur = agents[i]
  return (
    <DiagramFrame title="图 1 续 · SWE-agent 与 mini-swe-agent" hint="切换后看工具、一轮原文、上下文和轨迹">
      <div className="mb-4 flex flex-wrap gap-2">
        {agents.map((a, idx) => (
          <button
            key={a.name}
            type="button"
            onClick={() => setI(idx)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              i === idx ? "text-white" : "text-muted-foreground hover:bg-muted"
            )}
            style={i === idx ? { background: a.color, borderColor: a.color } : undefined}
          >
            {a.name}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm leading-relaxed">{cur.tools}</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold" style={{ color: cur.color }}>{cur.turnTitle}</div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">{cur.turn}</pre>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cur.turnNote}</p>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold" style={{ color: cur.color }}>改文件时这一轮可以写成</div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">{cur.edit}</pre>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cur.editNote}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold" style={{ color: cur.color }}>上下文</div>
            <p className="mt-2 text-sm leading-relaxed">{cur.context}</p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold" style={{ color: cur.color }}>{cur.trajTitle}</div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">{cur.traj}</pre>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cur.trajNote}</p>
          </div>
        </div>
      </div>
    </DiagramFrame>
  )
}
