import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

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
  const { colors, resolvedScheme } = useAppTheme();
  const addIconColor = resolvedScheme === "dark" ? colors.background : "#ffffff";

  return (
    <View className="flex-row items-center gap-2 bg-surface px-3 py-2">
      <View className="h-10 flex-1 flex-row items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Ionicons name="add" size={16} color={colors.textMuted} />
        <TextInput
          className="flex-1 text-sm text-foreground"
          placeholder="Insert a link or plain text…"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        className="h-10 w-10 items-center justify-center rounded-sm border border-border bg-surface active:bg-muted"
        onPress={onOpenFilter}
      >
        <Ionicons
          name={filter === "all" ? "filter-outline" : "filter"}
          size={18}
          color={filter === "all" ? colors.textSecondary : colors.text}
        />
      </Pressable>

      <Pressable
        className="h-10 w-10 items-center justify-center rounded-sm bg-primary"
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        onPress={onOpenAdd}
      >
        <Ionicons name="add" size={20} color={addIconColor} />
      </Pressable>
    </View>
  );
}
