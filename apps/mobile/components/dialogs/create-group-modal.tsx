import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation } from "convex/react";

import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { GROUP_COLORS } from "@/lib/group-colors";
import { spacing } from "@/lib/constants";
import { api } from "../../../../convex/_generated/api";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ visible, onClose }: CreateGroupModalProps) {
  const { colors } = useAppTheme();
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(GROUP_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const createGroup = useMutation(api.groups.mutations.create);

  async function handleCreate() {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await createGroup({ title: title.trim(), color: selectedColor });
      setTitle("");
      setSelectedColor(GROUP_COLORS[0].value);
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
    <Modal visible={visible} onClose={handleClose} title="Create collection" variant="bottom">
      <View style={styles.content}>
        <Input
          placeholder="Collection name..."
          value={title}
          onChangeText={setTitle}
          autoFocus
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

        <Button
          onPress={handleCreate}
          disabled={!title.trim()}
          loading={loading}
          style={styles.button}
        >
          Create
        </Button>
      </View>
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
  button: {
    marginTop: spacing.xs,
  },
});
