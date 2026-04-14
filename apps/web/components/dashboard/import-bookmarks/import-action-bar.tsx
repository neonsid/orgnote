import { memo } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { m } from 'motion/react'

interface ImportActionBarProps {
  onImportClick: () => void
  disabled: boolean
  label: string
}

export const ImportActionBar = memo(function ImportActionBar({
  onImportClick,
  disabled,
  label,
}: ImportActionBarProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="sticky bottom-0 z-30 mt-auto border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4 sm:px-6 sm:py-4 shrink-0"
    >
      <div className="mx-auto flex max-w-2xl flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5 text-muted-foreground w-full sm:w-auto'
          )}
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
        <Button
          type="button"
          onClick={onImportClick}
          disabled={disabled}
          className="w-full sm:w-auto sm:ml-auto"
        >
          {label}
        </Button>
      </div>
    </m.div>
  )
})
