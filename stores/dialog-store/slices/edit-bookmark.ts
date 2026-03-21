import type { Id } from '@/convex/_generated/dataModel'
import type { StoreApi } from 'zustand'
import type { DialogStore } from '../types'

export interface EditBookmarkData {
  id: Id<'bookmarks'>
  title: string
  url: string
  description?: string
}

export interface EditBookmarkSlice {
  editBookmark: {
    open: boolean
    bookmarkId: Id<'bookmarks'> | null
    bookmarkData: EditBookmarkData | null
  }
  openEditBookmarkDialog: (
    bookmarkId: Id<'bookmarks'>,
    bookmarkData: EditBookmarkData
  ) => void
  closeEditBookmarkDialog: () => void
}

export const editBookmarkInitialState: Pick<EditBookmarkSlice, 'editBookmark'> =
  {
    editBookmark: { open: false, bookmarkId: null, bookmarkData: null },
  }

type DialogSet = StoreApi<DialogStore>['setState']

export function buildEditBookmarkActions(
  set: DialogSet
): Pick<
  EditBookmarkSlice,
  'openEditBookmarkDialog' | 'closeEditBookmarkDialog'
> {
  return {
    openEditBookmarkDialog: (bookmarkId, bookmarkData) =>
      set({ editBookmark: { open: true, bookmarkId, bookmarkData } }),
    closeEditBookmarkDialog: () =>
      set({
        editBookmark: { open: false, bookmarkId: null, bookmarkData: null },
      }),
  }
}
