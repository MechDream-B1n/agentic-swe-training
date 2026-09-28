"use client"

import { useState } from "react"
import { DiagramFrame } from "@/components/diagram-frame"
import { cn } from "@/lib/utils"

const tools = [
  ["execute_bash", "CmdRunAction", "任意 bash。shell 会话保持，下一条命令还能用当前目录。长命令可以放到后台。", "评测和 SWE-Gym 都开着"],
  ["execute_ipython_cell", "IPythonRunCellAction", "在 Jupyter 里跑一段 Python。变量留在解释器里。已导入的 AgentSkills 要在这段代码里调用，它们没有单独的工具名。", "论文里的核心动作。SWE-Gym 2.1 主要靠 bash 和编辑器"],
  ["str_replace_editor", "文件查看 / 编辑事件", "view、create、str_replace、insert、undo_edit。查看带行号；替换必须和原文逐字匹配，匹配失败就报错。", "论文早期还没有。SWE-Gym 的 CodeActAgent 2.1 使用它"],
  ["browser", "BrowseInteractiveAction", "打开网页、点击、输入。和 bash、Python 是并列的一类动作。", "通用版本可选。SWE-Gym 关掉"],
  ["finish", "AgentFinishAction", "宣布结束。SWE-bench 评测里如果模型转去问人，会要求它改用 execute_bash exit，再从容器取出 git diff。", "评测用 exit 收尾"],
]

const log = [
  { id: "1", role: "保留", text: "User Message · 修复 separable.py 的可分性矩阵", inView: true },
  { id: "2", role: "退出提示", text: "CmdRunAction · find . -name separable.py", inView: false },
  { id: "3", role: "退出提示", text: "CmdOutputObservation · ./astropy/modeling/separable.py", inView: false },
  { id: "4", role: "退出提示", text: "str_replace_editor view · 第 230–260 行", inView: false },
  { id: "5", role: "退出提示", text: "Observation · 带行号的代码窗口", inView: false },
  { id: "6", role: "摘要", text: "Condensation · 已定位 separable.py:245，右侧矩阵被写成了 1", inView: true },
  { id: "7", role: "保留", text: "str_replace_editor · 把 = 1 换成 = right", inView: true },
  { id: "8", role: "保留", text: "Observation · 替换已写入文件", inView: true },
]

const harnesses = [
  {
    name: "SWE-agent",
    color: "#0ea5e9",
    turn: "一次补全里先写 Thought，再写恰好一条 ACI 命令。",
    record: "轨迹按轮保存：Thought、Action、Observation。",
    context: "最近约 5 条观察留全文，更早的收成一行。文件查看器记住当前文件和约 100 行窗口。",
    edit: "命令表是 find_file、search_dir、open、goto、scroll、edit、submit。edit 后跑 linter，语法错误回滚。",
  },
  {
    name: "OpenHands CodeActAgent",
    color: "#8b5cf6",
    turn: "一次工具调用。回复正文记在这条 Action 的 thought 里。",
    record: "轨迹是事件流：每条有类型，Action 和 Observation 交替追加。",
    context: "账本全留。Condenser 另做一份视图，忘掉的事件编号也写回事件流。",
    edit: "execute_bash、execute_ipython_cell、str_replace_editor，browser 可选。编辑器要求原文精确匹配，不自动做语法回滚。",
  },
  {
    name: "mini-swe-agent",
    color: "#71717a",
    turn: "助手消息里写思考，唯一动作是一个 bash 代码块。",
    record: "轨迹就是对话消息。没有单独的 Action 类型。",
    context: "每条命令是一次新的子进程，没有跨命令的 shell，也没有文件查看器状态。",
    edit: "只有 bash。没有 linter 护栏，也没有专用编辑器。脚手架薄，方便拿来做微调。",
  },
  {
    name: "Agentless",
    color: "#f59e0b",
    turn: "没有「自己决定下一步」。流程写死为定位文件，再生成补丁，再用测试重排。",
    record: "保存的是定位结果和补丁候选，不是 Action / Observation 事件流。",
    context: "每一步的提示由流水线拼出来，模型看不到自己上一轮的工具观察。",
    edit: "模型交 SEARCH/REPLACE 或补丁文本。执行和筛选在流水线里，不在一个 agent 循环里。",
  },
]

