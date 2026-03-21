import { FaviconIcon } from './favicon-icon'
import { formatDate, KEYBOARD_SHORTCUTS } from './constants'
import type { Bookmark } from './types'

interface BookmarkRowMainProps {
  bookmark: Bookmark
}

export function BookmarkRowMain({ bookmark }: BookmarkRowMainProps) {
  const hasDescription = !!bookmark.description

  return (
    <>
      <FaviconIcon bookmark={bookmark} />

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium text-sm truncate group-hover:text-primary transition-colors ${
              bookmark.doneReading ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {bookmark.title}
          </span>
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            {bookmark.domain}
          </span>
        </div>

        {hasDescription && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {bookmark.description}
          </p>
        )}
      </div>

      <span className="text-xs text-muted-foreground tabular-nums shrink-0 group-hover:hidden self-start mt-1">
        {formatDate(bookmark.createdAt)}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden group-hover:flex items-center gap-1 self-start mt-1">
        {KEYBOARD_SHORTCUTS.open.map((key, index) => (
          <kbd
            key={index}
            className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded bg-muted border border-border text-[10px] font-medium"
          >
            {key}
          </kbd>
        ))}
      </span>
    </>
  )
}
