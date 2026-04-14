import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import {
  buildCreateGroupActions,
  createGroupInitialState,
} from './slices/create-group'
import {
  buildDeleteBookmarkOrItemActions,
  deleteBookmarkOrItemInitialState,
} from './slices/delete-bookmark-or-item'
import {
  buildDeleteGroupActions,
  deleteGroupInitialState,
} from './slices/delete-group'
import {
  buildEditBookmarkActions,
  editBookmarkInitialState,
} from './slices/edit-bookmark'
import {
  buildEditGroupActions,
  editGroupInitialState,
} from './slices/edit-group'

export type { EditBookmarkData } from './slices/edit-bookmark'
export type { DialogStore } from './types'

const dialogInitialState = {
  ...editBookmarkInitialState,
  ...editGroupInitialState,
  ...deleteBookmarkOrItemInitialState,
  ...deleteGroupInitialState,
  ...createGroupInitialState,
}

export const useDialogStore = create(
  combine(dialogInitialState, (set) => ({
    ...buildEditBookmarkActions(set),
    ...buildEditGroupActions(set),
    ...buildDeleteBookmarkOrItemActions(set),
    ...buildDeleteGroupActions(set),
    ...buildCreateGroupActions(set),
  }))
)
