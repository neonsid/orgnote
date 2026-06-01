import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { useAppTheme } from "@/contexts/app-theme";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";

const TOOLBAR_MAX_WIDTH = 260;

export function MultiSelectToolbarLayout({
  selectedCount,
  countLabel,
  onClearSelection,
  children,
  fixedBottom = true,
}: {
  selectedCount: number;
  countLabel?: string;
  onClearSelection: () => void;
  children: ReactNode;
  fixedBottom?: boolean;
}) {
  const { colors } = useAppTheme();
  const tabBarHeight = useTabBarHeight();

  const panel = (
    <View className="overflow-hidden rounded-lg border border-border/50 bg-card">
      <BlurView
        intensity={Platform.OS === "ios" ? 72 : 56}
        tint="dark"
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: Platform.OS === "ios" ? "rgba(22, 24, 28, 0.82)" : "rgba(22, 24, 28, 0.9)" },
        ]}
      />

      <View className="flex-row items-center gap-2 border-b border-border/60 p-2">
        <AppPressable
          className="size-7 items-center justify-center rounded-full bg-muted/80"
          onPress={onClearSelection}
          hitSlop={8}
          accessibilityLabel="Exit selection mode"
        >
          <Ionicons name="close" size={16} color={colors.text} />
        </AppPressable>
        <Text className="flex-1 font-sans text-base font-medium text-foreground" numberOfLines={1}>
          {countLabel ?? `${selectedCount} selected`}
        </Text>
      </View>

      <ScrollView
        className="max-h-56"
        contentContainerClassName="py-0.5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </View>
  );

  if (fixedBottom) {
    return (
      <View
        className="absolute bottom-3 left-0 right-0 items-center px-4"
        pointerEvents="box-none"
        style={{ zIndex: 90, boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.25)", bottom: tabBarHeight + 12 }}
      >
        <View style={{ width: "100%", maxWidth: TOOLBAR_MAX_WIDTH }} pointerEvents="auto">
          {panel}
        </View>
      </View>
    );
  }

  return (
    <View className="items-center px-4 py-2">
      <View style={{ width: "100%", maxWidth: TOOLBAR_MAX_WIDTH }}>{panel}</View>
    </View>
  );
}
