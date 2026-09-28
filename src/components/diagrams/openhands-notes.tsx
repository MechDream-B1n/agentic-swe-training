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

const turns = [
  {
    name: "execute_bash",
    submit: "execute_bash\nthought: 先按文件名定位。\ncommand: find . -name separable.py",
    saved: "CmdRunAction\n  thought: 先按文件名定位。\n  command: find . -name separable.py\nCmdOutputObservation\n  exit_code: 0\n  content: ./astropy/modeling/separable.py",
    note: "这一轮只能有一个工具调用。command 是普通 bash，可以写 &&。shell 会话还在，下一条不用重新 cd。",
  },
  {
    name: "execute_ipython_cell",
    submit: "execute_ipython_cell\nthought: 在解释器里复现。\ncode: |\n  from astropy.modeling import separability_matrix\n  print(separability_matrix(model))",
    saved: "IPythonRunCellAction\n  thought: 在解释器里复现。\n  code: print(separability_matrix(model))\nIPythonRunCellObservation\n  content: [[ True False ... ]]",
    note: "code 是一段 Python。变量留在 Jupyter 里。AgentSkills 写在这段代码中调用，没有单独的工具名。",
  },
  {
    name: "str_replace_editor",
    submit: "str_replace_editor\nthought: 第 245 行把右侧写成了 1。\ncommand: str_replace\npath: astropy/modeling/separable.py\nold_str: cright[...] = 1\nnew_str: cright[...] = right",
    saved: "FileEditAction / editor event\n  command: str_replace\n  path: astropy/modeling/separable.py\nFileEditObservation\n  原文已替换。匹配失败则这条观察是错误，文件保持原样。",
    note: "command 还可以是 view、create、insert、undo_edit。view 要带 path 和 view_range。替换必须和原文逐字相同，没有 linter 回滚。",
  },
  {
    name: "结束",
    submit: "execute_bash\nthought: 修复已经验证，结束。\ncommand: exit",
    saved: "CmdRunAction\n  command: exit\n然后评测从容器取 git diff。\nAgentFinishAction 也可以结束；SWE-bench 脚本若看到模型转去问人，会要求改用 exit。",
    note: "结束动作里不写补丁。补丁是仓库里已经发生的文件变化。browser 若开着，这一轮也可以是一次网页操作，而不是 bash。",
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

export function OpenHandsTurn() {
  const [i, setI] = useState(0)
  const cur = turns[i]
  return (
    <DiagramFrame title="图 2 续 · 每一轮提交什么，轨迹里留下什么" hint="切换一种工具调用">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        一次模型调用只提交一个工具。思考写在参数外面的 thought，不单独再调用一次。事件流按类型把这次调用和随后的观察各记一条。系统说明在流的开头，是一条 SystemMessageAction，不跟命令混在同一条里。
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {turns.map((t, idx) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setI(idx)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-xs",
              i === idx ? "border-violet-600 bg-violet-600 text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold text-violet-700">这一轮模型提交的内容</div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">{cur.submit}</pre>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-violet-700">追加进事件流的记录</div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">{cur.saved}</pre>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{cur.note}</p>
    </DiagramFrame>
  )
}
