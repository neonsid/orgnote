import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";

import { EditBookmarkModal } from "@/components/dialogs/edit-bookmark-modal";
import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import type { AppColors } from "@/lib/theme-colors";
import { borderRadius, spacing } from "@/lib/constants";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Bookmark {
  _id: Id<"bookmarks">;
  title: string;
  url: string;
  doneReading?: boolean;
  description?: string;
}

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

const GROUP_DOT_FALLBACK = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

interface BookmarkActionsModalProps {
  visible: boolean;
  onClose: () => void;
  bookmark: Bookmark | null;
  groups: Group[];
  currentGroupId: Id<"groups"> | null;
  /** Enters multi-select with this bookmark selected (parity with web context menu). */
  onSelectMultiple?: () => void;
}

export function BookmarkActionsModal({
  visible,
  onClose,
  bookmark,
  groups,
  currentGroupId,
  onSelectMultiple,
}: BookmarkActionsModalProps) {
  const { colors } = useAppTheme();
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const deleteBookmark = useMutation(api.bookmarks.mutations.deleteBookMark);
  const toggleRead = useMutation(api.bookmarks.mutations.toggleReadStatus);
  const moveBookmark = useMutation(api.bookmarks.mutations.moveBookMark);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!bookmark) return null;

  const b = bookmark;

  async function handleOpenUrl() {
    await Linking.openURL(b.url);
    onClose();
  }

  async function handleCopyUrl() {
    await Clipboard.setStringAsync(b.url);
    showThemedAlert("Copied", "URL copied to clipboard");
    onClose();
  }

  async function handleToggleRead() {
    try {
      await toggleRead({ bookmarkId: b._id });
      onClose();
    } catch {
      showThemedAlert("Error", "Failed to update bookmark");
    }
  }

  async function handleMove(groupId: Id<"groups">) {
    try {
      await moveBookmark({ bookmarkId: b._id, groupId });
      setShowMoveMenu(false);
      onClose();
    } catch {
      showThemedAlert("Error", "Failed to move bookmark");
    }
  }

  async function handleDelete() {
    showThemedAlert("Delete bookmark", "Are you sure you want to delete this bookmark?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBookmark({ bookmarkId: b._id });
            onClose();
          } catch {
            showThemedAlert("Error", "Failed to delete bookmark");
          }
        },
      },
    ]);
  }

  if (showMoveMenu) {
    return (
      <Modal visible={visible} onClose={() => setShowMoveMenu(false)} title="Move to…">
        <ScrollView style={styles.moveList}>
          {groups
            .filter((g) => g._id !== currentGroupId)
            .map((group, index) => (
              <Pressable
                key={group._id}
                style={styles.moveItem}
                onPress={() => handleMove(group._id)}
              >
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor:
                        group.color ??
                        GROUP_DOT_FALLBACK[index % GROUP_DOT_FALLBACK.length],
                    },
                  ]}
                />
                <Text style={styles.moveItemText}>{group.title}</Text>
              </Pressable>
            ))}
        </ScrollView>
        <Pressable style={styles.cancelButton} onPress={() => setShowMoveMenu(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Modal>
    );
  }

  return (
    <>
      <Modal visible={visible && !showEdit} onClose={onClose}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {b.title || "Untitled"}
          </Text>

          <ActionRow
            icon="open-outline"
            label="Open in browser"
            onPress={handleOpenUrl}
            colors={colors}
            styles={styles}
          />
          <ActionRow
            icon="create-outline"
            label="Edit"
            onPress={() => setShowEdit(true)}
            colors={colors}
            styles={styles}
          />
          {!!b.description && (
            <ActionRow
              icon="information-circle-outline"
              label="Description"
              onPress={() => {
                showThemedAlert("Description", b.description ?? "");
              }}
              colors={colors}
              styles={styles}
            />
          )}
          <ActionRow
            icon="copy-outline"
            label="Copy URL"
            onPress={handleCopyUrl}
            colors={colors}
            styles={styles}
          />
          <ActionRow
            icon={b.doneReading ? "eye-off-outline" : "checkmark-circle-outline"}
            label={b.doneReading ? "Mark as unread" : "Mark as read"}
            onPress={handleToggleRead}
            colors={colors}
            styles={styles}
          />
          <ActionRow
            icon="arrow-forward-outline"
            label="Move to…"
            onPress={() => setShowMoveMenu(true)}
            colors={colors}
            styles={styles}
          />
          <ActionRow
            icon="trash-outline"
            label="Delete"
            onPress={handleDelete}
            destructive
            colors={colors}
            styles={styles}
          />
          {onSelectMultiple && (
            <ActionRow
              icon="layers-outline"
              label="Select multiple"
              onPress={() => {
                onSelectMultiple();
              }}
              colors={colors}
              styles={styles}
            />
          )}

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <EditBookmarkModal
        visible={visible && showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={() => {
          setShowEdit(false);
          onClose();
        }}
        bookmark={b}
      />
    </>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive = false,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  colors: AppColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionItem,
        pressed && { backgroundColor: colors.muted },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors.error : colors.textMuted}
      />
      <Text style={[styles.actionText, destructive && styles.actionTextDestructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
    },
    title: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      gap: spacing.md,
      borderRadius: borderRadius.sm,
    },
    actionText: {
      fontSize: 14,
      color: colors.text,
    },
    actionTextDestructive: {
      color: colors.error,
    },
    cancelButton: {
      marginTop: spacing.md,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: borderRadius.sm,
      marginHorizontal: spacing.sm,
    },
    cancelText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
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
    moveItemText: {
      fontSize: 14,
      color: colors.text,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });
}
