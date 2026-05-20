import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactElement } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";

import { EditBookmarkModal } from "@/components/dialogs/edit-bookmark-modal";
import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { openInAppBrowser } from "@/lib/open-in-app-browser";
import { cn } from "@/lib/cn";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// TODO: Import it from apps/web
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

// Until here

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
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const deleteBookmark = useMutation(api.bookmarks.mutations.deleteBookMark);
  const toggleRead = useMutation(api.bookmarks.mutations.toggleReadStatus);
  const moveBookmark = useMutation(api.bookmarks.mutations.moveBookMark);

  if (!bookmark) return null;

  const b = bookmark;

  async function handleOpenUrl() {
    await openInAppBrowser(b.url, b.title);
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
    const moveRows: ReactElement[] = [];
    let fallbackColorIdx = 0;
    for (const group of groups) {
      if (group._id === currentGroupId) continue;
      const dotColor =
        group.color ?? GROUP_DOT_FALLBACK[fallbackColorIdx % GROUP_DOT_FALLBACK.length];
      fallbackColorIdx += 1;
      moveRows.push(
        <Pressable
          key={group._id}
          className="mx-2 my-0.5 flex-row items-center gap-3 rounded-sm px-2 py-3 active:bg-muted"
          onPress={() => handleMove(group._id)}
        >
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
          <Text className="text-sm text-foreground">{group.title}</Text>
        </Pressable>
      );
    }

    return (
      <Modal visible={visible} onClose={() => setShowMoveMenu(false)} title="Move to…">
        <ScrollView className="max-h-[250px]">{moveRows}</ScrollView>
        <Pressable
          className="mx-2 mt-3 items-center rounded-sm bg-muted py-3 active:bg-muted"
          onPress={() => setShowMoveMenu(false)}
        >
          <Text className="text-sm font-medium text-secondary-foreground">Cancel</Text>
        </Pressable>
      </Modal>
    );
  }

  return (
    <>
      <Modal visible={visible && !showEdit} onClose={onClose}>
        <View className="p-3">
          <Text
            className="mb-3 border-b border-border px-2 pb-2 text-sm font-medium text-secondary-foreground"
            numberOfLines={2}
          >
            {b.title || "Untitled"}
          </Text>

          <ActionRow icon="open-outline" label="Open in browser" onPress={handleOpenUrl} />
          <ActionRow icon="create-outline" label="Edit" onPress={() => setShowEdit(true)} />
          {!!b.description && (
            <ActionRow
              icon="information-circle-outline"
              label="Description"
              onPress={() => {
                showThemedAlert("Description", b.description ?? "");
              }}
            />
          )}
          <ActionRow icon="copy-outline" label="Copy URL" onPress={handleCopyUrl} />
          <ActionRow
            icon={b.doneReading ? "eye-off-outline" : "checkmark-circle-outline"}
            label={b.doneReading ? "Mark as unread" : "Mark as read"}
            onPress={handleToggleRead}
          />
          <ActionRow
            icon="arrow-forward-outline"
            label="Move to…"
            onPress={() => setShowMoveMenu(true)}
          />
          <ActionRow icon="trash-outline" label="Delete" onPress={handleDelete} destructive />
          {onSelectMultiple && (
            <ActionRow
              icon="layers-outline"
              label="Select multiple"
              onPress={() => {
                onSelectMultiple();
              }}
            />
          )}

          <Pressable
            className="mx-2 mt-3 items-center rounded-sm bg-muted py-3 active:bg-muted"
            onPress={onClose}
          >
            <Text className="text-sm font-medium text-secondary-foreground">Cancel</Text>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-sm px-2 py-3 active:bg-muted"
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors.error : colors.textMuted}
      />
      <Text className={cn("text-sm text-foreground", destructive && "text-destructive")}>
        {label}
      </Text>
    </Pressable>
  );
}
