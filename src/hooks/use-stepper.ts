"use client"

import { useEffect, useState } from "react"

export function useStepper(total: number, intervalMs = 1800) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= total - 1) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, intervalMs)
    return () => clearInterval(t)
  }, [playing, total, intervalMs])

  return {
    step,
    setStep: (n: number) => {
      setPlaying(false)
      setStep(n)
    },
    playing,
    togglePlay: () => {
      if (!playing && step >= total - 1) setStep(0)
      setPlaying((p) => !p)
    },
  }
}
