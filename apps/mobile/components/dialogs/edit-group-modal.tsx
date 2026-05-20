import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { GROUP_COLORS } from "@/lib/group-colors";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface EditGroupModalGroup {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

export type EditVaultGroupModalGroup = {
  _id: Id<"vaultGroups">;
  title: string;
  color?: string;
};

type EditGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
} & (
  | { groupKind?: "bookmarks"; group: EditGroupModalGroup | null }
  | { groupKind: "vault"; group: EditVaultGroupModalGroup | null }
);

function EditGroupFormBody({
  group,
  groupKind,
  onClose,
  onSaved,
}: {
  group: EditGroupModalGroup | EditVaultGroupModalGroup;
  groupKind: "bookmarks" | "vault";
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { colors } = useAppTheme();
  const [title, setTitle] = useState(() => group.title);
  const [selectedColor, setSelectedColor] = useState(
    () => group.color ?? GROUP_COLORS[0].value
  );
  const [loading, setLoading] = useState(false);
  const renameGroup = useMutation(api.groups.mutations.renameGroup);
  const renameVaultGroup = useMutation(api.vault.mutations.renameVaultGroup);

  async function handleSave() {
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (groupKind === "vault") {
        await renameVaultGroup({
          groupId: group._id as Id<"vaultGroups">,
          title: title.trim(),
          color: selectedColor,
        });
      } else {
        await renameGroup({
          groupId: group._id as Id<"groups">,
          title: title.trim(),
          color: selectedColor,
        });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      showThemedAlert(
        "Error",
        err instanceof Error ? err.message : "Failed to rename collection"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-3 p-4">
      <Input
        placeholder={groupKind === "vault" ? "Group name..." : "Collection name..."}
        value={title}
        onChangeText={setTitle}
      />

      <Text className="mt-1 text-[13px] font-semibold text-secondary-foreground">Color</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 py-1"
      >
        {GROUP_COLORS.map((c) => {
          const selected = selectedColor === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setSelectedColor(c.value)}
              className="h-10 w-10 items-center justify-center rounded-full border-[3px]"
              style={{
                backgroundColor: c.value,
                borderColor: selected ? colors.text : "transparent",
              }}
              accessibilityLabel={c.label}
            >
              {selected && (
                <Ionicons name="checkmark" size={20} color="#ffffff" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="mt-1 flex-row gap-2">
        <Button variant="outline" onPress={onClose} disabled={loading} className="flex-1">
          <Button.Text>Cancel</Button.Text>
        </Button>
        <Button
          onPress={() => void handleSave()}
          disabled={!title.trim()}
          loading={loading}
          className="flex-1"
        >
          <Button.Text>Save</Button.Text>
        </Button>
      </View>
    </View>
  );
}

/**
 * Bookmark collections: `renameGroup`. Vault: `renameVaultGroup`.
 * Mirrors web rename flows.
 */
export function EditGroupModal(props: EditGroupModalProps) {
  const { visible, onClose, group, onSaved } = props;
  const groupKind = props.groupKind === "vault" ? "vault" : "bookmarks";

  function handleClose() {
    onClose();
  }

  if (!group) return null;

  const modalTitle = groupKind === "vault" ? "Rename Group" : "Rename collection";

  return (
    <Modal visible={visible} onClose={handleClose} title={modalTitle} variant="center">
      <EditGroupFormBody
        key={`${group._id}-${visible}`}
        group={group}
        groupKind={groupKind}
        onClose={handleClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
