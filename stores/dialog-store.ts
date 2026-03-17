import { Id } from '@/convex/_generated/dataModel'
import { create } from 'zustand'

interface EditBookmarkData {
  id: Id<'bookmarks'>
  title: string
  url: string
  description?: string
}

interface DialogState {
  // Edit bookmark dialog
  editBookmark: {
    open: boolean
    bookmarkId: Id<'bookmarks'> | null
    bookmarkData: EditBookmarkData | null
  }

  editGroup: {
    open: boolean
    groupId: Id<'groups'> | null
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
    groupId: Id<'groups'> | null
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
    fileId: Id<'vaultFiles'> | null
    fileName: string | null
  }

  // Actions
  openGroupRenameDialog: (groupId: Id<'groups'>) => void
  closeGroupRenameDialog: () => void

  openEditBookmarkDialog: (
    bookmarkId: Id<'bookmarks'>,
    bookmarkData: EditBookmarkData
  ) => void
  closeEditBookmarkDialog: () => void

  openDeleteBookmarkDialog: (
    bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'>,
    title: string
  ) => void
  closeDeleteBookmarkDialog: () => void

  openDeleteGroupDialog: (groupId: Id<'groups'>) => void
  closeDeleteGroupDialog: () => void

  openUserSettings: (tab?: 'general' | 'public-profile') => void
  closeUserSettings: () => void
  setUserSettingsTab: (tab: 'general' | 'public-profile') => void

  openExportBookmarks: () => void
  closeExportBookmarks: () => void

  openCreateGroup: () => void
  closeCreateGroup: () => void

  openDeleteVaultFileDialog: (
    fileId: Id<'vaultFiles'>,
    fileName: string
  ) => void
  closeDeleteVaultFileDialog: () => void
}

export const useDialogStore = create<DialogState>((set) => ({
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
    bookmarkOrFileId: null,
    title: null,
  },

  // Rename bookmark actions
  openGroupRenameDialog: (groupId: Id<'groups'>) =>
    set({ editGroup: { groupId: groupId, open: true } }),
  closeGroupRenameDialog: () =>
    set({ editGroup: { groupId: null, open: false } }),

  // Edit bookmark actions
  openEditBookmarkDialog: (
    bookmarkId: Id<'bookmarks'>,
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
        bookmarkOrFileId: null,
        title: null,
      },
    }),
  // Delete group actions
  openDeleteGroupDialog: (groupId: Id<'groups'>) =>
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
  openDeleteVaultFileDialog: (fileId: Id<'vaultFiles'>, fileName: string) =>
    set({ deleteVaultFile: { open: true, fileId, fileName } }),
  closeDeleteVaultFileDialog: () =>
    set({ deleteVaultFile: { open: false, fileId: null, fileName: null } }),
}))
