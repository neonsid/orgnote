import { create } from "zustand";

interface DialogState {
  // Rename bookmark dialog
  renameBookmark: {
    open: boolean;
    bookmarkId: string | null;
  };

  // Delete bookmark dialog
  deleteBookmark: {
    open: boolean;
    bookmarkId: string | null;
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
  openRenameDialog: (bookmarkId: string) => void;
  closeRenameDialog: () => void;

  openDeleteBookmarkDialog: (bookmarkId: string) => void;
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
  renameBookmark: { open: false, bookmarkId: null },
  deleteBookmark: { open: false, bookmarkId: null },
  deleteGroup: { open: false, groupId: null },
  userSettings: { open: false, activeTab: "general" },
  exportBookmarks: { open: false },
  createGroup: { open: false },

  // Rename bookmark actions
  openRenameDialog: (bookmarkId: string) =>
    set({ renameBookmark: { open: true, bookmarkId } }),
  closeRenameDialog: () =>
    set({ renameBookmark: { open: false, bookmarkId: null } }),

  // Delete bookmark actions
  openDeleteBookmarkDialog: (bookmarkId: string) =>
    set({ deleteBookmark: { open: true, bookmarkId } }),
  closeDeleteBookmarkDialog: () =>
    set({ deleteBookmark: { open: false, bookmarkId: null } }),

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