export function OpenHandsTools() {
  return (
    <DiagramFrame title="图 2 续 · CodeActAgent 的工具" hint="工具名是模型调用的接口，事件类型写在账本里">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        CodeActAgent 用函数调用选工具。论文 v1.8 报 26% 时，核心是 bash 和 IPython，外加可选的浏览器。文件编辑器是后来加进同一套事件流的。更晚的 think、condensation_request、task_tracker 不在那次评测里。
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">工具</th>
              <th className="px-4 py-3 font-medium">事件类型</th>
              <th className="px-4 py-3 font-medium">这一轮可以做什么</th>
              <th className="px-4 py-3 font-medium">什么时候用</th>
            </tr>
          </thead>
          <tbody>
            {tools.map(([name, event, does, when]) => (
              <tr key={name} className="border-t align-top">
                <th className="px-4 py-3 text-left font-mono text-xs font-semibold">{name}</th>
                <td className="px-4 py-3 font-mono text-xs text-violet-800">{event}</td>
                <td className="px-4 py-3 text-muted-foreground">{does}</td>
                <td className="px-4 py-3">{when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DiagramFrame>
  )
}

export function OpenHandsContext() {
  const [view, setView] = useState<"log" | "prompt">("log")
  const shown = log.filter((e) => view === "log" || e.inView)
  return (
    <DiagramFrame title="图 2 续 · 事件流、上下文、沙箱是三份东西" hint="切换完整账本和本轮提示">
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["log", "完整事件流"],
            ["prompt", "本轮上下文"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              view === id ? "border-violet-600 bg-violet-600 text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <ol className="flex flex-col gap-1.5">
          {shown.map((e) => (
            <li
              key={e.id}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border px-3 py-2 text-sm",
                e.role === "摘要" && "border-violet-300 bg-violet-50",
                view === "log" && !e.inView && "bg-muted/40 text-muted-foreground"
              )}
            >
              <span className="font-mono text-[11px] text-muted-foreground">{e.id}</span>
              <span>
                <span className="mr-2 text-[11px] font-semibold text-violet-700">{e.role}</span>
                {e.text}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold">{view === "log" ? "事件流" : "上下文"}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {view === "log"
                ? "事件流的定义：按时间只追加的记录。用户消息、每次工具调用、每条观察、以及后来的压缩，都是其中一条。轨迹文件保存的是这一份。"
                : "上下文是 Condenser 交到下一轮提示里的视图。开头的任务和最近的动作留下，中间四条退出提示，由一条摘要代替。压缩这件事自己也追加进事件流。"}
            </p>
          </div>
          <div className="rounded-xl border border-dashed p-4">
            <div className="text-sm font-semibold">沙箱里还活着</div>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
              <li>工作目录仍是仓库根，下一条 bash 不用重新 cd。</li>
              <li>IPython 里已经导入的名字还在。</li>
              <li>这两样不写进提示，Condenser 也不会把它们清掉。</li>
            </ul>
          </div>
        </div>
      </div>
    </DiagramFrame>
  )
}

export function OpenHandsVs() {
  const [active, setActive] = useState(1)
  const cur = harnesses[active]
  return (
    <DiagramFrame title="图 2 续 · 和另外三种做法怎么区分" hint="点一个名字看它的一轮和它的轨迹">
      <div className="mb-4 flex flex-wrap gap-2">
        {harnesses.map((h, i) => (
          <button
            key={h.name}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              active === i ? "text-white" : "text-muted-foreground hover:bg-muted"
            )}
            style={active === i ? { background: h.color, borderColor: h.color } : undefined}
          >
            {h.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ["一轮里模型交什么", cur.turn],
            ["轨迹文件里有什么", cur.record],
            ["上下文和隐藏状态", cur.context],
            ["改文件的方式", cur.edit],
          ] as const
        ).map(([title, body]) => (
          <div key={title} className="rounded-xl border p-4">
            <div className="text-xs font-semibold" style={{ color: cur.color }}>
              {title}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </DiagramFrame>
  )
}
