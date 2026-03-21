import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import {
  Copy,
  Edit3,
  Trash2,
  ChevronsRight,
  CheckCircle2,
  Circle,
  Info,
} from 'lucide-react'
import type { Bookmark } from './types'
import type { ConvexGroup } from '../group-selector'
import { FALLBACK_COLORS } from '../group-selector'
import { KEYBOARD_SHORTCUTS } from './constants'
import type { Id } from '@/convex/_generated/dataModel'

interface DesktopMenuProps {
  bookmark: Bookmark
  groups: ConvexGroup[]
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  onMove: (groupId: Id<'groups'>) => void
  onToggleRead: () => void
  onShowDescription?: () => void
}

function KeyboardShortcut({ keys }: { keys: readonly string[] }) {
  return (
    <ContextMenuShortcut className="flex items-center gap-1">
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-muted border border-border text-xs font-medium text-muted-foreground select-none"
        >
          {key}
        </kbd>
      ))}
    </ContextMenuShortcut>
  )
}

export function DesktopMenu({
  bookmark,
  groups,
  onCopy,
  onEdit,
  onDelete,
  onMove,
  onToggleRead,
  onShowDescription,
}: DesktopMenuProps) {
  const otherGroups = useMemo(
    () =>
      groups
        .filter((g) => g._id !== bookmark.groupId)
        .map((group, i): { group: ConvexGroup; fallbackColor: string } => ({
          group,
          fallbackColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        })),
    [groups, bookmark.groupId]
  )

  return (
    <ContextMenuContent className="w-56">
      <ContextMenuItem onClick={onToggleRead}>
        {bookmark.doneReading ? (
          <>
            <Circle className="size-4 mr-2" />
            Mark as Unread
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 mr-2" />
            Mark as Read
          </>
        )}
      </ContextMenuItem>

      <ContextMenuItem onClick={onCopy}>
        <Copy className="size-4 mr-2" />
        Copy
        <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.copy} />
      </ContextMenuItem>

      <ContextMenuItem onClick={onEdit}>
        <Edit3 className="size-4 mr-2" />
        Edit...
        <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.edit} />
      </ContextMenuItem>

      {bookmark.description && onShowDescription && (
        <ContextMenuItem onClick={onShowDescription}>
          <Info className="size-4 mr-2" />
          Description
          <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.description} />
        </ContextMenuItem>
      )}

      {otherGroups.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <ChevronsRight className="size-4 mr-2" />
            Move to
          </ContextMenuSubTrigger>

          <ContextMenuSubContent className="w-48">
            {otherGroups.map(({ group, fallbackColor }) => (
              <ContextMenuItem
                key={group._id}
                onClick={() => onMove(group._id as Id<'groups'>)}
              >
                <span
                  className="size-2.5 rounded-full mr-2"
                  style={{
                    backgroundColor: group.color || fallbackColor,
                  }}
                />
                {group.title}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}

      <ContextMenuItem variant="destructive" onClick={onDelete}>
        <Trash2 className="size-4 mr-2" />
        Delete
        <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.delete} />
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

interface MobileMenuProps {
  bookmark: Bookmark
  groups: ConvexGroup[]
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  onMove: (groupId: Id<'groups'>) => void
  onToggleRead: () => void
  onShowDescription?: () => void
  onClose: () => void
  /** When false, collapses "Move to" so reopening the menu starts fresh. */
  isOpen: boolean
}

export function MobileMenu({
  bookmark,
  groups,
  onCopy,
  onEdit,
  onDelete,
  onMove,
  onToggleRead,
  onShowDescription,
  onClose,
  isOpen,
}: MobileMenuProps) {
  const [moveTargetsOpen, setMoveTargetsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) setMoveTargetsOpen(false)
  }, [isOpen])

  const otherGroups = useMemo(
    () =>
      groups
        .filter((g) => g._id !== bookmark.groupId)
        .map((group, i): { group: ConvexGroup; fallbackColor: string } => ({
          group,
          fallbackColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        })),
    [groups, bookmark.groupId]
  )

  const handleAction = useCallback(
    (action: () => void) => {
      action()
      onClose()
    },
    [onClose]
  )

  const handleMoveToGroup = useCallback(
    (groupId: Id<'groups'>) => {
      onMove(groupId)
      setMoveTargetsOpen(false)
      onClose()
    },
    [onMove, onClose]
  )

  return (
    <div className="w-56 py-1">
      <button
        onClick={() => handleAction(onToggleRead)}
        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
      >
        {bookmark.doneReading ? (
          <>
            <Circle className="size-4 mr-2" />
            Mark as Unread
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 mr-2" />
            Mark as Read
          </>
        )}
      </button>

      <div className="h-px bg-border my-1" />

      <button
        onClick={() => handleAction(onCopy)}
        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
      >
        <Copy className="size-4 mr-2" />
        Copy
      </button>

      <button
        onClick={() => handleAction(onEdit)}
        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
      >
        <Edit3 className="size-4 mr-2" />
        Edit...
      </button>

      {bookmark.description && onShowDescription && (
        <button
          onClick={() => handleAction(onShowDescription)}
          className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
        >
          <Info className="size-4 mr-2" />
          Description
        </button>
      )}

      {otherGroups.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setMoveTargetsOpen((open) => !open)}
            className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
          >
            <ChevronsRight
              className={`size-4 mr-2 shrink-0 transition-transform ${moveTargetsOpen ? 'rotate-90' : ''}`}
            />
            Move to
          </button>
          {moveTargetsOpen && (
            <div className="mt-1 ml-2 pl-2 border-l border-border space-y-0.5">
              {otherGroups.map(({ group, fallbackColor }) => (
                <button
                  key={group._id}
                  type="button"
                  onClick={() =>
                    handleMoveToGroup(group._id as Id<'groups'>)
                  }
                  className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm text-left"
                >
                  <span
                    className="size-2.5 rounded-full mr-2 shrink-0"
                    style={{
                      backgroundColor: group.color || fallbackColor,
                    }}
                  />
                  <span className="min-w-0 truncate">{group.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-px bg-border my-1" />

      <button
        onClick={() => handleAction(onDelete)}
        className="w-full flex items-center px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm"
      >
        <Trash2 className="size-4 mr-2" />
        Delete
      </button>
    </div>
  )
}
