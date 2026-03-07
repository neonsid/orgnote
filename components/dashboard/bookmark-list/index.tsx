"use client";

import { useReducer, useRef, useCallback, useEffect, memo } from "react";
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
  type ListState = {
    openPopoverId: string | null;
    showDescriptionId: string | null;
    selectedIndex: number;
  };

  type ListAction =
    | { type: "setOpenPopover"; id: string | null }
    | { type: "showDescription"; id: string }
    | { type: "clearDescription" }
    | { type: "selectNext" }
    | { type: "selectPrevious" }
    | { type: "clearSelection" };

  function reducer(state: ListState, action: ListAction): ListState {
    switch (action.type) {
      case "setOpenPopover":
        return { ...state, openPopoverId: action.id };
      case "showDescription":
        return { ...state, showDescriptionId: action.id };
      case "clearDescription":
        return { ...state, showDescriptionId: null };
      case "selectNext":
        return {
          ...state,
          selectedIndex: Math.min(
            state.selectedIndex + 1,
            bookmarks.length - 1,
          ),
        };
      case "selectPrevious":
        return {
          ...state,
          selectedIndex: Math.max(state.selectedIndex - 1, 0),
        };
      case "clearSelection":
        return { ...state, selectedIndex: -1 };
      default:
        return state;
    }
  }

  const isSmallMobile = useIsSmallMobile();
  const [state, dispatch] = useReducer(reducer, {
    openPopoverId: null,
    showDescriptionId: null,
    selectedIndex: -1,
  });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { setHoveredBookmark } = useBookmarkShortcuts({
    onRename,
    onEdit,
    onCopy,
    onDelete,
    onShowDescription: useCallback((bookmark: Bookmark) => {
      if (bookmark.description) {
        dispatch({ type: "showDescription", id: bookmark.id });
        setTimeout(() => dispatch({ type: "clearDescription" }), 3000);
      }
    }, []),
  });

  const longPressTriggered = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!isSmallMobile) return;
      longPressTriggered.current = false;

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        dispatch({ type: "setOpenPopover", id });
      }, 500);
    },
    [isSmallMobile],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isSmallMobile) {
        e.preventDefault();
      }
    },
    [isSmallMobile],
  );

  // Auto-close mobile popover after 4 seconds
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    if (state.openPopoverId && isSmallMobile) {
      autoCloseTimer.current = setTimeout(() => {
        dispatch({ type: "setOpenPopover", id: null });
      }, 4000);
    }
    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
    };
  }, [state.openPopoverId, isSmallMobile]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!bookmarks.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        dispatch({ type: "selectNext" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        dispatch({ type: "selectPrevious" });
      } else if (e.key === "Escape") {
        e.preventDefault();
        dispatch({ type: "clearSelection" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bookmarks.length]);

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
        {bookmarks.map((bookmark, index) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            groups={groups}
            isMobile={isSmallMobile}
            isSelected={state.selectedIndex === index}
            isPopoverOpen={state.openPopoverId === bookmark.id}
            onPopoverOpenChange={(open) =>
              dispatch({
                type: "setOpenPopover",
                id: open ? bookmark.id : null,
              })
            }
            onTouchStart={(e) => handleTouchStart(e, bookmark.id)}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
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
                dispatch({ type: "showDescription", id: bookmark.id });
                setTimeout(() => dispatch({ type: "clearDescription" }), 3000);
              }
            }}
            showDescription={state.showDescriptionId === bookmark.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// Re-export types for backwards compatibility
export type { Bookmark } from "./types";
