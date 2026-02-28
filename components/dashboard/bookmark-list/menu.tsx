import { useMemo, useCallback } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import Copy from "lucide-react/dist/esm/icons/copy";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ChevronsRightIcon from "lucide-react/dist/esm/icons/chevrons-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import type { Bookmark } from "./types";
import type { ConvexGroup } from "../group-selector";
import { FALLBACK_COLORS } from "../group-selector";
import { KEYBOARD_SHORTCUTS } from "./constants";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface DesktopMenuProps {
  bookmark: Bookmark;
  groups: ConvexGroup[];
  onCopy: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (groupId: Id<"groups">) => void;
  onToggleRead: () => void;
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
  );
}

export function DesktopMenu({
  bookmark,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
  onToggleRead,
}: DesktopMenuProps) {
  const otherGroups = useMemo(
    () =>
      groups
        .filter((g) => g._id !== bookmark.groupId)
        .map((group, i): { group: ConvexGroup; fallbackColor: string } => ({
          group,
          fallbackColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        })),
    [groups, bookmark.groupId],
  );

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

      <ContextMenuItem onClick={onRename}>
        <Pencil className="size-4 mr-2" />
        Rename
        <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.rename} />
      </ContextMenuItem>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <ChevronsRightIcon className="size-4 mr-2" />
          Move to
        </ContextMenuSubTrigger>

        <ContextMenuSubContent className="w-48">
          {otherGroups.map(({ group, fallbackColor }) => (
            <ContextMenuItem key={group._id} onClick={() => onMove(group._id)}>
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

      <ContextMenuItem variant="destructive" onClick={onDelete}>
        <Trash2 className="size-4 mr-2" />
        Delete
        <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.delete} />
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

interface MobileMenuProps {
  bookmark: Bookmark;
  groups: ConvexGroup[];
  onCopy: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (groupId: Id<"groups">) => void;
  onToggleRead: () => void;
  onClose: () => void;
}

export function MobileMenu({
  bookmark,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
  onToggleRead,
  onClose,
}: MobileMenuProps) {
  const otherGroups = useMemo(
    () =>
      groups
        .filter((g) => g._id !== bookmark.groupId)
        .map((group, i): { group: ConvexGroup; fallbackColor: string } => ({
          group,
          fallbackColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        })),
    [groups, bookmark.groupId],
  );

  const handleAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose],
  );

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
        onClick={() => handleAction(onRename)}
        className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
      >
        <Pencil className="size-4 mr-2" />
        Rename
      </button>

      <div className="relative group">
        <button className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm">
          <ChevronsRightIcon className="size-4 mr-2" />
          Move to
        </button>
        <div className="absolute left-full top-0 ml-1 w-48 bg-popover border rounded-md shadow-lg py-1 hidden group-hover:block z-50">
          {otherGroups.map(({ group, fallbackColor }) => (
            <button
              key={group._id}
              onClick={() => handleAction(() => onMove(group._id))}
              className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
            >
              <span
                className="size-2.5 rounded-full mr-2"
                style={{
                  backgroundColor: group.color || fallbackColor,
                }}
              />
              {group.title}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border my-1" />

      <button
        onClick={() => handleAction(onDelete)}
        className="w-full flex items-center px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm"
      >
        <Trash2 className="size-4 mr-2" />
        Delete
      </button>
    </div>
  );
}
