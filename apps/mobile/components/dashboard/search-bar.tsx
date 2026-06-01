import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { useAppTheme } from "@/contexts/app-theme";

type FilterType = "all" | "read" | "unread";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  filter: FilterType;
  onOpenFilter: () => void;
  onOpenAdd: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  filter,
  onOpenFilter,
  onOpenAdd,
}: SearchBarProps) {
  const { colors } = useAppTheme();
  const filterActive = filter !== "all";

  return (
    <View className="flex-row items-center gap-3 px-4 pb-3 pt-1">
      <View className="h-11 flex-1 flex-row items-center gap-2.5 rounded-xl border border-input bg-surface px-3.5">
        <Ionicons name="add" size={18} color={colors.textMuted} />
        <TextInput
          className="flex-1 font-sans text-[15px] text-foreground"
          placeholder="Insert a link, color, or just plain text…"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 ? (
          <AppPressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </AppPressable>
        ) : null}
      </View>

      <AppPressable
        className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface"
        onPress={onOpenFilter}
      >
        <Ionicons
          name={filterActive ? "filter" : "filter-outline"}
          size={20}
          color={filterActive ? colors.primaryAccent : colors.textMuted}
        />
      </AppPressable>

      <AppPressable
        className="h-11 w-11 items-center justify-center rounded-xl bg-primary"
        haptic
        onPress={onOpenAdd}
      >
        <Ionicons name="add" size={22} color={colors.primaryForeground} />
      </AppPressable>
    </View>
  );
}
