import { useCallback, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

/** Mirrors web dashboard `multiSelectMode` + `selectedBookmarkIds`. */
export function useBookmarkSelection(bookmarkIds: Id<"bookmarks">[]) {
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"bookmarks">>>(new Set());

  const enterMultiSelect = useCallback((id: Id<"bookmarks">) => {
    setMultiSelectMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: Id<"bookmarks">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /** Matches web: if every visible row is selected, clear; else select all visible. */
  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      if (bookmarkIds.length === 0) return new Set();
      const allSelected = bookmarkIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(bookmarkIds);
    });
  }, [bookmarkIds]);

  const allVisibleSelected = useMemo(
    () =>
      bookmarkIds.length > 0 && bookmarkIds.every((id) => selectedIds.has(id)),
    [bookmarkIds, selectedIds]
  );

  const isSelected = useCallback(
    (id: Id<"bookmarks">) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedCount = selectedIds.size;
  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

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
