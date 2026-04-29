import { useMutation } from "convex/react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { spacing, borderRadius } from "@/lib/constants";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface DeleteGroupModalGroup {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

export type DeleteVaultGroupModalGroup = {
  _id: Id<"vaultGroups">;
  title: string;
  color?: string;
};

type DeleteGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Convex group id — bookmark collection or vault group depending on `groupKind`. */
  onDeleted?: (deletedId: Id<"groups"> | Id<"vaultGroups">) => void;
} & (
  | {
      groupKind?: "bookmarks";
      group: DeleteGroupModalGroup | null;
    }
  | {
      groupKind: "vault";
      group: DeleteVaultGroupModalGroup | null;
    }
);

const FALLBACK_COLOR = "#f59e0b";

/**
 * Bookmark collections: `deleteGroup`. Vault: `deleteVaultGroup`.
 * Mirrors web delete confirmation.
 */
export function DeleteGroupModal(props: DeleteGroupModalProps) {
  const { visible, onClose, group, onDeleted } = props;
  const groupKind = props.groupKind === "vault" ? "vault" : "bookmarks";
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const deleteGroup = useMutation(api.groups.mutations.deleteGroup);
  const deleteVaultGroup = useMutation(api.vault.mutations.deleteVaultGroup);

  async function handleDelete() {
    if (!group || loading) return;

    setLoading(true);
    try {
      if (groupKind === "vault") {
        const vaultId = group._id as Id<"vaultGroups">;
        await deleteVaultGroup({ groupId: vaultId });
        onDeleted?.(vaultId);
      } else {
        const bookmarkGroupId = group._id as Id<"groups">;
        await deleteGroup({ groupId: bookmarkGroupId });
        onDeleted?.(bookmarkGroupId);
      }
      onClose();
    } catch (err) {
      showThemedAlert(
        "Error",
        err instanceof Error ? err.message : "Failed to delete collection"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!group) return null;

  const modalTitle = groupKind === "vault" ? "Delete Group" : "Delete collection";
  const description =
    groupKind === "vault"
      ? "This action cannot be undone. Permanently delete this vault group?"
      : "This action cannot be undone. Are you sure you want to permanently delete this collection and its bookmarks?";

  return (
    <Modal visible={visible} onClose={onClose} title={modalTitle} variant="center">
      <View style={styles.body}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

        <View
          style={[
            styles.preview,
            { borderColor: colors.border, backgroundColor: colors.muted },
          ]}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: group.color ?? FALLBACK_COLOR },
            ]}
          />
          <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>
            {group.title}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button variant="ghost" onPress={onClose} disabled={loading} style={styles.actionBtn}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onPress={() => void handleDelete()}
            loading={loading}
            style={styles.actionBtn}
          >
            Delete
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
