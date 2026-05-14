import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius } from "@/lib/constants";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonTextContextValue = {
  textStyles: StyleProp<TextStyle>;
};

const ButtonTextContext = createContext<ButtonTextContextValue | null>(null);

function useOptionalButtonTextContext() {
  return useContext(ButtonTextContext);
}

export function ButtonText({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const ctx = useOptionalButtonTextContext();
  if (!ctx) {
    throw new Error("Button.Text must be used inside <Button>");
  }
  return <Text style={[ctx.textStyles, style]}>{children}</Text>;
}

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function ButtonRoot({
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

  const textContext = useMemo<ButtonTextContextValue>(
    () => ({
      textStyles: [styles.text, styles[`text_${variant}`], textStyle],
    }),
    [styles, variant, textStyle]
  );

  return (
    <ButtonTextContext.Provider value={textContext}>
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
        ) : (
          children
        )}
      </Pressable>
    </ButtonTextContext.Provider>
  );
}

export const Button = Object.assign(ButtonRoot, { Text: ButtonText });
