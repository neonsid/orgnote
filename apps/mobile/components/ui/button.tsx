import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius } from "@/lib/constants";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          alignItems: "center",
          justifyContent: "center",
          borderRadius: borderRadius.sm,
        },
        pressed: { opacity: 0.85 },
        disabled: { opacity: 0.5 },
        primary: { backgroundColor: colors.primary },
        secondary: { backgroundColor: colors.muted },
        outline: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        },
        ghost: { backgroundColor: "transparent" },
        destructive: { backgroundColor: colors.error },
        size_sm: { paddingHorizontal: 12, paddingVertical: 8 },
        size_md: { paddingHorizontal: 16, paddingVertical: 10 },
        size_lg: { paddingHorizontal: 20, paddingVertical: 14 },
        text: { fontSize: 14, fontWeight: "500" },
        text_primary: { color: colors.surface },
        text_secondary: { color: colors.text },
        text_outline: { color: colors.text },
        text_ghost: { color: colors.text },
        text_destructive: { color: "#fff" },
      }),
    [colors]
  );

  const spinnerColor =
    variant === "primary" || variant === "destructive" ? colors.surface : colors.text;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : typeof children === "string" ? (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
