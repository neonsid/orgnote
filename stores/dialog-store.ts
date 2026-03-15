import { Id } from '@/convex/_generated/dataModel'
import { create } from 'zustand'

interface BookmarkData {
  id: string
  title: string
  url: string
}

// TODO: Make all string Id to convexIDs

interface EditBookmarkData {
  id: string
  title: string
  url: string
  description?: string
}

interface DialogState {
  // Rename bookmark dialog
  renameBookmark: {
    open: boolean
    bookmarkId: string | null
    bookmarkData: BookmarkData | null
  }

  // Edit bookmark dialog
  editBookmark: {
    open: boolean
    bookmarkId: string | null
    bookmarkData: EditBookmarkData | null
  }

  editGroup: {
    open: boolean
    groupId: string | null
  }
  // Delete bookmark dialog
  deleteBookmarkOrItem: {
    open: boolean
    bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'> | null
    title: string | null
  }

  // Delete group dialog
  deleteGroup: {
    open: boolean
    groupId: string | null
  }

  // User settings dialog
  userSettings: {
    open: boolean
    activeTab: 'general' | 'public-profile'
  }

  // Export bookmarks dialog
  exportBookmarks: {
    open: boolean
  }

  // Create group dialog
  createGroup: {
    open: boolean
  }

  // Delete vault file dialog
  deleteVaultFile: {
    open: boolean
    fileId: string | null
    fileName: string | null
  }

  // Actions
  openRenameDialog: (bookmarkId: string, bookmarkData: BookmarkData) => void
  openGroupRenameDialog: (groupId: string) => void
  closeGroupRenameDialog: () => void
  closeRenameDialog: () => void

  openEditBookmarkDialog: (
    bookmarkId: string,
    bookmarkData: EditBookmarkData
  ) => void
  closeEditBookmarkDialog: () => void

  openDeleteBookmarkDialog: (
    bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'>,
    title: string
  ) => void
  closeDeleteBookmarkDialog: () => void

  openDeleteGroupDialog: (groupId: string) => void
  closeDeleteGroupDialog: () => void

  openUserSettings: (tab?: 'general' | 'public-profile') => void
  closeUserSettings: () => void
  setUserSettingsTab: (tab: 'general' | 'public-profile') => void

  openExportBookmarks: () => void
  closeExportBookmarks: () => void

  openCreateGroup: () => void
  closeCreateGroup: () => void

  openDeleteVaultFileDialog: (fileId: string, fileName: string) => void
  closeDeleteVaultFileDialog: () => void
}

export const useDialogStore = create<DialogState>((set) => ({
  // Initial states
  renameBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  editBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  editGroup: { open: false, groupId: null, title: null },
  deleteBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  deleteGroup: { open: false, groupId: null },
  userSettings: { open: false, activeTab: 'general' },
  exportBookmarks: { open: false },
  createGroup: { open: false },
  deleteVaultFile: { open: false, fileId: null, fileName: null },
  deleteBookmarkOrItem: {
    open: false,
    bookmarkOrFileId: null as unknown as Id<'bookmarks'> | Id<'vaultFiles'>,
    title: null,
  },

  // Rename bookmark actions
  openRenameDialog: (bookmarkId: string, bookmarkData: BookmarkData) =>
    set({ renameBookmark: { open: true, bookmarkId, bookmarkData } }),
  openGroupRenameDialog: (groupId: string) =>
    set({ editGroup: { groupId: groupId, open: true } }),
  closeGroupRenameDialog: () =>
    set({ editGroup: { groupId: null, open: false } }),
  closeRenameDialog: () =>
    set({
      renameBookmark: { open: false, bookmarkId: null, bookmarkData: null },
    }),

  // Edit bookmark actions
  openEditBookmarkDialog: (
    bookmarkId: string,
    bookmarkData: EditBookmarkData
  ) => set({ editBookmark: { open: true, bookmarkId, bookmarkData } }),
  closeEditBookmarkDialog: () =>
    set({
      editBookmark: { open: false, bookmarkId: null, bookmarkData: null },
    }),

  // Delete bookmark actions
  openDeleteBookmarkDialog: (
    bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'>,
    title: string
  ) =>
    set({
      deleteBookmarkOrItem: {
        open: true,
        bookmarkOrFileId,
        title,
      },
    }),

  closeDeleteBookmarkDialog: () =>
    set({
      deleteBookmarkOrItem: {
        open: false,
        bookmarkOrFileId: null as unknown as Id<'bookmarks'> | Id<'vaultFiles'>, // or use undefined
        title: null,
      },
    }),
  // Delete group actions
  openDeleteGroupDialog: (groupId: string) =>
    set({ deleteGroup: { open: true, groupId } }),
  closeDeleteGroupDialog: () =>
    set({ deleteGroup: { open: false, groupId: null } }),

  // User settings actions
  openUserSettings: (tab = 'general') =>
    set({ userSettings: { open: true, activeTab: tab } }),
  closeUserSettings: () =>
    set({ userSettings: { open: false, activeTab: 'general' } }),
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

  // Delete vault file actions
  openDeleteVaultFileDialog: (fileId: string, fileName: string) =>
    set({ deleteVaultFile: { open: true, fileId, fileName } }),
  closeDeleteVaultFileDialog: () =>
    set({ deleteVaultFile: { open: false, fileId: null, fileName: null } }),
}))
