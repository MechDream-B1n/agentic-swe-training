import { SiteNav } from "@/components/site-nav"
import { LineageMap } from "@/components/lineage-map"
import { ParadigmMap } from "@/components/paradigm-map"
import { ScoreChart } from "@/components/score-chart"
import { StageSection, Callout } from "@/components/stage-section"
import { Summary } from "@/components/summary"
import { AciDiagram } from "@/components/diagrams/aci-diagram"
import { CodeActDiagram } from "@/components/diagrams/codeact-diagram"
import { SweGymDiagram } from "@/components/diagrams/swegym-diagram"
import { SweGymCompare, SweGymMethod } from "@/components/diagrams/swegym-notes"
import { SweGymInference } from "@/components/diagrams/swegym-inference"
import { SynthDiagram } from "@/components/diagrams/synth-diagram"
import { SweRlDiagram } from "@/components/diagrams/swerl-diagram"
import { DeepSweDiagram } from "@/components/diagrams/deepswe-diagram"
import { SelfPlayDiagram } from "@/components/diagrams/selfplay-diagram"
import { stageById } from "@/lib/stages"

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="py-12 sm:py-16">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">学习路线 · 软件工程 Agent</p>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            从“会用工具”到“自己出题自己练”：
            <span className="bg-gradient-to-r from-sky-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent">Agentic 训练范式</span>
            的七步演进
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            这条路线以 SWE-bench 式任务（给一个真实仓库和一个问题，让模型提交补丁）为主线，回答三个问题：agent 怎样和环境交互？训练任务从哪里来？学习信号是什么？每一章都配有可以动手操作的图示。
          </p>
          <div className="mt-8">
            <LineageMap />
          </div>
          <div className="mt-6">
            <ParadigmMap />
          </div>
          <div className="mt-6">
            <Callout>
              <b>阅读建议：</b>先看上面的范式地图，建立“横轴是学习信号、纵轴是任务来源”的直觉；然后逐章阅读，每章末尾的“局限”就是下一章的出发点；最后在总结部分用对比表把七步串起来。
            </Callout>
          </div>
        </section>

        <StageSection stage={stageById["swe-agent"]}>
          <AciDiagram />
        </StageSection>
        <StageSection stage={stageById["codeact"]}>
          <CodeActDiagram />
        </StageSection>
        <StageSection stage={stageById["swe-gym"]}>
          <div className="flex flex-col gap-6">
            <SweGymCompare />
            <SweGymMethod />
            <SweGymDiagram />
            <SweGymInference />
          </div>
        </StageSection>
        <StageSection stage={stageById["synth"]}>
          <SynthDiagram />
        </StageSection>
        <StageSection stage={stageById["swe-rl"]}>
          <SweRlDiagram />
        </StageSection>
        <StageSection stage={stageById["deepswe"]}>
          <DeepSweDiagram />
        </StageSection>
        <StageSection stage={stageById["ssr"]}>
          <SelfPlayDiagram />
        </StageSection>

        <Summary />
        <div className="pb-16">
          <ScoreChart />
        </div>
      </main>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        数据来自各论文与官方博客的公开数字。不同工作的基座模型、脚手架和采样预算不同，比较时请注意口径。
      </footer>
    </>
  )
}
