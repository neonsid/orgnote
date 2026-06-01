import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

/** Mirrors web dashboard `multiSelectMode` + `selectedBookmarkIds`. */
export function useBookmarkSelection(bookmarkIds: Id<"bookmarks">[]) {
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"bookmarks">>>(new Set());

  function enterMultiSelect(id: Id<"bookmarks">) {
    setMultiSelectMode(true);
    setSelectedIds(new Set([id]));
  }

  function exitMultiSelect() {
    setMultiSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelection(id: Id<"bookmarks">) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /** Matches web: if every visible row is selected, clear; else select all visible. */
  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      if (bookmarkIds.length === 0) return new Set();
      const allSelected = bookmarkIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(bookmarkIds);
    });
  }

  const allVisibleSelected =
    bookmarkIds.length > 0 && bookmarkIds.every((id) => selectedIds.has(id));

  function isSelected(id: Id<"bookmarks">) {
    return selectedIds.has(id);
  }

  const selectedCount = selectedIds.size;
  const selectedIdsArray = Array.from(selectedIds);

  return {
    selectedIds: selectedIdsArray,
    selectedCount,
    multiSelectMode,
    isSelected,
    toggleSelection,
    toggleSelectAllVisible,
    allVisibleSelected,
    enterMultiSelect,
    exitMultiSelect,
  };
}
