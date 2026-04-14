import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import type { AppColors } from "@/lib/theme-colors";
import { spacing, borderRadius } from "@/lib/constants";

export type FilterType = "all" | "read" | "unread";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "unread", label: "Not read" },
];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  value: FilterType;
  onChange: (filter: FilterType) => void;
}

export function FilterModal({ visible, onClose, value, onChange }: FilterModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeFilterStyles(colors), [colors]);

  return (
    <Modal visible={visible} onClose={onClose} title="Filter by status">
      <View style={styles.content}>
        {FILTERS.map((filter) => {
          const isSelected = value === filter.value;
          return (
            <Pressable
              key={filter.value}
              style={({ pressed }) => [
                styles.item,
                isSelected && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              onPress={() => {
                onChange(filter.value);
                onClose();
              }}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>
                {filter.label}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={18} color={colors.text} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

function makeFilterStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.md,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.sm,
      marginVertical: 2,
    },
    itemActive: {
      backgroundColor: colors.muted,
    },
    itemPressed: {
      backgroundColor: colors.muted,
    },
    itemText: {
      fontSize: 14,
      color: colors.text,
    },
    itemTextActive: {
      fontWeight: "600",
    },
  });
}
