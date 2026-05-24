import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type StyleProp,
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
  ...props
}: InputProps) {
  const { colors } = useAppTheme();

  return (
    <View style={containerStyle} className={containerClassName}>
      {label ? (
        <Text className="mb-1 text-[13px] font-medium text-secondary-foreground">{label}</Text>
      ) : null}
      <TextInput
        className={cn(
          "rounded-sm border border-border bg-surface px-3 py-3 text-sm text-foreground",
          error && "border-destructive",
          className
        )}
        style={style}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
