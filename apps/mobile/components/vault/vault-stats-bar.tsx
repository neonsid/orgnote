import { Text, View } from "react-native";

export function VaultStatsBar({ statsLabel }: { statsLabel: string }) {
  return (
    <View className="rounded-xl border border-border bg-card px-4 py-3.5">
      <Text className="font-sans text-sm text-muted-foreground">{statsLabel}</Text>
    </View>
  );
}
