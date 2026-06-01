import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { OrgNoteLogo } from "@/components/ui/orgnote-logo";
import { useAppTheme } from "@/contexts/app-theme";
import { FALLBACK_COLORS } from "@goldfish/shared";
import type { Id } from "../../../../convex/_generated/dataModel";

interface HeaderProps {
  selectedGroup: { _id: Id<"groups">; title: string; color?: string } | null;
  onOpenGroupSelector: () => void;
}

export function Header({ selectedGroup, onOpenGroupSelector }: HeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View className="h-14 flex-row items-center px-4">
      <View
        className="h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-border"
        style={{ backgroundColor: colors.brandLogoBg }}
      >
        <OrgNoteLogo size={24} />
      </View>
      <Text className="px-2.5 font-sans text-lg text-muted-foreground">/</Text>
      <AppPressable
        className="min-h-11 flex-1 flex-row items-center gap-2.5 rounded-xl px-3 py-2.5 active:bg-muted/60"
        onPress={onOpenGroupSelector}
      >
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: selectedGroup?.color ?? FALLBACK_COLORS[0],
          }}
        />
        <Text className="flex-1 font-sans text-[15px] font-semibold text-foreground" numberOfLines={1}>
          {selectedGroup?.title ?? "Select Collection"}
        </Text>
        <Ionicons name="chevron-expand" size={16} color={colors.textMuted} />
      </AppPressable>
    </View>
  );
}
