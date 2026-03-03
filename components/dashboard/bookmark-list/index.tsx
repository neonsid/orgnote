"use client";

import { useState, useRef, useCallback } from "react";
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
  onDelete: (bookmark: Bookmark) => void;
  onMove: (bookmarkId: Id<"bookmarks">, newGroupId: Id<"groups">) => void;
  onToggleRead: (bookmarkId: Id<"bookmarks">) => void;
}

export function BookmarkList({
  bookmarks,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
  onToggleRead,
  loading,
}: BookmarkListProps) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { setHoveredBookmark } = useBookmarkShortcuts({ onRename, onDelete });

  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    longPressTimer.current = setTimeout(() => {
      e.preventDefault();
      setOpenPopoverId(id);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  if (loading && bookmarks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-px w-16 bg-muted-foreground/30 animate-pulse" />
      </div>
    );
  }

  if (!loading && bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-sm font-medium">No bookmarks found</p>
        <p className="text-xs mt-1">
          Try a different search or press Enter to add
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          groups={groups}
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
          onDelete={() => onDelete(bookmark)}
          onMove={(groupId) => onMove(bookmark.id, groupId)}
          onToggleRead={() => onToggleRead(bookmark.id)}
        />
      ))}
    </div>
  );
}

// Re-export types for backwards compatibility
export type { Bookmark } from "./types";
