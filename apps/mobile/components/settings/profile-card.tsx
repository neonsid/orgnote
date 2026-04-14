import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useUser } from "@clerk/expo";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";

export function ProfileCard() {
  const { user } = useUser();
  const { colors } = useAppTheme();

  const initials =
    user?.firstName?.[0] ??
    user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ??
    "?";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          marginHorizontal: spacing.lg,
          marginVertical: spacing.md,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.md,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.text,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarText: {
          fontSize: 18,
          fontWeight: "600",
          color: colors.background,
        },
        info: {
          flex: 1,
        },
        name: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        email: {
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user?.fullName ?? user?.firstName ?? "User"}</Text>
        <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress ?? ""}</Text>
      </View>
    </View>
  );
}
