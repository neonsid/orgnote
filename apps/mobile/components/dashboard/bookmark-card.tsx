import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View, type GestureResponderEvent } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
import { getHostname } from "@/lib/utils";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface BookmarkData {
  _id: Id<"bookmarks">;
  title: string;
  url: string;
  doneReading?: boolean;
  description?: string;
  /** Convex `_creationTime` (ms); used for export parity with web. */
  _creationTime?: number;
}

interface BookmarkCardProps {
  bookmark: BookmarkData;
  onPress: () => void;
  onLongPress: () => void;
  onToggleRead?: (bookmark: BookmarkData) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
}

export function BookmarkCard({
  bookmark,
  onPress,
  onLongPress,
  onToggleRead,
  isSelecting = false,
  isSelected = false,
}: BookmarkCardProps) {
  const { colors } = useAppTheme();
  const hostname = getHostname(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  function handleToggleRead(event: GestureResponderEvent) {
    event.stopPropagation();
    onToggleRead?.(bookmark);
  }

  return (
    <Pressable
      className={cn(
        "flex-row items-start gap-3 rounded-md border-2 border-transparent px-3 py-3 active:bg-muted",
        isSelected && "border-primary-accent bg-primary-accent/10 active:bg-primary-accent/10"
      )}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {isSelecting ? (
        <View className="mt-0.5 w-[22px] items-center justify-center">
          <View
            className={cn(
              "h-[22px] w-[22px] items-center justify-center rounded-[5px] border-2 border-border",
              isSelected && "border-primary bg-primary"
            )}
          >
            {isSelected ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
          </View>
        </View>
      ) : (
        <View className="mt-px h-[26px] w-[26px] items-center justify-center overflow-hidden rounded-sm bg-muted">
          <Image source={{ uri: faviconUrl }} className="h-[22px] w-[22px]" />
        </View>
      )}

      <View className="min-w-0 flex-1 gap-1">
        <Text
          className={cn(
            "text-[15px] font-semibold text-foreground",
            bookmark.doneReading && "font-medium text-muted-foreground"
          )}
          numberOfLines={2}
        >
          {bookmark.title || "Untitled"}
        </Text>
        <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
          {hostname}
        </Text>
        {bookmark.description ? (
          <Text className="text-xs leading-4 text-secondary-foreground" numberOfLines={2}>
            {bookmark.description}
          </Text>
        ) : null}
      </View>

      {!isSelecting && onToggleRead ? (
        <View className="ml-1 pt-0.5">
          <Pressable onPress={handleToggleRead} hitSlop={6} className="h-7 w-7 items-center justify-center rounded-full">
            <Ionicons
              name={bookmark.doneReading ? "checkmark-circle" : "checkmark-circle-outline"}
              size={20}
              color={bookmark.doneReading ? colors.success : colors.textMuted}
            />
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}
