import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { GROUP_COLORS } from "@/lib/group-colors";
import { spacing } from "@/lib/constants";
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
    <View style={styles.content}>
      <Input
        placeholder={groupKind === "vault" ? "Group name..." : "Collection name..."}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>Color</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorRow}
      >
        {GROUP_COLORS.map((c) => {
          const selected = selectedColor === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setSelectedColor(c.value)}
              style={[
                styles.colorSwatch,
                {
                  backgroundColor: c.value,
                  borderColor: selected ? colors.text : "transparent",
                },
              ]}
              accessibilityLabel={c.label}
            >
              {selected && (
                <Ionicons name="checkmark" size={20} color="#ffffff" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <Button variant="outline" onPress={onClose} disabled={loading} style={styles.actionBtn}>
          <Button.Text>Cancel</Button.Text>
        </Button>
        <Button
          onPress={() => void handleSave()}
          disabled={!title.trim()}
          loading={loading}
          style={styles.actionBtn}
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

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  colorLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  colorRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
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
