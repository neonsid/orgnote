import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { spacing } from "@/lib/constants";

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: spacing.lg,
        },
        title: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xs,
        },
        content: {
          backgroundColor: colors.surface,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.section}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  );
}
