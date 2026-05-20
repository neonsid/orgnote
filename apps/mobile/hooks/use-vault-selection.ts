import { useCallback, useMemo, useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";

export function useVaultSelection(fileIds: Id<"vaultFiles">[]) {
  const [selectedIds, setSelectedIds] = useState<Set<Id<"vaultFiles">>>(new Set());

  const isSelecting = selectedIds.size > 0;

  const toggleSelection = useCallback((id: Id<"vaultFiles">) => {
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

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      if (fileIds.length === 0) return new Set();
      const allSelected = fileIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(fileIds);
    });
  }, [fileIds]);

  const allVisibleSelected = useMemo(
    () => fileIds.length > 0 && fileIds.every((id) => selectedIds.has(id)),
    [fileIds, selectedIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: Id<"vaultFiles">) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedCount = selectedIds.size;

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds: selectedIdsArray,
    selectedCount,
    isSelecting,
    isSelected,
    toggleSelection,
    toggleSelectAllVisible,
    allVisibleSelected,
    clearSelection,
  };
}
