import { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View, type ListRenderItemInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme";
import { BookmarkCard, type BookmarkData } from "./bookmark-card";
import type { Id } from "../../../../convex/_generated/dataModel";

interface BookmarkListProps {
  bookmarks: BookmarkData[];
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onBookmarkPress: (bookmark: BookmarkData) => void;
  onBookmarkLongPress: (bookmark: BookmarkData) => void;
  onToggleRead?: (bookmark: BookmarkData) => void;
  emptyMessage?: string;
  isSelecting?: boolean;
  isSelected?: (id: Id<"bookmarks">) => boolean;
}

function ListHeader() {
  return (
    <View className="mb-2 px-3">
      <View className="flex-row justify-between px-3 py-2">
        <Text className="text-[13px] font-medium text-muted-foreground">Title</Text>
        <Text className="text-[13px] font-medium text-muted-foreground">Domain</Text>
      </View>
      <View className="mx-2 h-px bg-foreground/10" />
    </View>
  );
}

function SkeletonList() {
  return (
    <View className="px-3">
      {(["s-a", "s-b", "s-c", "s-d", "s-e"] as const).map((rowKey) => (
        <View key={rowKey} className="flex-row items-center gap-3 p-3">
          <View className="h-5 w-5 rounded-sm bg-muted" />
          <View className="flex-1 flex-row items-center gap-2">
            <View className="h-3.5 w-[120px] rounded bg-muted" />
            <View className="h-3 w-20 rounded bg-muted" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function BookmarkList({
  bookmarks,
  loading,
  loadingMore,
  onLoadMore,
  onBookmarkPress,
  onBookmarkLongPress,
  onToggleRead,
  emptyMessage = "No bookmarks",
  isSelecting = false,
  isSelected,
}: BookmarkListProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + 88;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BookmarkData>) => (
      <BookmarkCard
        bookmark={item}
        onPress={() => onBookmarkPress(item)}
        onLongPress={() => onBookmarkLongPress(item)}
        onToggleRead={onToggleRead}
        isSelecting={isSelecting}
        isSelected={isSelected?.(item._id)}
      />
    ),
    [onBookmarkPress, onBookmarkLongPress, onToggleRead, isSelecting, isSelected]
  );

  if (loading) {
    return (
      <View className="flex-1">
        <ListHeader />
        <SkeletonList />
      </View>
    );
  }

  return (
    <FlatList
      data={bookmarks}
      keyExtractor={(item) => item._id}
      className="flex-1"
      contentContainerClassName="px-3"
      contentInset={{ bottom: bottomInset }}
      scrollIndicatorInsets={{ bottom: bottomInset }}
      showsVerticalScrollIndicator={false}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View className="items-center gap-1 py-12">
          <Text className="text-sm font-medium text-secondary-foreground">No bookmarks found</Text>
          <Text className="text-center text-xs text-muted-foreground">{emptyMessage}</Text>
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <View className="items-center py-5">
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        ) : null
      }
      renderItem={renderItem}
    />
  );
}
