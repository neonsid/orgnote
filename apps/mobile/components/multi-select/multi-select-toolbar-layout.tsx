import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

export function MultiSelectActionChip({
  icon,
  label,
  onPress,
  iconColor,
  destructive,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor: string;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      className={cn(
        "min-w-[72px] max-w-[100px] items-center justify-center gap-1 rounded-md border border-border bg-muted px-1 py-2 active:bg-background",
        destructive && "border-destructive/30 bg-destructive/10"
      )}
      style={{ opacity: disabled ? 0.45 : 1 }}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text
        className={cn(
          "text-center font-semibold text-secondary-foreground",
          destructive && "text-destructive"
        )}
        numberOfLines={1}
        style={{ fontSize: 10 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function MultiSelectToolbarLayout({
  selectedCount,
  countLabel,
  onClearSelection,
  children,
}: {
  selectedCount: number;
  /** Defaults to `${selectedCount} selected` */
  countLabel?: string;
  onClearSelection: () => void;
  children: ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="gap-2 border-b border-border bg-surface px-3 pb-3 pt-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-sm active:bg-muted"
          onPress={onClearSelection}
          hitSlop={8}
          accessibilityLabel="Exit selection mode"
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
          {countLabel ?? `${selectedCount} selected`}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-stretch gap-2 pb-0.5"
      >
        {children}
      </ScrollView>
    </View>
  );
}
