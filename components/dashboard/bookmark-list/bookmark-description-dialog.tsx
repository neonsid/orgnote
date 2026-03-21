import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FaviconIcon } from './favicon-icon'
import type { Bookmark } from './types'

interface BookmarkDescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Bookmark
}

export function BookmarkDescriptionDialog({
  open,
  onOpenChange,
  bookmark,
}: BookmarkDescriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-12 text-left">
          <DialogTitle className="flex items-start gap-3 font-semibold leading-snug">
            <FaviconIcon bookmark={bookmark} />
            <span className="min-w-0 flex-1 break-words line-clamp-3">
              {bookmark.title}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bookmark.description}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
