import { Text, View } from "react-native";

export function VaultStatsBar({
  statsLabel,
}: {
  statsLabel: string;
}) {
  return (
    <View className="bg-surface px-4 py-3">
      <Text className="text-xs text-muted-foreground">{statsLabel}</Text>
    </View>
  );
}
