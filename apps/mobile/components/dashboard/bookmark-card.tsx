import { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, View, type GestureResponderEvent } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
import { bookmarkIconUrl, getHostname } from "@/lib/utils";
import { FALLBACK_COLORS } from "@goldfish/shared";
import type { BookmarkMenuAnchor } from "./bookmark-context-menu";
import type { Id } from "../../../../convex/_generated/dataModel";

const ICON_SIZE = 24;

export interface BookmarkData {
  _id: Id<"bookmarks">;
  title: string;
  url: string;
  imageUrl?: string;
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

function BookmarkIcon({ bookmark }: { bookmark: BookmarkData }) {
  const iconUrl = bookmarkIconUrl(bookmark.url, bookmark.imageUrl);
  const [imgError, setImgError] = useState(false);
  const fallbackColor =
    FALLBACK_COLORS[(bookmark.title || bookmark.url || "?").charCodeAt(0) % FALLBACK_COLORS.length];
  const letter = (bookmark.title || bookmark.url || "?").charAt(0).toUpperCase();

  if (!iconUrl || imgError) {
    return (
      <View
        className="items-center justify-center rounded-md"
        style={{ width: ICON_SIZE, height: ICON_SIZE, backgroundColor: fallbackColor }}
      >
        <Text className="font-sans text-xs font-bold text-white">{letter}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: iconUrl }}
      style={{ width: ICON_SIZE, height: ICON_SIZE }}
      contentFit="contain"
      recyclingKey={iconUrl}
      onError={() => setImgError(true)}
    />
  );
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
        <View className="mt-px size-9 items-center justify-center overflow-hidden rounded-lg bg-muted">
          <BookmarkIcon bookmark={bookmark} />
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
            className="size-8 items-center justify-center rounded-full"
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
