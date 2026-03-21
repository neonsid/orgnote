import type { Id } from '@/convex/_generated/dataModel'
import type { StoreApi } from 'zustand'
import type { DialogStore } from '../types'

export interface DeleteBookmarkOrItemSlice {
  deleteBookmarkOrItem: {
    open: boolean
    bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'> | null
    title: string | null
  }
  openDeleteBookmarkDialog: (
    bookmarkOrFileId: Id<'bookmarks'> | Id<'vaultFiles'>,
    title: string
  ) => void
  closeDeleteBookmarkDialog: () => void
}

export const deleteBookmarkOrItemInitialState: Pick<
  DeleteBookmarkOrItemSlice,
  'deleteBookmarkOrItem'
> = {
  deleteBookmarkOrItem: {
    open: false,
    bookmarkOrFileId: null,
    title: null,
  },
}

type DialogSet = StoreApi<DialogStore>['setState']

export function buildDeleteBookmarkOrItemActions(
  set: DialogSet
): Pick<
  DeleteBookmarkOrItemSlice,
  'openDeleteBookmarkDialog' | 'closeDeleteBookmarkDialog'
> {
  return {
    openDeleteBookmarkDialog: (bookmarkOrFileId, title) =>
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
  }
}
