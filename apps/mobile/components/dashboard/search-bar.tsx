import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";

type FilterType = "all" | "read" | "unread";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  filter: FilterType;
  onOpenFilter: () => void;
  onOpenAdd: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  filter,
  onOpenFilter,
  onOpenAdd,
}: SearchBarProps) {
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
          backgroundColor: colors.surface,
        },
        inputContainer: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.md,
          height: 40,
          gap: spacing.sm,
        },
        input: {
          flex: 1,
          fontSize: 14,
          color: colors.text,
        },
        iconButton: {
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: borderRadius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        iconButtonPressed: {
          backgroundColor: colors.muted,
        },
        addButton: {
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
          borderRadius: borderRadius.sm,
        },
        addButtonPressed: {
          opacity: 0.85,
        },
      }),
    [colors]
  );

  const addIconColor = resolvedScheme === "dark" ? colors.background : "#ffffff";

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="add" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Insert a link or plain text…"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        onPress={onOpenFilter}
      >
        <Ionicons
          name={filter === "all" ? "filter-outline" : "filter"}
          size={18}
          color={filter === "all" ? colors.textSecondary : colors.text}
        />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        onPress={onOpenAdd}
      >
        <Ionicons name="add" size={20} color={addIconColor} />
      </Pressable>
    </View>
  );
}
