import type { CreateGroupSlice } from './slices/create-group'
import type { DeleteBookmarkOrItemSlice } from './slices/delete-bookmark-or-item'
import type { DeleteGroupSlice } from './slices/delete-group'
import type { EditBookmarkSlice } from './slices/edit-bookmark'
import type { EditGroupSlice } from './slices/edit-group'

export type DialogStore = EditBookmarkSlice &
  EditGroupSlice &
  DeleteBookmarkOrItemSlice &
  DeleteGroupSlice &
  CreateGroupSlice
