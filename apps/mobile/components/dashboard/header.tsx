import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrgNoteLogo } from "@/components/ui/orgnote-logo";
import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";
import type { Id } from "../../../../convex/_generated/dataModel";

interface HeaderProps {
  selectedGroup: { _id: Id<"groups">; title: string; color?: string } | null;
  onOpenGroupSelector: () => void;
}

const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export function Header({ selectedGroup, onOpenGroupSelector }: HeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.surface,
        },
        logoContainer: {
          marginRight: spacing.sm,
        },
        logoBox: {
          width: 32,
          height: 32,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.muted,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        divider: {
          fontSize: 18,
          color: colors.textMuted,
          marginRight: spacing.sm,
        },
        groupSelector: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.sm,
          flex: 1,
          gap: spacing.sm,
        },
        groupSelectorPressed: {
          backgroundColor: colors.muted,
        },
        groupDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
        },
        groupText: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          flex: 1,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <OrgNoteLogo size={28} />
        </View>
      </View>
      <Text style={styles.divider}>/</Text>
      <Pressable
        style={({ pressed }) => [
          styles.groupSelector,
          pressed && styles.groupSelectorPressed,
        ]}
        onPress={onOpenGroupSelector}
      >
        <View
          style={[
            styles.groupDot,
            {
              backgroundColor: selectedGroup?.color ?? FALLBACK_COLORS[0],
            },
          ]}
        />
        <Text style={styles.groupText} numberOfLines={1}>
          {selectedGroup?.title ?? "Select Collection"}
        </Text>
        <Ionicons name="chevron-expand" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
