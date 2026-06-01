import { useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";

export function useVaultSelection(fileIds: Id<"vaultFiles">[]) {
  const [selectedIds, setSelectedIds] = useState<Set<Id<"vaultFiles">>>(new Set());

  const isSelecting = selectedIds.size > 0;

  function toggleSelection(id: Id<"vaultFiles">) {
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

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      if (fileIds.length === 0) return new Set();
      const allSelected = fileIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(fileIds);
    });
  }

  const allVisibleSelected =
    fileIds.length > 0 && fileIds.every((id) => selectedIds.has(id));

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function isSelected(id: Id<"vaultFiles">) {
    return selectedIds.has(id);
  }

  const selectedCount = selectedIds.size;

  const selectedIdsArray = Array.from(selectedIds);

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
