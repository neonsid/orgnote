import { Text, View } from "react-native";

import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <Text className="text-center font-sans text-base font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="max-w-[280px] text-center font-sans text-sm leading-5 text-muted-foreground">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction} className="mt-2">
          <Button.Text>{actionLabel}</Button.Text>
        </Button>
      ) : null}
    </View>
  );
}
