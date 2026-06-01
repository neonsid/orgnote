import { Text, View } from "react-native";

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mb-4 px-4">
      {title ? (
        <Text className="mb-2 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-xl border border-border bg-card">{children}</View>
    </View>
  );
}
