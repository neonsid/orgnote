import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerStyle,
  containerClassName,
  className,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle} className={containerClassName}>
      {label ? (
        <Text className="mb-1.5 font-sans text-sm font-medium text-foreground">{label}</Text>
      ) : null}
      <TextInput
        className={cn(
          "h-10 rounded-xl border border-input bg-surface px-3 font-sans text-sm text-foreground",
          focused && "border-ring",
          error && "border-destructive",
          className
        )}
        style={style}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {error ? <Text className="mt-1 font-sans text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
