'use client'

import { useDeleteProgressStore } from '@/stores/delete-progress-store'

export function DeleteProgressToastContent() {
  const { progress, fileName } = useDeleteProgressStore()

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <p className="text-sm font-medium">
        Deleting{' '}
        {fileName && fileName.length > 24
          ? `${fileName.slice(0, 24)}...`
          : fileName || 'file'}
      </p>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
    </div>
  )
}

export function animateDeleteProgress(onComplete: () => void): {
  stopAnimation: () => void
  cancel: () => void
} {
  const duration = 1000
  const interval = 40
  const steps = duration / interval
  let step = 0
  const store = useDeleteProgressStore.getState()

  const timer = setInterval(() => {
    step++
    const progress = Math.min(90, (step / steps) * 90)
    store.setProgress(progress)
  }, interval)

  return {
    stopAnimation: () => {
      clearInterval(timer)
      store.complete()
      onComplete()
    },
    cancel: () => {
      clearInterval(timer)
      store.reset()
    },
  }
}
