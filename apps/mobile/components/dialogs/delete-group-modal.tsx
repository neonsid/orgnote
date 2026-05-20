import { useMutation } from "convex/react";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button, Modal } from "@/components/ui";
import { showThemedAlert } from "@/contexts/themed-alert";
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
      <View className="gap-3 p-4">
        <Text className="text-sm leading-5 text-secondary-foreground">{description}</Text>

        <View className="flex-row items-center gap-3 rounded-sm border border-border bg-muted px-3 py-2.5">
          <View
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: group.color ?? FALLBACK_COLOR }}
          />
          <Text className="flex-1 text-[15px] font-semibold text-foreground" numberOfLines={2}>
            {group.title}
          </Text>
        </View>

        <View className="mt-1 flex-row gap-2">
          <Button variant="ghost" onPress={onClose} disabled={loading} className="flex-1">
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button
            variant="destructive"
            onPress={() => void handleDelete()}
            loading={loading}
            className="flex-1"
          >
            <Button.Text>Delete</Button.Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
