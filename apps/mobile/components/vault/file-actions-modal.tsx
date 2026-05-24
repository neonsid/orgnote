import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { downloadAndShareFile } from "@/lib/download-file-native";
import { promptOpenExternalUrl } from "@/lib/open-external-url";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function FileActionsModal({
  visible,
  onClose,
  file,
  canMoveToAnotherGroup,
  onRequestMoveToAnotherGroup,
  onSelectMultiple,
}: {
  visible: boolean;
  onClose: () => void;
  file: { _id: Id<"vaultFiles">; name: string; url: string; type: string } | null;
  canMoveToAnotherGroup: boolean;
  onRequestMoveToAnotherGroup: () => void;
  onSelectMultiple?: () => void;
}) {
  const { colors } = useAppTheme();
  const deleteFile = useMutation(api.vault.mutations.deleteFile);
  const [downloading, setDownloading] = useState(false);

  if (!file) return null;

  const f = file;

  function handleOpen() {
    void promptOpenExternalUrl(f.url, f.name);
    onClose();
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAndShareFile(f.url, f.name, f.type);
      onClose();
    } catch (e) {
      showThemedAlert("Download failed", e instanceof Error ? e.message : "Could not download file.");
    } finally {
      setDownloading(false);
    }
  }

  function handleDelete() {
    showThemedAlert("Delete file", `Delete "${f.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFile({ fileId: f._id });
            onClose();
          } catch {
            showThemedAlert("Error", "Failed to delete file");
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} onClose={onClose}>
      <View className="p-4">
        <Text
          className="mb-3 border-b border-border pb-2 text-sm font-medium text-secondary-foreground"
          numberOfLines={1}
        >
          {f.name}
        </Text>
        <Pressable className="flex-row items-center gap-3 py-3 active:bg-muted" onPress={handleOpen}>
          <Ionicons name="open-outline" size={22} color={colors.textMuted} />
          <Text className="text-sm text-foreground">Open with…</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-3 py-3 active:bg-muted"
          onPress={() => void handleDownload()}
          disabled={downloading}
        >
          <Ionicons name="download-outline" size={22} color={colors.textMuted} />
          <Text className="text-sm text-foreground">
            {downloading ? "Downloading…" : "Download"}
          </Text>
        </Pressable>
        {onSelectMultiple ? (
          <Pressable
            className="flex-row items-center gap-3 py-3 active:bg-muted"
            onPress={() => {
              onSelectMultiple();
              onClose();
            }}
          >
            <Ionicons name="checkbox-outline" size={22} color={colors.textMuted} />
            <Text className="text-sm text-foreground">Select multiple</Text>
          </Pressable>
        ) : null}
        {canMoveToAnotherGroup ? (
          <Pressable
            className="flex-row items-center gap-3 py-3 active:bg-muted"
            onPress={onRequestMoveToAnotherGroup}
          >
            <Ionicons name="folder-open-outline" size={22} color={colors.textMuted} />
            <Text className="text-sm text-foreground">Move to collection</Text>
          </Pressable>
        ) : null}
        <Pressable className="flex-row items-center gap-3 py-3 active:bg-muted" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text className="text-sm text-destructive">Delete</Text>
        </Pressable>
        <Pressable
          className="mt-3 items-center rounded-sm bg-muted py-3 active:bg-muted"
          onPress={onClose}
        >
          <Text className="text-sm font-medium text-secondary-foreground">Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
