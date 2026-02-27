"use client";

import { useState, memo, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
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
import Copy from "lucide-react/dist/esm/icons/copy";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ChevronsRightIcon from "lucide-react/dist/esm/icons/chevrons-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import Check from "lucide-react/dist/esm/icons/check";
import { ConvexGroup, FALLBACK_COLORS } from "./group-selector";
import { Id } from "@/convex/_generated/dataModel";
import { useIsSmallMobile } from "@/hooks/use-mobile";

export interface Bookmark {
  id: Id<"bookmarks">;
  title: string;
  domain: string;
  url: string;
  favicon: string | null;
  fallbackColor: string;
  createdAt: string;
  groupId: string;
  doneReading: boolean;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  groups: ConvexGroup[];
  loading: boolean;
  onCopy: (bookmark: Bookmark) => void;
  onRename: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onMove: (bookmarkId: Id<"bookmarks">, newGroupId: Id<"groups">) => void;
  onToggleRead: (bookmarkId: Id<"bookmarks">) => void;
}

/* =========================
   Keyboard Config
========================= */

const KEYBOARD_SHORTCUTS = {
  open: ["⊞", "Enter"],
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
      <div className="relative size-7 rounded-lg overflow-hidden shrink-0 border border-border bg-background">
        <Image
          src={bookmark.favicon}
          alt=""
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
        {bookmark.doneReading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Check className="size-4 text-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative size-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: bookmark.fallbackColor }}
    >
      {bookmark.title.charAt(0).toUpperCase()}
      {bookmark.doneReading && (
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
          <Check className="size-4 text-white" />
        </div>
      )}
    </div>
  );
}

/* =========================
   Menu Content Component
========================= */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

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
  onToggleRead: () => void;
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
  onToggleRead,
  onClose,
}: MenuContentProps) {
  const handleAction = useCallback(
    (action: () => void) => {
      action();
      onClose?.();
    },
    [onClose],
  );

  // Pre-filter groups for this bookmark to avoid O(n) filter on every render
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

  const handleToggleRead = useCallback(
    () => handleAction(onToggleRead),
    [handleAction, onToggleRead],
  );
  const handleCopy = useCallback(
    () => handleAction(onCopy),
    [handleAction, onCopy],
  );
  const handleRename = useCallback(
    () => handleAction(onRename),
    [handleAction, onRename],
  );
  const handleDelete = useCallback(
    () => handleAction(onDelete),
    [handleAction, onDelete],
  );
  const handleMove = useCallback(
    (groupId: Id<"groups">) => handleAction(() => onMove(groupId)),
    [handleAction, onMove],
  );

  if (isMobile) {
    return (
      <div className="w-56 py-1">
        <button
          onClick={handleToggleRead}
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
          onClick={handleCopy}
          className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
        >
          <Copy className="size-4 mr-2" />
          Copy
        </button>

        <button
          onClick={handleRename}
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
                onClick={() => handleMove(group._id)}
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
          onClick={handleDelete}
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
  onToggleRead,
  loading,
}: BookmarkListProps) {
  const isSmallMobile = useIsSmallMobile();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hoveredBookmarkRef = useRef<Bookmark | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (hoveredBookmarkRef.current) {
          window.open(
            hoveredBookmarkRef.current.url,
            "_blank",
            "noopener,noreferrer",
          );
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        if (hoveredBookmarkRef.current) {
          onRename(hoveredBookmarkRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRename]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center py-12 text-muted-foreground"
      >
        <Shimmer duration={2}>Loading Bookmarks...</Shimmer>
      </motion.div>
    );
  }

  if (!loading && bookmarks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <p className="text-sm font-medium">No bookmarks found</p>
        <p className="text-xs mt-1">
          Try a different search or press Enter to add
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {bookmarks.map((bookmark) =>
          isSmallMobile ? (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <Popover
                open={openPopoverId === bookmark.id}
                onOpenChange={(open) =>
                  setOpenPopoverId(open ? bookmark.id : null)
                }
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
                    onMouseEnter={() => (hoveredBookmarkRef.current = bookmark)}
                    onMouseLeave={() => (hoveredBookmarkRef.current = null)}
                    className="flex items-center gap-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
                  >
                    <FaviconIcon bookmark={bookmark} />

                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span
                        className={`font-medium text-sm truncate group-hover:text-primary transition-colors ${
                          bookmark.doneReading
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {bookmark.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                        {bookmark.domain}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 group-hover:hidden">
                      {formatDate(bookmark.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden group-hover:flex items-center gap-1">
                      {KEYBOARD_SHORTCUTS.open.map((key, index) => (
                        <kbd
                          key={index}
                          className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded bg-muted border border-border text-[10px] font-medium"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </a>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  sideOffset={4}
                >
                  <MenuContent
                    bookmark={bookmark}
                    groups={groups}
                    isMobile={true}
                    onCopy={() => onCopy(bookmark)}
                    onRename={() => onRename(bookmark)}
                    onDelete={() => onDelete(bookmark)}
                    onMove={(groupId: Id<"groups">) =>
                      onMove(bookmark.id, groupId)
                    }
                    onToggleRead={() => onToggleRead(bookmark.id)}
                    onClose={() => setOpenPopoverId(null)}
                  />
                </PopoverContent>
              </Popover>
            </motion.div>
          ) : (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => (hoveredBookmarkRef.current = bookmark)}
                    onMouseLeave={() => (hoveredBookmarkRef.current = null)}
                    className="flex items-center gap-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
                  >
                    <FaviconIcon bookmark={bookmark} />

                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span
                        className={`font-medium text-sm truncate group-hover:text-primary transition-colors ${
                          bookmark.doneReading
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {bookmark.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {bookmark.domain}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 group-hover:hidden">
                      {formatDate(bookmark.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden group-hover:flex items-center gap-1">
                      {KEYBOARD_SHORTCUTS.open.map((key, index) => (
                        <kbd
                          key={index}
                          className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded bg-muted border border-border text-[10px] font-medium"
                        >
                          {key}
                        </kbd>
                      ))}
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
                  onMove={(groupId: Id<"groups">) =>
                    onMove(bookmark.id, groupId)
                  }
                  onToggleRead={() => onToggleRead(bookmark.id)}
                />
              </ContextMenu>
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  );
});
