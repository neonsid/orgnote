"use client";

import { useState, memo, useRef } from "react";
import Image from "next/image";
import { Shimmer } from "@/components/ai-elements/shimmer";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Copy, Pencil, Trash2, ChevronsRightIcon } from "lucide-react";
import { ConvexGroup, FALLBACK_COLORS } from "./group-selector";
import { Id } from "@/convex/_generated/dataModel";
import { useIsSmallMobile } from "@/hooks/use-mobile";

interface Bookmark {
  id: Id<"bookmarks">;
  title: string;
  domain: string;
  url: string;
  favicon: string | null;
  fallbackColor: string;
  createdAt: string;
  groupId: string;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  groups: ConvexGroup[];
  loading: boolean;
  onCopy: (bookmark: Bookmark) => void;
  onRename: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onMove: (bookmarkId: Id<"bookmarks">, newGroupId: Id<"groups">) => void;
}

/* =========================
   Keyboard Config
========================= */

const KEYBOARD_SHORTCUTS = {
  copy: ["⌘", "C"],
  rename: ["⌘", "E"],
  delete: ["⌘", "⌫"],
};

function KeyboardShortcut({ keys }: { keys: string[] }) {
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FaviconIcon({ bookmark }: { bookmark: Bookmark }) {
  const [imgError, setImgError] = useState(false);

  if (bookmark.favicon && !imgError) {
    return (
      <div className="size-7 rounded-lg overflow-hidden shrink-0 border border-border bg-background flex items-center justify-center">
        <Image
          src={bookmark.favicon}
          alt=""
          width={20}
          height={20}
          className="size-5 rounded-sm"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="size-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: bookmark.fallbackColor }}
    >
      {bookmark.title.charAt(0).toUpperCase()}
    </div>
  );
}

/* =========================
   Menu Content Component
========================= */

interface MenuContentProps {
  bookmark: Bookmark;
  groups: ConvexGroup[];
  isMobile: boolean;
  onCopy: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (groupId: Id<"groups">) => void;
  onClose?: () => void;
}

function MenuContent({
  bookmark,
  groups,
  isMobile,
  onCopy,
  onRename,
  onDelete,
  onMove,
  onClose,
}: MenuContentProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose?.();
  };

  if (isMobile) {
    return (
      <div className="w-56 py-1">
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
            {groups
              .filter((g) => g._id !== bookmark.groupId)
              .map((group, i) => (
                <button
                  key={group._id}
                  onClick={() => handleAction(() => onMove(group._id))}
                  className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                >
                  <span
                    className="size-2.5 rounded-full mr-2"
                    style={{
                      backgroundColor:
                        group.color ||
                        FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    }}
                  />
                  {group.title}
                </button>
              ))}
          </div>
        </div>

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

  return (
    <ContextMenuContent className="w-56">
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
          {groups
            .filter((g) => g._id !== bookmark.groupId)
            .map((group, i) => (
              <ContextMenuItem
                key={group._id}
                onClick={() => onMove(group._id)}
              >
                <span
                  className="size-2.5 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      group.color ||
                      FALLBACK_COLORS[i % FALLBACK_COLORS.length],
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

/* =========================
   Component
========================= */

export const BookmarkList = memo(function BookmarkList({
  bookmarks,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
  loading,
}: BookmarkListProps) {
  const isSmallMobile = useIsSmallMobile();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!isSmallMobile) return;

    longPressTimer.current = setTimeout(() => {
      e.preventDefault();
      setOpenPopoverId(id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  if (loading && bookmarks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Shimmer duration={2}>Loading Bookmarks...</Shimmer>
      </div>
    );
  }

  if (!loading && bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm font-medium">No bookmarks found</p>
        <p className="text-xs mt-1">
          Try a different search or press Enter to add
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-2 mb-8">
      {bookmarks.map((bookmark) =>
        isSmallMobile ? (
          <Popover
            key={bookmark.id}
            open={openPopoverId === bookmark.id}
            onOpenChange={(open) => setOpenPopoverId(open ? bookmark.id : null)}
          >
            <PopoverTrigger asChild>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onTouchStart={(e) => handleTouchStart(e, bookmark.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                onClick={(e) => {
                  if (openPopoverId === bookmark.id) {
                    e.preventDefault();
                  }
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <FaviconIcon bookmark={bookmark} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {bookmark.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {bookmark.domain}
                  </p>
                </div>

                <span className="text-xs text-muted-foreground">
                  {formatDate(bookmark.createdAt)}
                </span>
              </a>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
              <MenuContent
                bookmark={bookmark}
                groups={groups}
                isMobile={true}
                onCopy={() => onCopy(bookmark)}
                onRename={() => onRename(bookmark)}
                onDelete={() => onDelete(bookmark)}
                onMove={(groupId) => onMove(bookmark.id, groupId)}
                onClose={() => setOpenPopoverId(null)}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <ContextMenu key={bookmark.id}>
            <ContextMenuTrigger asChild>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <FaviconIcon bookmark={bookmark} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {bookmark.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {bookmark.domain}
                  </p>
                </div>

                <span className="text-xs text-muted-foreground">
                  {formatDate(bookmark.createdAt)}
                </span>
              </a>
            </ContextMenuTrigger>
            <MenuContent
              bookmark={bookmark}
              groups={groups}
              isMobile={false}
              onCopy={() => onCopy(bookmark)}
              onRename={() => onRename(bookmark)}
              onDelete={() => onDelete(bookmark)}
              onMove={(groupId) => onMove(bookmark.id, groupId)}
            />
          </ContextMenu>
        ),
      )}
    </div>
  );
});
