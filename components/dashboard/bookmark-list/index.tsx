"use client";

import { useState, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useIsSmallMobile } from "@/hooks/use-mobile";
import { BookmarkItem } from "./bookmark-item";
import { useBookmarkShortcuts } from "./use-bookmark-shortcuts";
import type { Bookmark } from "./types";
import type { ConvexGroup } from "../group-selector";
import type { Id } from "@/convex/_generated/dataModel";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  groups: ConvexGroup[];
  loading: boolean;
  onCopy: (bookmark: Bookmark) => void;
  onRename: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onMove: (bookmarkId: Id<"bookmarks">, newGroupId: Id<"groups">) => void;
  onToggleRead: (bookmarkId: Id<"bookmarks">) => void;
}

export const BookmarkList = memo(function BookmarkList({
  bookmarks,
  groups,
  onCopy,
  onRename,
  onEdit,
  onDelete,
  onMove,
  onToggleRead,
  loading,
}: BookmarkListProps) {
  const isSmallMobile = useIsSmallMobile();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [showDescriptionId, setShowDescriptionId] = useState<string | null>(
    null,
  );
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { setHoveredBookmark } = useBookmarkShortcuts({
    onRename,
    onDelete,
    onShowDescription: useCallback(
      (bookmark: Bookmark) => {
        if (bookmark.description) {
          setShowDescriptionId(bookmark.id);
          // Auto-hide after 3 seconds
          setTimeout(() => setShowDescriptionId(null), 3000);
        }
      },
      [setShowDescriptionId],
    ),
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!isSmallMobile) return;

      longPressTimer.current = setTimeout(() => {
        e.preventDefault();
        setOpenPopoverId(id);
      }, 500);
    },
    [isSmallMobile],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  if (loading && bookmarks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full space-y-1"
      >
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="size-5 rounded bg-muted" />
            <div className="flex-1 flex items-center gap-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted hidden sm:block" />
            </div>
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
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
      <AnimatePresence mode="popLayout">
        {bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            groups={groups}
            isMobile={isSmallMobile}
            isPopoverOpen={openPopoverId === bookmark.id}
            onPopoverOpenChange={(open) =>
              setOpenPopoverId(open ? bookmark.id : null)
            }
            onTouchStart={(e) => handleTouchStart(e, bookmark.id)}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setHoveredBookmark(bookmark)}
            onMouseLeave={() => setHoveredBookmark(null)}
            onCopy={() => onCopy(bookmark)}
            onRename={() => onRename(bookmark)}
            onEdit={() => onEdit(bookmark)}
            onDelete={() => onDelete(bookmark)}
            onMove={(groupId) => onMove(bookmark.id, groupId)}
            onToggleRead={() => onToggleRead(bookmark.id)}
            onShowDescription={() => {
              if (bookmark.description) {
                setShowDescriptionId(bookmark.id);
                setTimeout(() => setShowDescriptionId(null), 3000);
              }
            }}
            showDescription={showDescriptionId === bookmark.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// Re-export types for backwards compatibility
export type { Bookmark } from "./types";
