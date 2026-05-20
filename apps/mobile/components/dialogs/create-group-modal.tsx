import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation } from "convex/react";

import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { GROUP_COLORS } from "@/lib/group-colors";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the new group id so the list can select it. */
  onCreated?: (groupId: Id<"groups">) => void;
}

export function CreateGroupModal({ visible, onClose, onCreated }: CreateGroupModalProps) {
  const { colors } = useAppTheme();
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(GROUP_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const createGroup = useMutation(api.groups.mutations.create);

  async function handleCreate() {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const groupId = await createGroup({ title: title.trim(), color: selectedColor });
      setTitle("");
      setSelectedColor(GROUP_COLORS[0].value);
      onCreated?.(groupId);
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTitle("");
    setSelectedColor(GROUP_COLORS[0].value);
    onClose();
  }

  return (
    <Modal visible={visible} onClose={handleClose} title="Create collection" variant="center">
      <View className="gap-3 p-4">
        <Input
          placeholder="Collection name..."
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

        <Button
          onPress={handleCreate}
          disabled={!title.trim()}
          loading={loading}
          className="mt-1"
        >
          <Button.Text>Create</Button.Text>
        </Button>
      </View>
    </Modal>
  );
}
