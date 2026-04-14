import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { spacing } from "@/lib/constants";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "folder-open-outline",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xxxl,
          gap: spacing.lg,
        },
        iconContainer: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        },
        textContainer: {
          alignItems: "center",
          gap: spacing.xs,
        },
        title: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
        },
        description: {
          fontSize: 13,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 20,
          maxWidth: 280,
        },
        button: {
          marginTop: spacing.sm,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {actionLabel && onAction && (
        <Button variant="outline" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
