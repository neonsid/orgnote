import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View, type GestureResponderEvent } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
import { getHostname } from "@/lib/utils";
import type { BookmarkMenuAnchor } from "./bookmark-context-menu";
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
  onLongPress: (anchor: BookmarkMenuAnchor) => void;
  onToggleRead?: (bookmark: BookmarkData) => void;
  multiSelectMode?: boolean;
  isSelected?: boolean;
}

export function BookmarkCard({
  bookmark,
  onPress,
  onLongPress,
  onToggleRead,
  multiSelectMode = false,
  isSelected = false,
}: BookmarkCardProps) {
  const { colors } = useAppTheme();
  const rowRef = useRef<View>(null);
  const hostname = getHostname(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  function handleToggleRead(event: GestureResponderEvent) {
    event.stopPropagation();
    onToggleRead?.(bookmark);
  }

  function handleLongPress() {
    rowRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress({ x, y, width, height });
    });
  }

  return (
    <View ref={rowRef} collapsable={false}>
      <AppPressable
        className={cn(
          "flex-row items-start gap-3 px-4 py-3.5",
          isSelected && "bg-selection"
        )}
        onPress={onPress}
        onLongPress={handleLongPress}
      >
      {multiSelectMode ? (
        <View className="mt-0.5 w-[22px] items-center justify-center">
          <View
            className={cn(
              "h-[22px] w-[22px] items-center justify-center rounded-md border-2 border-border",
              isSelected && "border-primary-accent bg-primary-accent"
            )}
          >
            {isSelected ? (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            ) : null}
          </View>
        </View>
      ) : (
        <View className="mt-px h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-muted">
          <Image source={{ uri: faviconUrl }} className="h-6 w-6" />
        </View>
      )}

      <View className="min-w-0 flex-1 gap-1">
        <Text
          className={cn(
            "font-sans text-[15px] font-semibold leading-5 text-foreground",
            bookmark.doneReading && "font-medium text-muted-foreground"
          )}
          numberOfLines={2}
        >
          {bookmark.title || "Untitled"}
        </Text>
        <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={1}>
          {hostname}
        </Text>
        {bookmark.description ? (
          <Text className="font-sans text-[13px] leading-[18px] text-muted-foreground" numberOfLines={2}>
            {bookmark.description}
          </Text>
        ) : null}
      </View>

      {!multiSelectMode && onToggleRead ? (
        <View className="ml-1 pt-0.5">
          <AppPressable
            onPress={handleToggleRead}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full"
          >
            <Ionicons
              name={bookmark.doneReading ? "checkmark-circle" : "checkmark-circle-outline"}
              size={22}
              color={bookmark.doneReading ? colors.success : colors.textMuted}
            />
          </AppPressable>
        </View>
      ) : null}
      </AppPressable>
    </View>
  );
}
