'use client'

import { FileDown, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface BookmarksDataActionsProps {
  onImportClick: () => void
  onExportClick: () => void
}

export function BookmarksDataActions({
  onImportClick,
  onExportClick,
}: BookmarksDataActionsProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-4">
      <div>
        <Label className="text-sm font-medium">Bookmarks</Label>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Import a Chrome HTML export or download your groups as JSON or CSV.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onImportClick}
          className="gap-2"
        >
          <FileUp className="size-4" />
          Import bookmarks
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportClick}
          className="gap-2"
        >
          <FileDown className="size-4" />
          Export bookmarks
        </Button>
      </div>
    </div>
  )
}
