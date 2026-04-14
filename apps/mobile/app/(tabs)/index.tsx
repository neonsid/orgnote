import { useAuth } from "@clerk/expo";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme";

import {
  Header,
  SearchBar,
  BookmarkList,
  MultiSelectToolbar,
  type BookmarkData,
} from "@/components/dashboard";
import {
  GroupSelectorModal,
  FilterModal,
  AddBookmarkModal,
  CreateGroupModal,
  BookmarkActionsModal,
  EditBookmarkModal,
  type FilterType,
} from "@/components/dialogs";
import { Loading, EmptyState } from "@/components/ui";
import { useBookmarkSelection } from "@/hooks";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function BookmarksContent() {
  const groups = useQuery(api.groups.queries.list);
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkData | null>(null);
  const [toolbarEditBookmark, setToolbarEditBookmark] = useState<BookmarkData | null>(null);

  const effectiveGroupId = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    if (selectedGroupId && groups.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groups[0]._id;
  }, [groups, selectedGroupId]);

  const selectedGroup = useMemo(() => {
    if (!groups || !effectiveGroupId) return null;
    return groups.find((g) => g._id === effectiveGroupId) ?? null;
  }, [groups, effectiveGroupId]);

  const { results: bookmarks, status, loadMore } = usePaginatedQuery(
    api.bookmarks.queries.listBookmarksForGroupPaginated,
    effectiveGroupId ? { groupId: effectiveGroupId } : "skip",
    { initialNumItems: 20 }
  );

  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];

    let filtered = bookmarks;

    if (filter === "read") {
      filtered = filtered.filter((b) => b.doneReading);
    } else if (filter === "unread") {
      filtered = filtered.filter((b) => !b.doneReading);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title?.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [bookmarks, filter, searchQuery]);

  const bookmarkIds = useMemo(
    () => filteredBookmarks.map((b) => b._id),
    [filteredBookmarks]
  );

  const {
    selectedIds,
    selectedCount,
    isSelecting,
    isSelected,
    toggleSelection,
    toggleSelectAllVisible,
    allVisibleSelected,
    clearSelection,
  } = useBookmarkSelection(bookmarkIds);

  const selectedBookmarks = useMemo(
    () => filteredBookmarks.filter((b) => selectedIds.includes(b._id)),
    [filteredBookmarks, selectedIds]
  );

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(20);
    }
  }, [status, loadMore]);

  const handleBookmarkPress = useCallback(
    (bookmark: BookmarkData) => {
      if (isSelecting) {
        toggleSelection(bookmark._id);
      } else {
        Linking.openURL(bookmark.url);
      }
    },
    [isSelecting, toggleSelection]
  );

  const handleBookmarkLongPress = useCallback(
    (bookmark: BookmarkData) => {
      if (isSelecting) {
        toggleSelection(bookmark._id);
      } else {
        setSelectedBookmark(bookmark);
      }
    },
    [isSelecting, toggleSelection]
  );

  const startSelection = useCallback(
    (bookmark: BookmarkData) => {
      toggleSelection(bookmark._id);
    },
    [toggleSelection]
  );

  if (!groups) {
    return <Loading message="Loading..." />;
  }

  if (groups.length === 0) {
    return (
      <>
        <EmptyState
          icon="folder-open-outline"
          title="No collections yet"
          description="Create your first collection to start saving bookmarks."
          actionLabel="Create Collection"
          onAction={() => setShowCreateGroup(true)}
        />
        <CreateGroupModal
          visible={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      </>
    );
  }

  const emptyMessage =
    searchQuery || filter !== "all"
      ? "No bookmarks match your filters"
      : "No bookmarks in this collection";

  return (
    <View style={{ flex: 1 }}>
      {isSelecting ? (
        <MultiSelectToolbar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          selectedBookmarks={selectedBookmarks}
          groupTitle={selectedGroup?.title ?? "Collection"}
          groups={groups}
          currentGroupId={effectiveGroupId}
          allVisibleSelected={allVisibleSelected}
          onClearSelection={clearSelection}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          onEditSingle={
            selectedCount === 1 && selectedBookmarks[0]
              ? () => setToolbarEditBookmark(selectedBookmarks[0])
              : undefined
          }
        />
      ) : (
        <>
          <Header
            selectedGroup={selectedGroup}
            onOpenGroupSelector={() => setShowGroupSelector(true)}
          />
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            filter={filter}
            onOpenFilter={() => setShowFilter(true)}
            onOpenAdd={() => setShowAddBookmark(true)}
          />
        </>
      )}

      <BookmarkList
        bookmarks={filteredBookmarks}
        loading={status === "LoadingFirstPage"}
        loadingMore={status === "LoadingMore"}
        onLoadMore={handleLoadMore}
        onBookmarkPress={handleBookmarkPress}
        onBookmarkLongPress={isSelecting ? handleBookmarkLongPress : startSelection}
        emptyMessage={emptyMessage}
        isSelecting={isSelecting}
        isSelected={isSelected}
      />

      <GroupSelectorModal
        visible={showGroupSelector}
        onClose={() => setShowGroupSelector(false)}
        groups={groups}
        selectedGroupId={effectiveGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={() => {
          setShowGroupSelector(false);
          setShowCreateGroup(true);
        }}
      />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        value={filter}
        onChange={setFilter}
      />

      <AddBookmarkModal
        visible={showAddBookmark}
        onClose={() => setShowAddBookmark(false)}
        groupId={effectiveGroupId}
      />

      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      <BookmarkActionsModal
        visible={!!selectedBookmark && !isSelecting}
        onClose={() => setSelectedBookmark(null)}
        bookmark={selectedBookmark}
        groups={groups}
        currentGroupId={effectiveGroupId}
        onSelectMultiple={() => {
          if (selectedBookmark) {
            toggleSelection(selectedBookmark._id);
            setSelectedBookmark(null);
          }
        }}
      />

      <EditBookmarkModal
        visible={!!toolbarEditBookmark}
        onClose={() => setToolbarEditBookmark(null)}
        onSaved={() => {
          setToolbarEditBookmark(null);
          clearSelection();
        }}
        bookmark={toolbarEditBookmark}
      />
    </View>
  );
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors]
  );

  if (!clerkLoaded) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Loading message="Loading..." />
      </View>
    );
  }

  if (!isSignedIn) {
    return <View style={[styles.screen, { paddingTop: insets.top }]} />;
  }

  /** Avoid “sign in” flash: Clerk is signed in but Convex auth may lag one frame. */
  if (convexLoading || !isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Loading message="Connecting..." />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BookmarksContent />
    </View>
  );
}
