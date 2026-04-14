import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { spacing } from "@/lib/constants";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function SettingsItem({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
}: SettingsItemProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        item: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: 12,
        },
        itemPressed: {
          backgroundColor: colors.muted,
        },
        left: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        },
        label: {
          fontSize: 14,
          color: colors.text,
        },
        destructive: {
          color: colors.error,
        },
        right: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        value: {
          fontSize: 13,
          color: colors.textMuted,
        },
      }),
    [colors]
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && onPress && { backgroundColor: colors.muted }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.left}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.error : colors.textMuted}
        />
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
      </View>
      <View style={styles.right}>
        {value && <Text style={styles.value}>{value}</Text>}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}
