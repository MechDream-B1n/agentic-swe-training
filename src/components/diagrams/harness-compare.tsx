"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

const cols = [
  { id: "swe", name: "SWE-agent", color: "#0ea5e9" },
  { id: "mini", name: "mini-swe-agent", color: "#71717a" },
  { id: "oh", name: "OpenHands CodeActAgent", color: "#8b5cf6" },
] as const

const rows: { label: string; cells: Record<(typeof cols)[number]["id"], string> }[] = [
  {
    label: "暴露的工具",
    cells: {
      swe: "ACI 命令：find_file、search_dir、search_file、open、goto、scroll、create、edit、submit。以 shell 函数装进容器。",
      mini: "只有 bash。没有工具调用 API，也没有专用查看器命令。",
      oh: "execute_bash、execute_ipython_cell、str_replace_editor。browser 可选。用函数调用提交。",
    },
  },
  {
    label: "一轮提交的形式",
    cells: {
      swe: "一次补全。Thought 在代码块外，恰好一条命令在代码块里。",
      mini: "一次补全。THOUGHT 在外面，恰好一个 mswea_bash_command 代码块。",
      oh: "一次工具调用。正文记在 thought。参数是 command、code 或编辑器字段。",
    },
  },
  {
    label: "这一轮可以写什么",
    cells: {
      swe: "一条 ACI 命令，或配置允许时的一条 shell 命令。edit 的正文是要替换进去的行，以 end_of_edit 结束。",
      mini: "一条 bash，可以用 && 串起来。改文件也写在这条 bash 里。不能依赖上一条留下的目录。",
      oh: "一个工具的参数。bash 可以含 &&；Python 是一整格代码；编辑器是 view 或 str_replace 的路径和原文。",
    },
  },
  {
    label: "上下文",
    cells: {
      swe: "系统提示和示例保留。最近约 5 条观察留全文，更早收成一行。查看器窗口约 100 行，当前文件记在 ACI 里。",
      mini: "消息列表原样进入下一轮，默认不折叠旧观察。没有隐藏的文件窗口。",
      oh: "事件流全留。Condenser 另做视图：系统说明和最近事件留下，中间可换成摘要。单条输出写入前会截断。",
    },
  },
  {
    label: "保存的轨迹",
    cells: {
      swe: "按轮的 Thought、Action、Observation。提示里省略的旧观察，文件里通常仍在。",
      mini: "就是那份消息列表。助手消息加下一条带 returncode 和 output 的观察。",
      oh: "带类型的事件：SystemMessageAction、用户消息、Action、Observation、Condensation。",
    },
  },
  {
    label: "容器里的 shell",
    cells: {
      swe: "题目镜像里有一个活着的 shell。cd 能留下。open 和 edit 是装进去的函数，会改查看器并做 linter。",
      mini: "每条命令是一次新的 subprocess 或 docker exec。cd 和 export 不会留到下一条。",
      oh: "一个活着的 bash，外加一块活着的 IPython。当前目录和变量留在沙箱，不自动写进提示。",
    },
  },
  {
    label: "最后怎么交卷",
    cells: {
      swe: "命令是 submit。补丁是 git diff，不写在命令文本里。",
      mini: "单独一条 echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT。补丁仍是 git diff。",
      oh: "评测里用 execute_bash exit，或 AgentFinishAction。补丁从容器的 git diff 取出。",
    },
  },
]

export function HarnessCompare() {
  const [col, setCol] = useState<(typeof cols)[number]["id"]>("oh")
  return (
    <DiagramFrame title="对照 · 三个 harness" hint="点一列，读这一侧在每一行里的做法">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        三个都不更新权重，评测时也都可以启动这道题的 Docker 镜像。差别是模型每一轮被允许提交什么，以及这份记录怎样变成下一轮的上下文。
      </p>
      <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
        {cols.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCol(c.id)}
            className={cn("rounded-full border px-3 py-1 text-xs", col === c.id ? "text-white" : "text-muted-foreground")}
            style={col === c.id ? { background: c.color, borderColor: c.color } : undefined}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border p-3">
            <div className="text-xs font-semibold">{row.label}</div>
            <p className="mt-2 text-sm leading-relaxed">{row.cells[col]}</p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border lg:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="w-28 px-3 py-3 font-medium text-muted-foreground" />
              {cols.map((c) => (
                <th key={c.id} className="px-3 py-3 font-medium" style={{ color: c.color }}>
                  <button type="button" onClick={() => setCol(c.id)} className={cn("text-left", col === c.id && "underline")}>
                    {c.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t align-top">
                <th className="px-3 py-3 text-left text-xs font-semibold">{row.label}</th>
                {cols.map((c) => (
                  <td
                    key={c.id}
                    className={cn("px-3 py-3 leading-relaxed", col === c.id ? "bg-muted/40" : "text-muted-foreground")}
                  >
                    {row.cells[c.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DiagramFrame>
  )
}
