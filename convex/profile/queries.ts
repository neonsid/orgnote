import { v } from 'convex/values'
import { query } from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { fetchGroupBookmarks } from '../bookmarks/helpers'
import { MAX_BOOKMARKS_PER_QUERY } from '../lib/constants'

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    const profile = await ctx.db
      .query('userProfile')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    return profile
  },
})

export const getProfileByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.username) {
      return null
    }

    const profile = await ctx.db
      .query('userProfile')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique()

    if (!profile || !profile.isPublic) {
      return null
    }

    return {
      ...profile,
      name: profile.username,
    }
  },
})

export const getPublicProfileData = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return null
    }

    const profile = await ctx.db
      .query('userProfile')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .unique()

    if (!profile || !profile.isPublic) {
      return null
    }

    const groups = await ctx.db
      .query('groups')
      .withIndex('by_userId_and_isPublic', (q) =>
        q.eq('userId', profile.userId).eq('isPublic', true)
      )
      .take(MAX_BOOKMARKS_PER_QUERY)

    const bookmarks: {
      _id: string
      title: string
      url: string
      description?: string
      imageUrl: string
      doneReading: boolean
      _creationTime: number
      groupId: string
      groupTitle: string
      groupColor: string
    }[] = []

    for (const group of groups) {
      const groupBookmarks = await fetchGroupBookmarks(ctx, group._id)

      for (const bookmark of groupBookmarks) {
        bookmarks.push({
          _id: bookmark._id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          imageUrl: bookmark.imageUrl,
          doneReading: bookmark.doneReading,
          _creationTime: bookmark._creationTime,
          groupId: group._id,
          groupTitle: group.title,
          groupColor: group.color,
        })
      }
    }

    bookmarks.sort((a, b) => b._creationTime - a._creationTime)

    return {
      profile: {
        ...profile,
        name: profile.username,
      },
      groups,
      bookmarks,
    }
  },
})
