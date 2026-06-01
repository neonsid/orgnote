import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

import { AppPressable } from "./app-pressable";

interface ActionSheetRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function ActionSheetRow({
  icon,
  label,
  onPress,
  destructive = false,
}: ActionSheetRowProps) {
  const { colors } = useAppTheme();

  return (
    <AppPressable
      className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted/80"
      onPress={onPress}
    >
      <View
        className={cn(
          "size-10 items-center justify-center rounded-xl",
          destructive ? "bg-destructive/15" : "bg-muted"
        )}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.error : colors.text}
        />
      </View>
      <Text
        className={cn(
          "flex-1 font-sans text-[15px] font-medium leading-5 text-foreground",
          destructive && "text-destructive"
        )}
      >
        {label}
      </Text>
    </AppPressable>
  );
}

function ActionSheetHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-2 gap-1 border-b border-border px-1 pb-3.5">
      <Text className="font-sans text-base font-semibold leading-5 text-foreground" numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="font-sans text-sm leading-4 text-muted-foreground" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
