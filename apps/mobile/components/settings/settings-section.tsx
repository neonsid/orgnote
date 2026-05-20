import { Text, View } from "react-native";

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mb-4">
      {title ? (
        <Text className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </Text>
      ) : null}
      <View className="bg-surface">{children}</View>
    </View>
  );
}
