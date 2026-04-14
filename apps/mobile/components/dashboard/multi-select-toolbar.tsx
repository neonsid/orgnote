import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";

import type { BookmarkData } from "@/components/dashboard/bookmark-card";
import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import {
  generateCSVExport,
  generateJSONExport,
  toExportedBookmark,
} from "@/lib/bookmark-export";
import { borderRadius, spacing } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

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
  /** When exactly one row is selected, opens edit (parity with web). */
  onEditSingle?: () => void;
}

function ActionChip({
  icon,
  label,
  onPress,
  iconColor,
  destructive,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor: string;
  destructive?: boolean;
  styles: ReturnType<typeof makeToolbarStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        destructive && styles.chipDestructive,
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text
        style={[styles.chipLabel, destructive && styles.chipLabelDestructive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
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

  const styles = useMemo(() => makeToolbarStyles(colors), [colors]);

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
      <View style={styles.toolbar}>
        <View style={styles.topRow}>
          <Pressable
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && styles.chipPressed,
            ]}
            onPress={onClearSelection}
            hitSlop={8}
            accessibilityLabel="Exit selection mode"
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.countText} numberOfLines={1}>
            {selectedCount} selected
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {onEditSingle && selectedCount === 1 ? (
            <ActionChip
              icon="create-outline"
              label="Edit"
              onPress={onEditSingle}
              iconColor={colors.textSecondary}
              styles={styles}
            />
          ) : null}
          <ActionChip
            icon={allVisibleSelected ? "checkbox" : "checkbox-outline"}
            label={allVisibleSelected ? "Clear all" : "Select all"}
            onPress={onToggleSelectAllVisible}
            iconColor={colors.textSecondary}
            styles={styles}
          />
          <ActionChip
            icon="folder-outline"
            label="Move"
            onPress={() => setShowMoveModal(true)}
            iconColor={colors.textSecondary}
            styles={styles}
          />
          <ActionChip
            icon="copy-outline"
            label="Copy URLs"
            onPress={() => void handleCopyUrls()}
            iconColor={colors.textSecondary}
            styles={styles}
          />
          <ActionChip
            icon="share-outline"
            label="Export"
            onPress={() => setShowExportModal(true)}
            iconColor={colors.textSecondary}
            styles={styles}
          />
          <ActionChip
            icon="trash-outline"
            label="Delete"
            onPress={handleBulkDelete}
            iconColor={colors.error}
            destructive
            styles={styles}
          />
        </ScrollView>
      </View>

      <Modal visible={showMoveModal} onClose={() => setShowMoveModal(false)} title="Move to…">
        <ScrollView style={styles.moveList}>
          {groups
            .filter((g) => g._id !== currentGroupId)
            .map((group, index) => (
              <Pressable
                key={group._id}
                style={({ pressed }) => [styles.moveItem, pressed && styles.moveItemPressed]}
                onPress={() => void handleBulkMove(group._id)}
              >
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor:
                        group.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                    },
                  ]}
                />
                <Text style={styles.moveItemText}>{group.title}</Text>
              </Pressable>
            ))}
        </ScrollView>
      </Modal>

      <Modal visible={showExportModal} onClose={() => setShowExportModal(false)} title="Export">
        <View style={styles.exportBody}>
          <Text style={styles.exportHint}>
            Share {selectedCount} bookmark{selectedCount > 1 ? "s" : ""} as CSV or JSON (same
            format as the web app).
          </Text>
          <Pressable
            style={({ pressed }) => [styles.exportRow, pressed && styles.moveItemPressed]}
            onPress={() => void shareExport("csv")}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.exportRowText}>Export as CSV</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.exportRow, pressed && styles.moveItemPressed]}
            onPress={() => void shareExport("json")}
          >
            <Ionicons name="code-slash-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.exportRowText}>Export as JSON</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function makeToolbarStyles(colors: AppColors) {
  return StyleSheet.create({
    toolbar: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: spacing.sm,
      paddingBottom: 2,
    },
    chip: {
      minWidth: 72,
      maxWidth: 100,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    chipDestructive: {
      borderColor: `${colors.error}44`,
      backgroundColor: `${colors.error}12`,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
      textAlign: "center",
    },
    chipLabelDestructive: {
      color: colors.error,
    },
    moveList: {
      maxHeight: 250,
    },
    moveItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      borderRadius: borderRadius.sm,
      marginHorizontal: spacing.sm,
      marginVertical: 2,
    },
    moveItemPressed: {
      backgroundColor: colors.muted,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    moveItemText: {
      fontSize: 14,
      color: colors.text,
    },
    exportBody: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    exportHint: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    exportRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.sm,
    },
    exportRowText: {
      fontSize: 15,
      color: colors.text,
    },
  });
}
