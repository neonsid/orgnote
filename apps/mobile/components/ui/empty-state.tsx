import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "folder-open-outline",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-4 p-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-center text-[15px] font-semibold text-foreground">{title}</Text>
        {description ? (
          <Text className="max-w-[280px] text-center text-[13px] leading-5 text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction} className="mt-2">
          <Button.Text>{actionLabel}</Button.Text>
        </Button>
      ) : null}
    </View>
  );
}
