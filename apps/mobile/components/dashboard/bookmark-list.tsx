import { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View, type ListRenderItemInfo } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { useTabBarScrollPadding } from "@/hooks/use-tab-bar-height";
import { BookmarkCard, type BookmarkData } from "./bookmark-card";
import {
  BookmarkContextMenu,
  type BookmarkMenuAnchor,
} from "./bookmark-context-menu";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

interface BookmarkListProps {
  bookmarks: BookmarkData[];
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onBookmarkPress: (bookmark: BookmarkData) => void;
  onToggleRead?: (bookmark: BookmarkData) => void;
  emptyMessage?: string;
  multiSelectMode?: boolean;
  isSelected?: (id: Id<"bookmarks">) => boolean;
  onToggleMultiSelect?: (bookmark: BookmarkData) => void;
  scrollEnabled?: boolean;
  groups: Group[];
  currentGroupId: Id<"groups"> | null;
  contextMenuBookmark: BookmarkData | null;
  contextMenuAnchor: BookmarkMenuAnchor | null;
  onOpenContextMenu: (bookmark: BookmarkData, anchor: BookmarkMenuAnchor) => void;
  onCloseContextMenu: () => void;
  onEnterMultiSelect: (bookmarkId: Id<"bookmarks">) => void;
}

function ItemSeparator() {
  return <View className="mx-4 h-px bg-border" />;
}

function SkeletonList() {
  return (
    <View className="px-4">
      {(["s-a", "s-b", "s-c", "s-d", "s-e"] as const).map((rowKey) => (
        <View key={rowKey} className="flex-row items-center gap-3 py-3.5">
          <View className="h-9 w-9 rounded-lg bg-muted" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-[180px] rounded bg-muted" />
            <View className="h-3 w-24 rounded bg-muted" />
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
  onToggleRead,
  emptyMessage = "No bookmarks",
  multiSelectMode = false,
  isSelected,
  onToggleMultiSelect,
  scrollEnabled = true,
  groups,
  currentGroupId,
  contextMenuBookmark,
  contextMenuAnchor,
  onOpenContextMenu,
  onCloseContextMenu,
  onEnterMultiSelect,
}: BookmarkListProps) {
  const { colors } = useAppTheme();
  const bottomInset = useTabBarScrollPadding(multiSelectMode ? 120 : 24);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BookmarkData>) => (
      <BookmarkCard
        bookmark={item}
        onPress={() => onBookmarkPress(item)}
        onLongPress={(anchor) => {
          if (multiSelectMode) {
            onToggleMultiSelect?.(item);
            return;
          }
          onOpenContextMenu(item, anchor);
        }}
        onToggleRead={onToggleRead}
        multiSelectMode={multiSelectMode}
        isSelected={isSelected?.(item._id)}
      />
    ),
    [
      onBookmarkPress,
      multiSelectMode,
      onToggleMultiSelect,
      onOpenContextMenu,
      onToggleRead,
      isSelected,
    ]
  );

  if (loading) {
    return (
      <View className="flex-1">
        <SkeletonList />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item._id}
        className="flex-1"
        contentInset={{ bottom: bottomInset }}
        scrollIndicatorInsets={{ bottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          <View className="items-center gap-2 px-8 py-16">
            <Text className="font-sans text-base font-semibold text-foreground">No bookmarks found</Text>
            <Text className="text-center font-sans text-sm leading-5 text-muted-foreground">
              {emptyMessage}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-6">
              <ActivityIndicator size="small" color={colors.primaryAccent} />
            </View>
          ) : null
        }
        renderItem={renderItem}
      />

      <BookmarkContextMenu
        bookmark={contextMenuBookmark}
        anchor={contextMenuAnchor}
        groups={groups}
        currentGroupId={currentGroupId}
        onClose={onCloseContextMenu}
        onEnterMultiSelect={onEnterMultiSelect}
      />
    </>
  );
}
