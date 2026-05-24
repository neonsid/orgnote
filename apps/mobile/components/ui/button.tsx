import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonTextContextValue = {
  textClassName: string;
  textStyle?: StyleProp<TextStyle>;
};

const ButtonTextContext = createContext<ButtonTextContextValue | null>(null);

function useOptionalButtonTextContext() {
  return useContext(ButtonTextContext);
}

export function ButtonText({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
}) {
  const ctx = useOptionalButtonTextContext();
  if (!ctx) {
    throw new Error("Button.Text must be used inside <Button>");
  }
  return (
    <Text className={cn(ctx.textClassName, className)} style={[ctx.textStyle, style]}>
      {children}
    </Text>
  );
}

interface ButtonProps extends Omit<PressableProps, "style" | "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-muted",
  outline: "border border-border bg-transparent",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: "text-surface",
  secondary: "text-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-2.5",
  lg: "px-5 py-3.5",
};

function ButtonRoot({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === "primary" || variant === "destructive" ? colors.surface : colors.text;

  const textContext = useMemo<ButtonTextContextValue>(
    () => ({
      textClassName: cn("text-sm font-medium", textVariantClasses[variant]),
      textStyle,
    }),
    [variant, textStyle]
  );

  return (
    <ButtonTextContext.Provider value={textContext}>
      <Pressable
        {...props}
        disabled={isDisabled}
        className={cn(
          "items-center justify-center rounded-sm active:bg-muted",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && "opacity-50",
          className
        )}
        style={style}
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
