import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui";
import { SheetBody, SheetDivider, SheetRow, SheetSectionLabel } from "@/components/ui/sheet-row";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { downloadAndShareFile } from "@/lib/download-file-native";
import { openInAppBrowser } from "@/lib/open-in-app-browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function getFileIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.startsWith("image/")) return "image-outline";
  if (type.startsWith("video/")) return "videocam-outline";
  if (type.startsWith("audio/")) return "musical-notes-outline";
  if (type.includes("pdf")) return "document-text-outline";
  if (type.includes("epub")) return "book-outline";
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return "archive-outline";
  return "document-outline";
}

function formatFileTypeLabel(type: string): string {
  if (type.startsWith("image/")) return "Image";
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";
  if (type.includes("pdf")) return "PDF document";
  if (type.includes("epub")) return "E-book";
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return "Archive";
  if (type.includes("text/")) return "Text file";
  return "File";
}

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

  const tints = useMemo(
    () => ({
      primary: `${colors.primaryAccent}18`,
      success: `${colors.success}18`,
      cyan: `${colors.brandCyan}18`,
      muted: `${colors.textMuted}18`,
      destructive: `${colors.error}18`,
    }),
    [colors]
  );

  if (!file) return null;

  const f = file;
  const fileIcon = getFileIcon(f.type);

  function handleClose() {
    onClose();
  }

  async function handleOpen() {
    try {
      await openInAppBrowser(f.url, f.name);
    } catch {
      showThemedAlert("Error", "Could not open this file.");
    }
    handleClose();
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAndShareFile(f.url, f.name, f.type);
      handleClose();
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
            handleClose();
          } catch {
            showThemedAlert("Error", "Failed to delete file");
          }
        },
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      variant="bottom"
      title={f.name}
      subtitle={formatFileTypeLabel(f.type)}
      scrollable
      showHandle
    >
      <SheetBody>
        <SheetSectionLabel>Actions</SheetSectionLabel>
        <SheetRow
          title="Open"
          subtitle="View in browser"
          icon={fileIcon}
          iconTint={tints.primary}
          iconColor={colors.primaryAccent}
          titleTone="primary"
          onPress={() => void handleOpen()}
          showChevron
        />
        <SheetRow
          title={downloading ? "Downloading…" : "Download"}
          subtitle="Save or share this file"
          icon="download-outline"
          iconTint={tints.success}
          iconColor={colors.success}
          titleTone="success"
          onPress={() => void handleDownload()}
          disabled={downloading}
          showChevron
        />
        {canMoveToAnotherGroup ? (
          <SheetRow
            title="Move to collection"
            subtitle="Organize into another group"
            icon="folder-open-outline"
            iconTint={tints.cyan}
            iconColor={colors.brandCyan}
            titleTone="cyan"
            onPress={onRequestMoveToAnotherGroup}
            showChevron
          />
        ) : null}
        {onSelectMultiple ? (
          <SheetRow
            title="Select multiple"
            subtitle="Choose more files at once"
            icon="checkbox-outline"
            iconTint={tints.muted}
            iconColor={colors.textSecondary}
            onPress={() => {
              onSelectMultiple();
              handleClose();
            }}
            showChevron
          />
        ) : null}
      </SheetBody>

      <SheetBody>
        <SheetDivider />
        <SheetSectionLabel>Danger zone</SheetSectionLabel>
        <SheetRow
          title="Delete file"
          subtitle="Permanently remove from vault"
          icon="trash-outline"
          iconTint={tints.destructive}
          iconColor={colors.error}
          destructive
          onPress={handleDelete}
          showChevron
        />
      </SheetBody>
    </Modal>
  );
}
