import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";

interface LoadingProps {
  message?: string;
  size?: "small" | "large";
}

export function Loading({ message, size = "small" }: LoadingProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        },
        message: {
          fontSize: 13,
          color: colors.textMuted,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.textMuted} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}
