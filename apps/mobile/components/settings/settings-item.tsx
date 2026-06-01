import { Text } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

import { ListRow } from "@/components/ui/list-row";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function SettingsItem({
  icon,
  label,
  value,
  onPress,
  showChevron,
  destructive,
}: SettingsItemProps) {
  return (
    <ListRow
      icon={icon}
      title={label}
      onPress={onPress}
      showChevron={showChevron}
      destructive={destructive}
      right={
        value ? (
          <Text className="mr-2 font-sans text-xs text-muted-foreground">{value}</Text>
        ) : undefined
      }
    />
  );
}
