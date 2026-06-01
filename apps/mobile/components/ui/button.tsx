import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

import { AppPressable } from "./app-pressable";

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

function ButtonText({
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
    <Text
      className={cn("font-sans", ctx.textClassName, className)}
      style={[ctx.textStyle, style]}
    >
      {children}
    </Text>
  );
}

interface ButtonProps extends Omit<ComponentProps<typeof AppPressable>, "style" | "className"> {
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
  primary: "text-primary-foreground",
  secondary: "text-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-9 px-4",
  lg: "h-10 px-5",
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
  haptic = true,
  ...props
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === "primary" || variant === "destructive"
      ? colors.primaryForeground
      : colors.text;

  const textContext: ButtonTextContextValue = {
    textClassName: cn("text-sm font-medium", textVariantClasses[variant]),
    textStyle,
  };

  return (
    <ButtonTextContext.Provider value={textContext}>
      <AppPressable
        {...props}
        haptic={haptic && !isDisabled}
        disabled={isDisabled}
        className={cn(
          "items-center justify-center rounded-lg",
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
      </AppPressable>
    </ButtonTextContext.Provider>
  );
}

export const Button = Object.assign(ButtonRoot, { Text: ButtonText });
