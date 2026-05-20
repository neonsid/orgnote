import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

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
    <View className="flex-row items-center bg-surface p-3">
      <View className="shrink-0">
        <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
          <OrgNoteLogo size={28} />
        </View>
      </View>
      <View className="justify-center px-3">
        <Text className="text-lg leading-[22px] text-muted-foreground">/</Text>
      </View>
      <Pressable
        className="min-h-10 flex-1 flex-row items-center gap-2 rounded-sm px-3 py-2 active:bg-muted"
        onPress={onOpenGroupSelector}
      >
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: selectedGroup?.color ?? FALLBACK_COLORS[0],
          }}
        />
        <Text className="flex-1 text-[15px] font-semibold text-foreground" numberOfLines={1}>
          {selectedGroup?.title ?? "Select Collection"}
        </Text>
        <Ionicons name="chevron-expand" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
