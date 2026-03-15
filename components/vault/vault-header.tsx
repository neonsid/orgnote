'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { UserInfo } from '@/components/dashboard/user-info'
import { useDialogStore } from '@/stores/dialog-store'
import dynamic from 'next/dynamic'
import { ConvexGroup, GroupSelector } from '../dashboard/group-selector'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const CreateVaultGroupDialog = dynamic(
  () =>
    import('./dialog/create-vault-group-dialog').then(
      (m) => m.CreateVaultGroupDialog
    ),
  { ssr: false }
)

interface VaultHeaderProps {
  groups: ConvexGroup[]
  selectedGroupId: string
  onSelectGroup: (groupId: string | null) => void
  onCreated: (groupId: string) => void
  isLoading?: boolean
}

const Logo = memo(function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
    >
      <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center p-1">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          className="size-5"
        />
      </div>
    </Link>
  )
})

export const VaultHeader = memo(function VaultHeader({
  groups,
  selectedGroupId,
  onSelectGroup,
  isLoading,
}: VaultHeaderProps) {
  const createVaultGroup = useMutation(api.vault.createVaultGroup)
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Logo />
          <span className="text-muted-foreground select-none">/</span>
          <GroupSelector
            createNewGroup={createVaultGroup}
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={onSelectGroup}
            loading={isLoading}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AnimatedThemeToggler
            aria-label="Toggle theme"
            className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          />
          <UserInfo variant="vault" />
        </div>
      </div>
    </header>
  )
})
