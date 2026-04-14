import { useMemo } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const { colors } = useAppTheme();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        label: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          marginBottom: spacing.xs,
        },
        input: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          fontSize: 14,
          color: colors.text,
        },
        inputError: {
          borderColor: colors.error,
        },
        error: {
          fontSize: 12,
          color: colors.error,
          marginTop: spacing.xs,
        },
      }),
    [colors]
  );

  return (
    <View style={containerStyle}>
      {label && <Text style={themed.label}>{label}</Text>}
      <TextInput
        style={[themed.input, error && themed.inputError, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={themed.error}>{error}</Text>}
    </View>
  );
}
