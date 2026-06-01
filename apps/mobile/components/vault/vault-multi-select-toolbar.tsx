import { useState } from "react";
import { InteractionManager, View } from "react-native";
import { useMutation } from "convex/react";

import { MultiSelectToolbarLayout } from "@/components/multi-select";
import {
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuSubItem,
  MenuSubTrigger,
} from "@/components/ui/menu-item";
import { showThemedAlert } from "@/lib/show-themed-alert";
import { promptOpenExternalUrl } from "@/lib/open-external-url";
import { downloadAndShareFile } from "@/lib/download-file-native";
import { deleteVaultFilesInBatches, getErrorMessage } from "@/lib/vault-bulk-delete";
import {
  filterIdsToExtraDuplicatesOnly,
  type VaultFileRow,
} from "@/lib/vault-duplicates";
import { FALLBACK_COLORS } from "@goldfish/shared";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface VaultGroup {
  _id: Id<"vaultGroups">;
  title: string;
  color?: string;
}

export type VaultSelectionFile = {
  _id: Id<"vaultFiles">;
  name: string;
  url: string;
  type: string;
};

interface VaultMultiSelectToolbarProps {
  selectedCount: number;
  selectedIds: Id<"vaultFiles">[];
  selectedFiles: VaultSelectionFile[];
  groups: VaultGroup[];
  allVaultFiles: VaultFileRow[];
  currentGroupId: Id<"vaultGroups"> | null;
  isDuplicatesMode: boolean;
  allVisibleSelected: boolean;
  onClearSelection: () => void;
  onToggleSelectAllVisible: () => void;
}

export function VaultMultiSelectToolbar({
  selectedCount,
  selectedIds,
  selectedFiles,
  groups,
  allVaultFiles,
  currentGroupId,
  isDuplicatesMode,
  allVisibleSelected,
  onClearSelection,
  onToggleSelectAllVisible,
}: VaultMultiSelectToolbarProps) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const deleteVaultFilesBulk = useMutation(api.vault.mutations.deleteVaultFilesBulk);
  const moveVaultFilesBulk = useMutation(api.vault.mutations.moveVaultFilesBulk);

  const singleFile = selectedCount === 1 ? selectedFiles[0] : null;
  const moveTargetGroups = groups.filter((g) => g._id !== currentGroupId);
  const hasMoveTargets = moveTargetGroups.length > 0;

  function idsForDelete(): Id<"vaultFiles">[] {
    if (!isDuplicatesMode) return selectedIds;
    return filterIdsToExtraDuplicatesOnly(selectedIds, allVaultFiles);
  }

  function handleBulkDelete() {
    const deletableIds = idsForDelete();
    if (deletableIds.length === 0) {
      showThemedAlert(
        "Cannot delete",
        "Original files are always kept. Select duplicate copies to remove."
      );
      return;
    }

    const skipped = selectedIds.length - deletableIds.length;
    const message = isDuplicatesMode
      ? `Remove ${deletableIds.length} extra cop${deletableIds.length === 1 ? "y" : "ies"}? Originals stay in your collections.${skipped > 0 ? ` (${skipped} original${skipped > 1 ? "s" : ""} skipped)` : ""}`
      : `Delete ${deletableIds.length} file${deletableIds.length > 1 ? "s" : ""}?`;

    showThemedAlert(isDuplicatesMode ? "Remove copies" : "Delete files", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: isDuplicatesMode ? "Remove" : "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVaultFilesInBatches(deleteVaultFilesBulk, deletableIds);
            onClearSelection();
          } catch (err) {
            InteractionManager.runAfterInteractions(() => {
              showThemedAlert("Error", getErrorMessage(err, "Failed to delete files"));
            });
          }
        },
      },
    ]);
  }

  async function handleBulkMove(targetGroupId: Id<"vaultGroups">) {
    try {
      await moveVaultFilesBulk({ fileIds: selectedIds, groupId: targetGroupId });
      setMoveOpen(false);
      onClearSelection();
    } catch {
      showThemedAlert("Error", "Failed to move files");
    }
  }

  return (
    <MultiSelectToolbarLayout
      selectedCount={selectedCount}
      countLabel={
        isDuplicatesMode ? `${selectedCount} cop${selectedCount === 1 ? "y" : "ies"} selected` : undefined
      }
      onClearSelection={onClearSelection}
      fixedBottom
    >
      <MenuGroup>
        <MenuItem
          icon={allVisibleSelected ? "checkbox" : "checkbox-outline"}
          label={allVisibleSelected ? "Clear all" : "Select all"}
          onPress={onToggleSelectAllVisible}
        />
        {singleFile ? (
          <>
            <MenuItem
              icon="open-outline"
              label="Open"
              onPress={() => void promptOpenExternalUrl(singleFile.url, singleFile.name)}
            />
            <MenuItem
              icon="download-outline"
              label={downloading ? "Downloading…" : "Download"}
              onPress={() => {
                setDownloading(true);
                void downloadAndShareFile(singleFile.url, singleFile.name, singleFile.type)
                  .catch((e) =>
                    showThemedAlert(
                      "Download failed",
                      e instanceof Error ? e.message : "Could not download file."
                    )
                  )
                  .finally(() => setDownloading(false));
              }}
              disabled={downloading}
            />
          </>
        ) : null}
        {hasMoveTargets ? (
          <>
            <MenuSubTrigger
              icon="chevron-forward-outline"
              label="Move to"
              expanded={moveOpen}
              onPress={() => setMoveOpen((open) => !open)}
            />
            {moveOpen ? (
              <View className="ml-3 border-l border-border pl-1">
                {moveTargetGroups.map((group, i) => (
                  <MenuSubItem
                    key={group._id}
                    label={group.title}
                    dotColor={group.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                    onPress={() => void handleBulkMove(group._id)}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        <MenuSeparator />
        <MenuItem
          icon="trash-outline"
          label={isDuplicatesMode ? "Remove copies" : "Delete"}
          onPress={handleBulkDelete}
          destructive
          disabled={selectedCount === 0}
        />
      </MenuGroup>
    </MultiSelectToolbarLayout>
  );
}
