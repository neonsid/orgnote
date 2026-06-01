import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { View } from "react-native";

import { showThemedAlert } from "@/lib/show-themed-alert";

import {
  Header,
  SearchBar,
  BookmarkList,
  MultiSelectToolbar,
  type BookmarkData,
} from "@/components/dashboard";
import type { BookmarkMenuAnchor } from "@/components/dashboard/bookmark-context-menu";
import {
  GroupSelectorModal,
  FilterModal,
  AddBookmarkModal,
  CreateGroupModal,
  EditGroupModal,
  DeleteGroupModal,
} from "@/components/dialogs";
import { Loading, EmptyState, ScreenShell } from "@/components/ui";
import { PersistGroupOnBackground } from "@/components/persist-group-on-background";
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

  if (!groups) {
    return <Loading message="Loading..." />;
  }

  return (
    <BookmarksContentWithGroups
      key={groups.length > 0 ? "groups-ready" : "groups-empty"}
      userId={userId}
      groups={groups}
    />
  );
}

function BookmarksContentWithGroups({
  userId,
  groups,
}: {
  userId: string | null | undefined;
  groups: Array<{ _id: Id<"groups">; title: string; color?: string }>;
}) {
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
  } = ui;
  const [contextMenuBookmark, setContextMenuBookmark] = useState<BookmarkData | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<BookmarkMenuAnchor | null>(null);
  const toggleRead = useMutation(api.bookmarks.mutations.toggleReadStatus);

  const selectedGroup =
    !groups || !effectiveGroupId
      ? null
      : (groups.find((g) => g._id === effectiveGroupId) ?? null);

  const { results: bookmarks, status, loadMore } = usePaginatedQuery(
    api.bookmarks.queries.listBookmarksForGroupPaginated,
    userId && effectiveGroupId && groupPreferenceRestored
      ? { groupId: effectiveGroupId }
      : "skip",
    { initialNumItems: 20 }
  );

  let filteredBookmarks = bookmarks ?? [];
  if (filter === "read") {
    filteredBookmarks = filteredBookmarks.filter((b) => b.doneReading);
  } else if (filter === "unread") {
    filteredBookmarks = filteredBookmarks.filter((b) => !b.doneReading);
  }
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredBookmarks = filteredBookmarks.filter(
      (b) =>
        b.title?.toLowerCase().includes(query) ||
        b.url.toLowerCase().includes(query)
    );
  }

  const bookmarkIds = filteredBookmarks.map((b) => b._id);

  const {
    selectedIds,
    selectedCount,
    multiSelectMode,
    isSelected,
    toggleSelection,
    toggleSelectAllVisible,
    allVisibleSelected,
    enterMultiSelect,
    exitMultiSelect,
  } = useBookmarkSelection(bookmarkIds);

  const selectedBookmarks = filteredBookmarks.filter((b) =>
    selectedIds.includes(b._id)
  );

  function handleLoadMore() {
    if (status === "CanLoadMore") {
      loadMore(20);
    }
  }

  function handleOpenContextMenu(
    bookmark: BookmarkData,
    anchor: BookmarkMenuAnchor
  ) {
    setContextMenuBookmark(bookmark);
    setContextMenuAnchor(anchor);
  }

  function handleCloseContextMenu() {
    setContextMenuBookmark(null);
    setContextMenuAnchor(null);
  }

  function handleEnterMultiSelect(bookmarkId: Id<"bookmarks">) {
    handleCloseContextMenu();
    enterMultiSelect(bookmarkId);
  }

  function handleBookmarkPress(bookmark: BookmarkData) {
    if (multiSelectMode) {
      toggleSelection(bookmark._id);
    } else {
      void openInAppBrowser(bookmark.url, bookmark.title);
    }
  }

  async function handleToggleRead(bookmark: BookmarkData) {
    try {
      await toggleRead({ bookmarkId: bookmark._id });
    } catch {
      showThemedAlert(
        "Error",
        bookmark.doneReading
          ? "Failed to mark bookmark as unread"
          : "Failed to mark bookmark as read"
      );
    }
  }

  function onGroupCreated(id: Id<"groups">) {
    setSelectedGroupId(id);
  }

  if (groups.length === 0) {
    return (
      <>
        <EmptyState
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

  const contextMenuOpen = contextMenuBookmark !== null;

  return (
    <View className="flex-1">
      {userId && effectiveGroupId && groupPreferenceRestored ? (
        <PersistGroupOnBackground
          key={`${userId}-${effectiveGroupId}`}
          userId={userId}
          groupId={effectiveGroupId}
        />
      ) : null}
      <Header
        selectedGroup={selectedGroup}
        onOpenGroupSelector={() => dispatchUi({ type: "setShowGroupSelector", open: true })}
      />
      {!multiSelectMode ? (
        <SearchBar
          value={searchQuery}
          onChangeText={(q) => dispatchUi({ type: "setSearchQuery", query: q })}
          filter={filter}
          onOpenFilter={() => dispatchUi({ type: "setShowFilter", open: true })}
          onOpenAdd={() => dispatchUi({ type: "setShowAddBookmark", open: true })}
        />
      ) : null}

      <BookmarkList
        bookmarks={filteredBookmarks}
        loading={!groupPreferenceRestored || status === "LoadingFirstPage"}
        loadingMore={status === "LoadingMore"}
        onLoadMore={handleLoadMore}
        onBookmarkPress={handleBookmarkPress}
        onToggleRead={handleToggleRead}
        emptyMessage={emptyMessage}
        multiSelectMode={multiSelectMode}
        isSelected={isSelected}
        onToggleMultiSelect={(bookmark) => toggleSelection(bookmark._id)}
        scrollEnabled={!contextMenuOpen}
        groups={groups}
        currentGroupId={effectiveGroupId}
        contextMenuBookmark={contextMenuBookmark}
        contextMenuAnchor={contextMenuAnchor}
        onOpenContextMenu={handleOpenContextMenu}
        onCloseContextMenu={handleCloseContextMenu}
        onEnterMultiSelect={handleEnterMultiSelect}
      />

      {multiSelectMode ? (
        <MultiSelectToolbar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          selectedBookmarks={selectedBookmarks}
          groupTitle={selectedGroup?.title ?? "Collection"}
          groups={groups}
          currentGroupId={effectiveGroupId}
          allVisibleSelected={allVisibleSelected}
          onClearSelection={exitMultiSelect}
          onToggleSelectAllVisible={toggleSelectAllVisible}
        />
      ) : null}

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
        groupTitle={selectedGroup?.title}
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
    </View>
  );
}

export default function BookmarksScreen() {
  const { isLoaded: clerkLoaded, isSignedIn, userId } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  if (!clerkLoaded) {
    return (
      <ScreenShell>
        <Loading message="Loading..." />
      </ScreenShell>
    );
  }

  if (!isSignedIn) {
    return <ScreenShell />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <ScreenShell>
        <Loading message="Connecting..." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <BookmarksContent key={userId ?? "unknown-user"} />
    </ScreenShell>
  );
}
