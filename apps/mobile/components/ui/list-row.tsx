import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

import { AppPressable } from "./app-pressable";

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  right?: ReactNode;
  className?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  showChevron,
  destructive = false,
  onPress,
  right,
  className,
}: ListRowProps) {
  const { colors } = useAppTheme();
  const chevron = showChevron ?? Boolean(onPress);

  const content = (
    <>
      {icon ? (
        <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? colors.error : colors.textSecondary}
          />
        </View>
      ) : null}
      <View className="min-w-0 flex-1">
        <Text
          className={cn(
            "font-sans text-sm text-foreground",
            destructive && "text-destructive"
          )}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-sans text-xs text-muted-foreground" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <AppPressable
        onPress={onPress}
        className={cn("flex-row items-center px-4 py-3", className)}
      >
        {content}
      </AppPressable>
    );
  }

  return <View className={cn("flex-row items-center px-4 py-3", className)}>{content}</View>;
}
