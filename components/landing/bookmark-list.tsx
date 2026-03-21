"use client";

import { useState, memo, useRef, useMemo } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
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
import { Copy, Pencil, Trash2, ChevronsRight } from "lucide-react";
import { formatDate } from "@/components/dashboard/bookmark-list/constants";
import { useIsSmallMobile } from "@/hooks/use-mobile";

export interface LandingBookmark {
  id: string;
  title: string;
  domain: string;
  url: string;
  favicon: string | null;
  fallbackColor: string;
  createdAt: string;
  groupId: string;
}

export interface LandingGroup {
  id: string;
  name: string;
  color: string;
}

interface LandingBookmarkListProps {
  bookmarks: LandingBookmark[];
  groups: LandingGroup[];
  onCopy: (bookmark: LandingBookmark) => void;
  onRename: (bookmark: LandingBookmark) => void;
  onDelete: (bookmark: LandingBookmark) => void;
  onMove: (bookmarkId: string, newGroupId: string) => void;
}

const KEYBOARD_SHORTCUTS = {
  open: ["⌘", "Enter"],
  copy: ["⌘", "C"],
  rename: ["⌘", "E"],
  delete: ["⌘", "⌫"],
};

const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

// ============================================================================
// Memoized Favicon Icon - only re-renders when bookmark data changes
// ============================================================================

interface FaviconIconProps {
  favicon: string | null;
  fallbackColor: string;
  title: string;
}

const FaviconIcon = memo(function FaviconIcon({
  favicon,
  fallbackColor,
  title,
}: FaviconIconProps) {
  const [imgError, setImgError] = useState(false);

  if (favicon && !imgError) {
    return (
      <div className="relative size-7 rounded-lg overflow-hidden shrink-0 border border-border bg-background">
        <Image
          src={favicon}
          alt=""
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="relative size-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: fallbackColor }}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  );
});

// ============================================================================
// Keyboard Shortcut Component
// ============================================================================

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

// ============================================================================
// Memoized Menu Content - only re-renders when props change
// ============================================================================

interface MenuContentProps {
  bookmarkId: string;
  bookmarkGroupId: string;
  moveTargetGroups: Array<{ group: LandingGroup; fallbackColor: string }>;
  onCopy: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (groupId: string) => void;
}

const MenuContent = memo(function MenuContent({
  moveTargetGroups,
  onCopy,
  onRename,
  onDelete,
  onMove,
}: MenuContentProps) {
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
          <ChevronsRight className="size-4 mr-2" />
          Move to
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          {moveTargetGroups.length > 0 ? (
            moveTargetGroups.map(({ group, fallbackColor }) => (
              <ContextMenuItem key={group.id} onClick={() => onMove(group.id)}>
                <span
                  className="size-2.5 rounded-full mr-2"
                  style={{
                    backgroundColor: group.color || fallbackColor,
                  }}
                />
                {group.name}
              </ContextMenuItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No other groups
            </div>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuItem variant="destructive" onClick={onDelete}>
        <Trash2 className="size-4 mr-2" />
        Delete
        <KeyboardShortcut keys={KEYBOARD_SHORTCUTS.delete} />
      </ContextMenuItem>
    </ContextMenuContent>
  );
});

// ============================================================================
// Memoized Desktop Row - only re-renders when this bookmark's data changes
// ============================================================================

interface DesktopRowProps {
  bookmark: LandingBookmark;
  moveTargetGroups: Array<{ group: LandingGroup; fallbackColor: string }>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onCopy: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (groupId: string) => void;
}

const DesktopRow = memo(function DesktopRow({
  bookmark,
  moveTargetGroups,
  onMouseEnter,
  onMouseLeave,
  onCopy,
  onRename,
  onDelete,
  onMove,
}: DesktopRowProps) {
  return (
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
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
          >
            <FaviconIcon
              favicon={bookmark.favicon}
              fallbackColor={bookmark.fallbackColor}
              title={bookmark.title}
            />

            <div className="flex-1 min-w-0 flex items-baseline gap-2">
              <span className="font-medium text-sm truncate group-hover:text-primary transition-colors text-foreground">
                {bookmark.title}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {bookmark.domain}
              </span>
            </div>

            <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-[72px] text-right group-hover:hidden">
              {formatDate(bookmark.createdAt)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-[72px] text-right hidden group-hover:flex items-center justify-end gap-1">
              {KEYBOARD_SHORTCUTS.open.map((key: string, index: number) => (
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
          bookmarkId={bookmark.id}
          bookmarkGroupId={bookmark.groupId}
          moveTargetGroups={moveTargetGroups}
          onCopy={onCopy}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      </ContextMenu>
    </motion.div>
  );
});

// ============================================================================
// Memoized Mobile Row - simplified for mobile
// ============================================================================

interface MobileRowProps {
  bookmark: LandingBookmark;
}

const MobileRow = memo(function MobileRow({ bookmark }: MobileRowProps) {
  return (
    <motion.div
      key={bookmark.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
      >
        <FaviconIcon
          favicon={bookmark.favicon}
          fallbackColor={bookmark.fallbackColor}
          title={bookmark.title}
        />

        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors text-foreground">
            {bookmark.title}
          </span>
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            {bookmark.domain}
          </span>
        </div>

        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatDate(bookmark.createdAt)}
        </span>
      </a>
    </motion.div>
  );
});

// ============================================================================
// Empty State Component
// ============================================================================

const EmptyState = memo(function EmptyState() {
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
});

// ============================================================================
// Main Bookmark List - optimized with stable callbacks and memoized rows
// ============================================================================

export const LandingBookmarkList = memo(function LandingBookmarkList({
  bookmarks,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
}: LandingBookmarkListProps) {
  const isSmallMobile = useIsSmallMobile();
  const hoveredBookmarkRef = useRef<LandingBookmark | null>(null);
  const onRenameRef = useRef(onRename);
  // eslint-disable-next-line react-hooks/refs -- latest onRename for stable keydown listener
  onRenameRef.current = onRename;

  useMountEffect(() => {
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
          onRenameRef.current(hoveredBookmarkRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Precompute move targets once per group list
  const moveTargetGroupsMap = useMemo(() => {
    const map = new Map<string, Array<{ group: LandingGroup; fallbackColor: string }>>();
    for (const bookmark of bookmarks) {
      if (!map.has(bookmark.groupId)) {
        map.set(
          bookmark.groupId,
          groups
            .filter((g) => g.id !== bookmark.groupId)
            .map((group, i) => ({
              group,
              fallbackColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            })),
        );
      }
    }
    return map;
  }, [groups, bookmarks]);

  if (bookmarks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full pb-4 px-1">
      <AnimatePresence mode="popLayout" initial={false}>
        {bookmarks.map((bookmark) =>
          isSmallMobile ? (
            <MobileRow key={bookmark.id} bookmark={bookmark} />
          ) : (
            <DesktopRow
              key={bookmark.id}
              bookmark={bookmark}
              moveTargetGroups={moveTargetGroupsMap.get(bookmark.groupId) || []}
              onMouseEnter={() => (hoveredBookmarkRef.current = bookmark)}
              onMouseLeave={() => (hoveredBookmarkRef.current = null)}
              onCopy={() => onCopy(bookmark)}
              onRename={() => onRename(bookmark)}
              onDelete={() => onDelete(bookmark)}
              onMove={(groupId) => onMove(bookmark.id, groupId)}
            />
          ),
        )}
      </AnimatePresence>
    </div>
  );
});
