import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";
import { useMutation } from "convex/react";

import { AppPressable } from "@/components/ui/app-pressable";
import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { GROUP_COLORS } from "@/lib/group-colors";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type CreateGroupModalProps = {
  visible: boolean;
  onClose: () => void;
} & (
  | { groupKind?: "bookmarks"; onCreated?: (groupId: Id<"groups">) => void }
  | { groupKind: "vault"; onCreated?: (groupId: Id<"vaultGroups">) => void }
);

export function CreateGroupModal(props: CreateGroupModalProps) {
  const { visible, onClose } = props;
  const groupKind = props.groupKind === "vault" ? "vault" : "bookmarks";
  const { colors } = useAppTheme();
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(GROUP_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const createBookmarkGroup = useMutation(api.groups.mutations.create);
  const createVaultGroup = useMutation(api.vault.mutations.createVaultGroup);

  async function handleCreate() {
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (groupKind === "vault") {
        const groupId = await createVaultGroup({ title: title.trim(), color: selectedColor });
        setTitle("");
        setSelectedColor(GROUP_COLORS[0].value);
        if (props.groupKind === "vault") {
          props.onCreated?.(groupId);
        }
      } else {
        const groupId = await createBookmarkGroup({ title: title.trim(), color: selectedColor });
        setTitle("");
        setSelectedColor(GROUP_COLORS[0].value);
        if (props.groupKind !== "vault") {
          props.onCreated?.(groupId);
        }
      }
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to create collection");
    }
    setLoading(false);
  }

  function handleClose() {
    setTitle("");
    setSelectedColor(GROUP_COLORS[0].value);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="New collection"
      subtitle={
        groupKind === "vault"
          ? "Organize your vault files into collections"
          : "Group related bookmarks together"
      }
      variant="bottom"
      compact={false}
    >
      <View className="gap-5">
        <View className="gap-2">
          <Text className="font-sans text-sm font-medium text-foreground">Name</Text>
          <Input
            placeholder="e.g. Reading list, Work, Recipes…"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        <View className="gap-3">
          <Text className="font-sans text-sm font-medium text-foreground">Color</Text>
          <View className="flex-row flex-wrap gap-3">
            {GROUP_COLORS.map((c) => {
              const selected = selectedColor === c.value;
              return (
                <AppPressable
                  key={c.value}
                  onPress={() => setSelectedColor(c.value)}
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: c.value,
                    borderWidth: selected ? 3 : 0,
                    borderColor: selected ? colors.text : "transparent",
                  }}
                  accessibilityLabel={c.label}
                >
                  {selected ? <Ionicons name="checkmark" size={20} color="#ffffff" /> : null}
                </AppPressable>
              );
            })}
          </View>
        </View>

        <Button onPress={handleCreate} disabled={!title.trim()} loading={loading} className="mt-1">
          <Button.Text>Create collection</Button.Text>
        </Button>
      </View>
    </Modal>
  );
}
