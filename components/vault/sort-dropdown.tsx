'use client'

import { useState, memo } from 'react'
import { ArrowDownAZ, ArrowDownNarrowWide, Clock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type VaultSortType = 'latest' | 'size' | 'name'

const SORT_OPTIONS: {
  value: VaultSortType
  label: string
  icon: typeof Clock
}[] = [
  { value: 'latest', label: 'Latest', icon: Clock },
  { value: 'size', label: 'Size', icon: ArrowDownNarrowWide },
  { value: 'name', label: 'Name', icon: ArrowDownAZ },
]

interface SortDropdownProps {
  value: VaultSortType
  onChange: (value: VaultSortType) => void
}

export const SortDropdown = memo(function SortDropdown({
  value,
  onChange,
}: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const selectedOption = SORT_OPTIONS.find((o) => o.value === value)
  const Icon = selectedOption?.icon ?? Clock

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2',
            open && 'bg-accent'
          )}
        >
          <Icon className="size-4" />
          <span className="sm:inline">{selectedOption?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {SORT_OPTIONS.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <OptionIcon className="size-4" />
              {option.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
