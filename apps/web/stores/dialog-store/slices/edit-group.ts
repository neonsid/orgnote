import type { Id } from '@/convex/_generated/dataModel'
import type { StoreApi } from 'zustand'
import type { DialogStore } from '../types'

export interface EditGroupSlice {
  editGroup: {
    open: boolean
    groupId: Id<'groups'> | null
  }
  openGroupRenameDialog: (groupId: Id<'groups'>) => void
  closeGroupRenameDialog: () => void
}

export const editGroupInitialState: Pick<EditGroupSlice, 'editGroup'> = {
  editGroup: { open: false, groupId: null },
}

type DialogSet = StoreApi<DialogStore>['setState']

export function buildEditGroupActions(
  set: DialogSet
): Pick<EditGroupSlice, 'openGroupRenameDialog' | 'closeGroupRenameDialog'> {
  return {
    openGroupRenameDialog: (groupId) =>
      set({ editGroup: { groupId, open: true } }),
    closeGroupRenameDialog: () =>
      set({ editGroup: { groupId: null, open: false } }),
  }
}
