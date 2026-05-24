import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

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
  showChevron = true,
  destructive = false,
}: SettingsItemProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      className={cn(
        "flex-row items-center justify-between px-4 py-3",
        onPress && "active:bg-muted"
      )}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-center gap-3">
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.error : colors.textMuted}
        />
        <Text className={cn("text-sm text-foreground", destructive && "text-destructive")}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value ? <Text className="text-[13px] text-muted-foreground">{value}</Text> : null}
        {showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}
