import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showThemedAlert } from "@/contexts/themed-alert";

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
  EditGroupModal,
  DeleteGroupModal,
  BookmarkActionsModal,
  EditBookmarkModal,
} from "@/components/dialogs";
import { Loading, EmptyState } from "@/components/ui";
import {
  useBookmarkSelection,
  useBookmarksTabUiReducer,
  usePersistedSelectedGroupId,
} from "@/hooks";
import { openInAppBrowser } from "@/lib/open-in-app-browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function BookmarksContent() {
  const { userId } = useAuth();
  const groups = useQuery(api.groups.queries.list);
  const {
    selectedGroupId,
    setSelectedGroupId,
    groupPreferenceRestored,
    effectiveGroupId,
  } = usePersistedSelectedGroupId(userId, groups);
  const [ui, dispatchUi] = useBookmarksTabUiReducer();
  const {
    searchQuery,
    filter,
    showGroupSelector,
    showFilter,
    showAddBookmark,
    showCreateGroup,
    showEditGroup,
    showDeleteGroup,
    selectedBookmark,
    toolbarEditBookmark,
  } = ui;
  const toggleRead = useMutation(api.bookmarks.mutations.toggleReadStatus);

  const selectedGroup = useMemo(() => {
    if (!groups || !effectiveGroupId) return null;
    return groups.find((g) => g._id === effectiveGroupId) ?? null;
  }, [groups, effectiveGroupId]);

  const { results: bookmarks, status, loadMore } = usePaginatedQuery(
    api.bookmarks.queries.listBookmarksForGroupPaginated,
    userId && effectiveGroupId && groupPreferenceRestored
      ? { groupId: effectiveGroupId }
      : "skip",
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
        void openInAppBrowser(bookmark.url, bookmark.title);
      }
    },
    [isSelecting, toggleSelection]
  );

  const handleBookmarkLongPress = useCallback(
    (bookmark: BookmarkData) => {
      if (isSelecting) {
        toggleSelection(bookmark._id);
      } else {
        dispatchUi({ type: "setSelectedBookmark", bookmark });
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

  const handleToggleRead = useCallback(
    async (bookmark: BookmarkData) => {
      try {
        await toggleRead({ bookmarkId: bookmark._id });
      } catch {
        showThemedAlert(
          "Error",
          bookmark.doneReading ? "Failed to mark bookmark as unread" : "Failed to mark bookmark as read"
        );
      }
    },
    [toggleRead]
  );

  const onGroupCreated = useCallback((id: Id<"groups">) => {
    setSelectedGroupId(id);
  }, [setSelectedGroupId]);

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
          onAction={() => dispatchUi({ type: "setShowCreateGroup", open: true })}
        />
        <CreateGroupModal
          visible={showCreateGroup}
          onClose={() => dispatchUi({ type: "setShowCreateGroup", open: false })}
          onCreated={onGroupCreated}
        />
      </>
    );
  }

  const emptyMessage =
    searchQuery || filter !== "all"
      ? "No bookmarks match your filters"
      : "No bookmarks in this collection";

  return (
    <View className="flex-1">
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
              ? () =>
                  dispatchUi({ type: "setToolbarEditBookmark", bookmark: selectedBookmarks[0] })
              : undefined
          }
        />
      ) : (
        <>
          <Header
            selectedGroup={selectedGroup}
            onOpenGroupSelector={() => dispatchUi({ type: "setShowGroupSelector", open: true })}
          />
          <SearchBar
            value={searchQuery}
            onChangeText={(q) => dispatchUi({ type: "setSearchQuery", query: q })}
            filter={filter}
            onOpenFilter={() => dispatchUi({ type: "setShowFilter", open: true })}
            onOpenAdd={() => dispatchUi({ type: "setShowAddBookmark", open: true })}
          />
        </>
      )}

      <BookmarkList
        bookmarks={filteredBookmarks}
        loading={!groupPreferenceRestored || status === "LoadingFirstPage"}
        loadingMore={status === "LoadingMore"}
        onLoadMore={handleLoadMore}
        onBookmarkPress={handleBookmarkPress}
        onBookmarkLongPress={isSelecting ? handleBookmarkLongPress : startSelection}
        onToggleRead={handleToggleRead}
        emptyMessage={emptyMessage}
        isSelecting={isSelecting}
        isSelected={isSelected}
      />

      <GroupSelectorModal
        visible={showGroupSelector}
        onClose={() => dispatchUi({ type: "setShowGroupSelector", open: false })}
        groups={groups}
        selectedGroupId={effectiveGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={() => dispatchUi({ type: "groupSelectorToCreate" })}
        onRenameGroup={() => dispatchUi({ type: "groupSelectorToEdit" })}
        onDeleteGroup={() => dispatchUi({ type: "groupSelectorToDelete" })}
      />

      <FilterModal
        visible={showFilter}
        onClose={() => dispatchUi({ type: "setShowFilter", open: false })}
        value={filter}
        onChange={(f) => dispatchUi({ type: "setFilter", filter: f })}
      />

      <AddBookmarkModal
        visible={showAddBookmark}
        onClose={() => dispatchUi({ type: "setShowAddBookmark", open: false })}
        groupId={effectiveGroupId}
      />

      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => dispatchUi({ type: "setShowCreateGroup", open: false })}
        onCreated={onGroupCreated}
      />

      <EditGroupModal
        visible={showEditGroup}
        onClose={() => dispatchUi({ type: "setShowEditGroup", open: false })}
        group={selectedGroup}
      />

      <DeleteGroupModal
        visible={showDeleteGroup}
        onClose={() => dispatchUi({ type: "setShowDeleteGroup", open: false })}
        group={selectedGroup}
        onDeleted={(deletedId) => {
          if (selectedGroupId === deletedId) {
            setSelectedGroupId(null);
          }
        }}
      />

      <BookmarkActionsModal
        visible={!!selectedBookmark && !isSelecting}
        onClose={() => dispatchUi({ type: "setSelectedBookmark", bookmark: null })}
        bookmark={selectedBookmark}
        groups={groups}
        currentGroupId={effectiveGroupId}
        onSelectMultiple={() => {
          if (selectedBookmark) {
            toggleSelection(selectedBookmark._id);
            dispatchUi({ type: "setSelectedBookmark", bookmark: null });
          }
        }}
      />

      <EditBookmarkModal
        visible={!!toolbarEditBookmark}
        onClose={() => dispatchUi({ type: "setToolbarEditBookmark", bookmark: null })}
        onSaved={() => {
          dispatchUi({ type: "setToolbarEditBookmark", bookmark: null });
          clearSelection();
        }}
        bookmark={toolbarEditBookmark}
      />
    </View>
  );
}

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded: clerkLoaded, isSignedIn, userId } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  if (!clerkLoaded) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Loading message="Loading..." />
      </View>
    );
  }

  if (!isSignedIn) {
    return <View className="flex-1 bg-background" style={{ paddingTop: insets.top }} />;
  }

  /** Avoid “sign in” flash: Clerk is signed in but Convex auth may lag one frame. */
  if (convexLoading || !isAuthenticated) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Loading message="Connecting..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <BookmarksContent key={userId ?? "unknown-user"} />
    </View>
  );
}
