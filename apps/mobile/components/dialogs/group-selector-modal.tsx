import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import type { AppColors } from "@/lib/theme-colors";
import { spacing, borderRadius } from "@/lib/constants";
import type { Id } from "../../../../convex/_generated/dataModel";

const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
  isPublic?: boolean;
}

interface GroupSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  groups: Group[];
  selectedGroupId: Id<"groups"> | null;
  onSelectGroup: (id: Id<"groups">) => void;
  onCreateGroup: () => void;
}

export function GroupSelectorModal({
  visible,
  onClose,
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
}: GroupSelectorModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeGroupStyles(colors), [colors]);

  return (
    <Modal visible={visible} onClose={onClose} title="Collections">
      <ScrollView style={styles.list}>
        {groups.map((group, index) => {
          const isSelected = group._id === selectedGroupId;
          return (
            <Pressable
              key={group._id}
              style={({ pressed }) => [
                styles.item,
                isSelected && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              onPress={() => {
                onSelectGroup(group._id);
                onClose();
              }}
            >
              <View style={styles.itemContent}>
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor:
                        group.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                    },
                  ]}
                />
                <Text
                  style={[styles.itemText, isSelected && styles.itemTextActive]}
                  numberOfLines={1}
                >
                  {group.title}
                </Text>
              </View>
              {isSelected && <Ionicons name="checkmark" size={18} color={colors.text} />}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          onPress={onCreateGroup}
        >
          <Ionicons name="add" size={18} color={colors.text} />
          <Text style={styles.createButtonText}>Create Collection</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function makeGroupStyles(colors: AppColors) {
  return StyleSheet.create({
    list: {
      maxHeight: 280,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderRadius: borderRadius.sm,
      marginHorizontal: spacing.sm,
      marginVertical: 2,
    },
    itemActive: {
      backgroundColor: colors.muted,
    },
    itemPressed: {
      backgroundColor: colors.muted,
    },
    itemContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      flex: 1,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    itemText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    itemTextActive: {
      fontWeight: "600",
    },
    footer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 10,
      borderRadius: borderRadius.sm,
    },
    createButtonPressed: {
      backgroundColor: colors.muted,
    },
    createButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
  });
}
