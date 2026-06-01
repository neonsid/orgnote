import * as Haptics from "expo-haptics";
import { Platform, Pressable, type PressableProps } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

interface AppPressableProps extends PressableProps {
  haptic?: boolean;
  className?: string;
}

export function AppPressable({
  haptic = false,
  className,
  onPress,
  android_ripple,
  ...props
}: AppPressableProps) {
  const { colors } = useAppTheme();

  function handlePress(event: Parameters<NonNullable<PressableProps["onPress"]>>[0]) {
    if (haptic && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  }

  return (
    <Pressable
      {...props}
      className={cn(Platform.OS === "ios" && "active:bg-muted/50", className)}
      onPress={handlePress}
      android_ripple={
        android_ripple ??
        (Platform.OS === "android"
          ? { color: colors.muted, borderless: false }
          : undefined)
      }
    />
  );
}
