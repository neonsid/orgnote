import type { Id } from '@/convex/_generated/dataModel'
import type { StoreApi } from 'zustand'
import type { DialogStore } from '../types'

export interface DeleteGroupSlice {
  deleteGroup: {
    open: boolean
    groupId: Id<'groups'> | null
  }
  openDeleteGroupDialog: (groupId: Id<'groups'>) => void
  closeDeleteGroupDialog: () => void
}

export const deleteGroupInitialState: Pick<DeleteGroupSlice, 'deleteGroup'> = {
  deleteGroup: { open: false, groupId: null },
}

type DialogSet = StoreApi<DialogStore>['setState']

export function buildDeleteGroupActions(
  set: DialogSet
): Pick<DeleteGroupSlice, 'openDeleteGroupDialog' | 'closeDeleteGroupDialog'> {
  return {
    openDeleteGroupDialog: (groupId) =>
      set({ deleteGroup: { open: true, groupId } }),
    closeDeleteGroupDialog: () =>
      set({ deleteGroup: { open: false, groupId: null } }),
  }
}
