import { useState } from "react";
import { useMutation } from "convex/react";

import {
  GroupMoveList,
  MultiSelectActionChip,
  MultiSelectToolbarLayout,
} from "@/components/multi-select";
import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { promptOpenExternalUrl } from "@/lib/open-external-url";
import { downloadAndShareFile } from "@/lib/download-file-native";
import {
  filterIdsToExtraDuplicatesOnly,
  type VaultFileRow,
} from "@/lib/vault-duplicates";
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
  const { colors } = useAppTheme();
  const [showMoveModal, setShowMoveModal] = useState(false);
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
            await deleteVaultFilesBulk({ fileIds: deletableIds });
            onClearSelection();
          } catch {
            showThemedAlert("Error", "Failed to delete files");
          }
        },
      },
    ]);
  }

  async function handleBulkMove(targetGroupId: Id<"vaultGroups">) {
    try {
      await moveVaultFilesBulk({ fileIds: selectedIds, groupId: targetGroupId });
      setShowMoveModal(false);
      onClearSelection();
    } catch {
      showThemedAlert("Error", "Failed to move files");
    }
  }

  return (
    <>
      <MultiSelectToolbarLayout
        selectedCount={selectedCount}
        countLabel={
          isDuplicatesMode ? `${selectedCount} cop${selectedCount === 1 ? "y" : "ies"} selected` : undefined
        }
        onClearSelection={onClearSelection}
      >
        <MultiSelectActionChip
          icon={allVisibleSelected ? "checkbox" : "checkbox-outline"}
          label={allVisibleSelected ? "Clear all" : "Select all"}
          onPress={onToggleSelectAllVisible}
          iconColor={colors.textSecondary}
        />
        {singleFile ? (
          <>
            <MultiSelectActionChip
              icon="open-outline"
              label="Open"
              onPress={() => void promptOpenExternalUrl(singleFile.url, singleFile.name)}
              iconColor={colors.textSecondary}
            />
            <MultiSelectActionChip
              icon="share-outline"
              label={downloading ? "…" : "Share"}
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
              iconColor={colors.textSecondary}
            />
          </>
        ) : null}
        {hasMoveTargets ? (
          <MultiSelectActionChip
            icon="folder-outline"
            label="Move"
            onPress={() => setShowMoveModal(true)}
            iconColor={colors.textSecondary}
          />
        ) : null}
        <MultiSelectActionChip
          icon="trash-outline"
          label={isDuplicatesMode ? "Remove" : "Delete"}
          onPress={handleBulkDelete}
          iconColor={colors.error}
          destructive
          disabled={selectedCount === 0}
        />
      </MultiSelectToolbarLayout>

      <Modal visible={showMoveModal} onClose={() => setShowMoveModal(false)} title="Move to…">
        <GroupMoveList
          groups={moveTargetGroups}
          onSelectGroup={(groupId) =>
            void handleBulkMove(groupId as Id<"vaultGroups">)
          }
        />
      </Modal>
    </>
  );
}
