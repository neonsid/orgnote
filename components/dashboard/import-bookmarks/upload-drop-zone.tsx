import { memo } from 'react'
import { CloudUpload } from 'lucide-react'

interface UploadDropZoneProps {
  onClickBrowse: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
}

export const UploadDropZone = memo(function UploadDropZone({
  onClickBrowse,
  onDrop,
  onDragOver,
}: UploadDropZoneProps) {
  return (
    <button
      type="button"
      onClick={onClickBrowse}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="group flex w-full max-w-md flex-col items-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 px-6 py-12 sm:py-16 transition-colors hover:border-muted-foreground/40 hover:bg-muted/10 cursor-pointer"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-muted">
        <CloudUpload className="size-7 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <div className="space-y-1.5 text-center">
        <p className="text-sm font-medium text-foreground">
          Drop your bookmarks file here
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse &middot; accepts <code className="rounded bg-muted px-1 py-0.5 text-[11px]">.html</code> exports from Chrome, Firefox, Safari
        </p>
      </div>
    </button>
  )
})
