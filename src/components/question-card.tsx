"use client"

import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuestionCard({ q, a, color }: { q: string; a: string; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border p-4" style={{ background: `${color}08`, borderColor: `${color}40` }}>
      <div className="flex gap-2">
        <HelpCircle className="mt-0.5 size-4 shrink-0" style={{ color }} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold" style={{ color }}>
            思考题
          </div>
          <p className="mt-1 text-sm font-medium leading-relaxed">{q}</p>
          {open ? (
            <p className="animate-in fade-in mt-3 border-t pt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
              先想一想，再看参考答案
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
