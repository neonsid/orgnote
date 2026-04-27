import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme";
import type { AppColors } from "@/lib/theme-colors";
import { borderRadius, spacing } from "@/lib/constants";
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

  const styles = useMemo(() => makeListStyles(colors), [colors]);

  const bottomPad = insets.bottom + 88;

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerSection}>
        <View style={styles.headerLabels}>
          <Text style={styles.headerLabel}>Title</Text>
          <Text style={styles.headerLabel}>Domain</Text>
        </View>
        <View style={styles.divider} />
      </View>
    ),
    [styles]
  );

  const SkeletonList = useMemo(
    () => (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonDomain} />
            </View>
          </View>
        ))}
      </View>
    ),
    [styles]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {ListHeader}
        {SkeletonList}
      </View>
    );
  }

  return (
    <FlatList
      data={bookmarks}
      keyExtractor={(item) => item._id}
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No bookmarks found</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <BookmarkCard
          bookmark={item}
          onPress={() => onBookmarkPress(item)}
          onLongPress={() => onBookmarkLongPress(item)}
          onToggleRead={onToggleRead}
          isSelecting={isSelecting}
          isSelected={isSelected?.(item._id)}
        />
      )}
    />
  );
}

function makeListStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.md,
    },
    headerSection: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    headerLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.text,
      opacity: 0.12,
      marginHorizontal: spacing.sm,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 48,
      gap: spacing.xs,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
    },
    loadingMore: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
    skeletonContainer: {
      paddingHorizontal: spacing.md,
    },
    skeletonRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    skeletonIcon: {
      width: 20,
      height: 20,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.muted,
    },
    skeletonContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    skeletonTitle: {
      width: 120,
      height: 14,
      borderRadius: 4,
      backgroundColor: colors.muted,
    },
    skeletonDomain: {
      width: 80,
      height: 12,
      borderRadius: 4,
      backgroundColor: colors.muted,
    },
  });
}
