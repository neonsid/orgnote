import { ActivityIndicator, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";

interface LoadingProps {
  message?: string;
  size?: "small" | "large";
}

export function Loading({ message, size = "small" }: LoadingProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator size={size} color={colors.textMuted} />
      {message ? (
        <Text className="font-sans text-sm text-muted-foreground">{message}</Text>
      ) : null}
    </View>
  );
}
