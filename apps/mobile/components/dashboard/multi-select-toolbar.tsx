import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

import type { BookmarkData } from "@/components/dashboard/bookmark-card";
import {
  GroupMoveList,
  MultiSelectActionChip,
  MultiSelectToolbarLayout,
} from "@/components/multi-select";
import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import {
  generateCSVExport,
  generateJSONExport,
  toExportedBookmark,
} from "@/lib/bookmark-export";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

interface MultiSelectToolbarProps {
  selectedCount: number;
  selectedIds: Id<"bookmarks">[];
  selectedBookmarks: BookmarkData[];
  groupTitle: string;
  groups: Group[];
  currentGroupId: Id<"groups"> | null;
  allVisibleSelected: boolean;
  onClearSelection: () => void;
  onToggleSelectAllVisible: () => void;
  onEditSingle?: () => void;
}

export function MultiSelectToolbar({
  selectedCount,
  selectedIds,
  selectedBookmarks,
  groupTitle,
  groups,
  currentGroupId,
  allVisibleSelected,
  onClearSelection,
  onToggleSelectAllVisible,
  onEditSingle,
}: MultiSelectToolbarProps) {
  const { colors } = useAppTheme();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const deleteBookmarksBulk = useMutation(api.bookmarks.mutations.deleteBookmarksBulk);
  const moveBookmarksBulk = useMutation(api.bookmarks.mutations.moveBookmarksBulk);

  function handleBulkDelete() {
    showThemedAlert(
      "Delete bookmarks",
      `Delete ${selectedCount} bookmark${selectedCount > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBookmarksBulk({ bookmarkIds: selectedIds });
              onClearSelection();
            } catch {
              showThemedAlert("Error", "Failed to delete bookmarks");
            }
          },
        },
      ]
    );
  }

  async function handleBulkMove(targetGroupId: Id<"groups">) {
    try {
      await moveBookmarksBulk({ bookmarkIds: selectedIds, groupId: targetGroupId });
      setShowMoveModal(false);
      onClearSelection();
    } catch {
      showThemedAlert("Error", "Failed to move bookmarks");
    }
  }

  async function handleCopyUrls() {
    try {
      const text = selectedBookmarks.map((b) => b.url).join("\n");
      await Clipboard.setStringAsync(text);
      showThemedAlert(
        "Copied",
        `${selectedCount} URL${selectedCount > 1 ? "s" : ""} copied to the clipboard.`
      );
    } catch {
      showThemedAlert("Error", "Could not copy to clipboard");
    }
  }

  async function shareExport(format: "csv" | "json") {
    const exported = selectedBookmarks.map((b) =>
      toExportedBookmark({
        title: b.title,
        url: b.url,
        groupName: groupTitle,
        createdAtIso: new Date(b._creationTime ?? Date.now()).toISOString(),
      })
    );
    const body =
      format === "csv" ? generateCSVExport(exported) : generateJSONExport(exported);
    const ext = format === "csv" ? "csv" : "json";
    try {
      await Share.share({
        title: `OrgNote bookmarks.${ext}`,
        message: body,
      });
    } catch {
      showThemedAlert("Error", "Could not open share sheet");
    } finally {
      setShowExportModal(false);
    }
  }

  return (
    <>
      <MultiSelectToolbarLayout
        selectedCount={selectedCount}
        onClearSelection={onClearSelection}
      >
        {onEditSingle && selectedCount === 1 ? (
          <MultiSelectActionChip
            icon="create-outline"
            label="Edit"
            onPress={onEditSingle}
            iconColor={colors.textSecondary}
          />
        ) : null}
        <MultiSelectActionChip
          icon={allVisibleSelected ? "checkbox" : "checkbox-outline"}
          label={allVisibleSelected ? "Clear all" : "Select all"}
          onPress={onToggleSelectAllVisible}
          iconColor={colors.textSecondary}
        />
        <MultiSelectActionChip
          icon="folder-outline"
          label="Move"
          onPress={() => setShowMoveModal(true)}
          iconColor={colors.textSecondary}
        />
        <MultiSelectActionChip
          icon="copy-outline"
          label="Copy URLs"
          onPress={() => void handleCopyUrls()}
          iconColor={colors.textSecondary}
        />
        <MultiSelectActionChip
          icon="share-outline"
          label="Export"
          onPress={() => setShowExportModal(true)}
          iconColor={colors.textSecondary}
        />
        <MultiSelectActionChip
          icon="trash-outline"
          label="Delete"
          onPress={handleBulkDelete}
          iconColor={colors.error}
          destructive
        />
      </MultiSelectToolbarLayout>

      <Modal visible={showMoveModal} onClose={() => setShowMoveModal(false)} title="Move to…">
        <GroupMoveList
          groups={groups}
          excludeGroupId={currentGroupId}
          onSelectGroup={(groupId) => void handleBulkMove(groupId as Id<"groups">)}
        />
      </Modal>

      <Modal visible={showExportModal} onClose={() => setShowExportModal(false)} title="Export">
        <View className="gap-2 p-3">
          <Text className="mb-2 text-[13px] leading-[18px] text-muted-foreground">
            Share {selectedCount} bookmark{selectedCount > 1 ? "s" : ""} as CSV or JSON (same
            format as the web app).
          </Text>
          <Pressable
            className="flex-row items-center gap-3 rounded-sm p-3 active:bg-muted"
            onPress={() => void shareExport("csv")}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
            <Text className="text-[15px] text-foreground">Export as CSV</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center gap-3 rounded-sm p-3 active:bg-muted"
            onPress={() => void shareExport("json")}
          >
            <Ionicons name="code-slash-outline" size={22} color={colors.textSecondary} />
            <Text className="text-[15px] text-foreground">Export as JSON</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
