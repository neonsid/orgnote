import { create } from "zustand";

interface BookmarkData {
  id: string;
  title: string;
  url: string;
}

interface EditBookmarkData {
  id: string;
  title: string;
  url: string;
  description?: string;
}

interface DialogState {
  // Rename bookmark dialog
  renameBookmark: {
    open: boolean;
    bookmarkId: string | null;
    bookmarkData: BookmarkData | null;
  };

  // Edit bookmark dialog
  editBookmark: {
    open: boolean;
    bookmarkId: string | null;
    bookmarkData: EditBookmarkData | null;
  };

  // Delete bookmark dialog
  deleteBookmark: {
    open: boolean;
    bookmarkId: string | null;
    bookmarkData: BookmarkData | null;
  };

  // Delete group dialog
  deleteGroup: {
    open: boolean;
    groupId: string | null;
  };

  // User settings dialog
  userSettings: {
    open: boolean;
    activeTab: "general" | "public-profile";
  };

  // Export bookmarks dialog
  exportBookmarks: {
    open: boolean;
  };

  // Create group dialog
  createGroup: {
    open: boolean;
  };

  // Actions
  openRenameDialog: (bookmarkId: string, bookmarkData: BookmarkData) => void;
  closeRenameDialog: () => void;

  openEditBookmarkDialog: (
    bookmarkId: string,
    bookmarkData: EditBookmarkData,
  ) => void;
  closeEditBookmarkDialog: () => void;

  openDeleteBookmarkDialog: (
    bookmarkId: string,
    bookmarkData: BookmarkData,
  ) => void;
  closeDeleteBookmarkDialog: () => void;

  openDeleteGroupDialog: (groupId: string) => void;
  closeDeleteGroupDialog: () => void;

  openUserSettings: (tab?: "general" | "public-profile") => void;
  closeUserSettings: () => void;
  setUserSettingsTab: (tab: "general" | "public-profile") => void;

  openExportBookmarks: () => void;
  closeExportBookmarks: () => void;

  openCreateGroup: () => void;
  closeCreateGroup: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  // Initial states
  renameBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  editBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  deleteBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  deleteGroup: { open: false, groupId: null },
  userSettings: { open: false, activeTab: "general" },
  exportBookmarks: { open: false },
  createGroup: { open: false },

  // Rename bookmark actions
  openRenameDialog: (bookmarkId: string, bookmarkData: BookmarkData) =>
    set({ renameBookmark: { open: true, bookmarkId, bookmarkData } }),
  closeRenameDialog: () =>
    set({
      renameBookmark: { open: false, bookmarkId: null, bookmarkData: null },
    }),

  // Edit bookmark actions
  openEditBookmarkDialog: (
    bookmarkId: string,
    bookmarkData: EditBookmarkData,
  ) => set({ editBookmark: { open: true, bookmarkId, bookmarkData } }),
  closeEditBookmarkDialog: () =>
    set({
      editBookmark: { open: false, bookmarkId: null, bookmarkData: null },
    }),

  // Delete bookmark actions
  openDeleteBookmarkDialog: (bookmarkId: string, bookmarkData: BookmarkData) =>
    set({ deleteBookmark: { open: true, bookmarkId, bookmarkData } }),
  closeDeleteBookmarkDialog: () =>
    set({
      deleteBookmark: { open: false, bookmarkId: null, bookmarkData: null },
    }),

  // Delete group actions
  openDeleteGroupDialog: (groupId: string) =>
    set({ deleteGroup: { open: true, groupId } }),
  closeDeleteGroupDialog: () =>
    set({ deleteGroup: { open: false, groupId: null } }),

  // User settings actions
  openUserSettings: (tab = "general") =>
    set({ userSettings: { open: true, activeTab: tab } }),
  closeUserSettings: () =>
    set({ userSettings: { open: false, activeTab: "general" } }),
  setUserSettingsTab: (tab) =>
    set((state) => ({
      userSettings: { ...state.userSettings, activeTab: tab },
    })),

  // Export bookmarks actions
  openExportBookmarks: () => set({ exportBookmarks: { open: true } }),
  closeExportBookmarks: () => set({ exportBookmarks: { open: false } }),

  // Create group actions
  openCreateGroup: () => set({ createGroup: { open: true } }),
  closeCreateGroup: () => set({ createGroup: { open: false } }),
}));
