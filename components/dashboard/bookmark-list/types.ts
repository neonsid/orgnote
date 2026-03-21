import type { Id } from '@/convex/_generated/dataModel'

export interface Bookmark {
  id: Id<'bookmarks'>
  title: string
  domain: string
  url: string
  favicon: string
  fallbackColor: string
  createdAt: string
  groupId: Id<'groups'>
  doneReading: boolean
  description?: string
}

// TODO: Shift types otuside
export interface VaultFile {
  _id: Id<'vaultFiles'>
  name: string
  type: string
  size: number
  url: string
  thumbnailUrl?: string
  groupId?: Id<'vaultGroups'>
  ownerId: string
  _creationTime: number
}
