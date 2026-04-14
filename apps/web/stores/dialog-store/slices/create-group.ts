import type { StoreApi } from 'zustand'
import type { DialogStore } from '../types'

export interface CreateGroupSlice {
  createGroup: {
    open: boolean
  }
  openCreateGroup: () => void
  closeCreateGroup: () => void
}

export const createGroupInitialState: Pick<CreateGroupSlice, 'createGroup'> = {
  createGroup: { open: false },
}

type DialogSet = StoreApi<DialogStore>['setState']

export function buildCreateGroupActions(
  set: DialogSet
): Pick<CreateGroupSlice, 'openCreateGroup' | 'closeCreateGroup'> {
  return {
    openCreateGroup: () => set({ createGroup: { open: true } }),
    closeCreateGroup: () => set({ createGroup: { open: false } }),
  }
}
