import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  userProfile: defineTable({
    isPublic: v.boolean(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          label: v.union(
            v.literal('GitHub'),
            v.literal('Twitter'),
            v.literal('Portfolio')
          ),
          url: v.string(),
        })
      )
    ),
    userId: v.string(),
  })
    .index('by_userId', ['userId'])
    .index('by_username', ['username']),
  groups: defineTable({
    title: v.string(),
    color: v.string(),
    userId: v.string(),
    isPublic: v.optional(v.boolean()),
    updatedAt: v.optional(v.number()),
  }).index('by_userId_and_isPublic', ['userId', 'isPublic']),
  bookmarks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    imageUrl: v.string(),
    doneReading: v.boolean(),
    updatedAt: v.optional(v.number()),
    groupId: v.id('groups'),
    /** When true, bookmark is omitted from public profile / public group views (Google Safe Browsing match). */
    publicListingBlockedForUrlSafety: v.optional(v.boolean()),
    urlSafetyCheckedAt: v.optional(v.number()),
  })
    .index('by_groupId', ['groupId']),
  sciraUsage: defineTable({
    userId: v.string(),
    date: v.string(),
    requestCount: v.number(),
  }).index('by_userId_and_date', ['userId', 'date']),
  vaultFiles: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.number(),
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    groupId: v.optional(v.id('vaultGroups')),
    ownerId: v.string(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_owner_group', ['ownerId', 'groupId']),
  vaultGroups: defineTable({
    title: v.string(),
    color: v.string(),
    userId: v.string(),
  }).index('by_userId', ['userId']),
})
