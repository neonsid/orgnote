'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Shortcut {
  label: string
  keys: string[]
}

const shortcuts: Shortcut[] = [
  { label: 'Focus search', keys: ['Ctrl', 'F'] },
  { label: 'Navigate bookmarks', keys: ['↑', '/', '↓'] },
  { label: 'Open / copy bookmark', keys: ['Enter'] },
  { label: 'Copy', keys: ['Ctrl', 'C'] },
  { label: 'Rename', keys: ['Ctrl', 'E'] },
  { label: 'Delete', keys: ['Ctrl', '⌫'] },
  { label: 'Exit selection', keys: ['Esc'] },
  { label: 'Select all', keys: ['Ctrl', 'A'] },
  { label: 'Toggle select', keys: ['Space'] },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="space-y-0">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.label}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-sm text-foreground">
                  {shortcut.label}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      {key === '/' ? (
                        <span className="text-xs text-muted-foreground mx-0.5">
                          /
                        </span>
                      ) : (
                        <kbd className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none">
                          {key}
                        </kbd>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
          <Button
            id="keyboard-shortcuts-close"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="ml-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
