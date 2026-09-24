import { cn } from "@/lib/utils"

export function DiagramFrame({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <figure
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02] sm:p-6",
        className
      )}
    >
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </figcaption>
      {children}
    </figure>
  )
}

export function StepControls({
  step,
  total,
  onChange,
  playing,
  onTogglePlay,
}: {
  step: number
  total: number
  onChange: (n: number) => void
  playing?: boolean
  onTogglePlay?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.max(0, step - 1))}
        disabled={step === 0}
      >
        上一步
      </button>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            aria-label={`第 ${i + 1} 步`}
            onClick={() => onChange(i)}
            className={cn(
              "h-1.5 w-4 rounded-full transition-colors",
              i <= step ? "bg-foreground" : "bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
      <button
        className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.min(total - 1, step + 1))}
        disabled={step === total - 1}
      >
        下一步
      </button>
      {onTogglePlay && (
        <button
          className="rounded-md bg-foreground px-2.5 py-1 text-xs text-background hover:opacity-90"
          onClick={onTogglePlay}
        >
          {playing ? "暂停" : "自动播放"}
        </button>
      )}
    </div>
  )
}
