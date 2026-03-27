import { memo } from 'react'
import { DashboardLogo } from '../dashboard-logo'
import { UserInfo } from '../user-info'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

export const ImportHeader = memo(function ImportHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <DashboardLogo />
          <span className="text-muted-foreground select-none">/</span>
          <span className="text-sm font-medium text-foreground truncate">
            Import
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AnimatedThemeToggler
            aria-label="Toggle theme"
            className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          />
          <UserInfo variant="dashboard" />
        </div>
      </div>
    </header>
  )
})
