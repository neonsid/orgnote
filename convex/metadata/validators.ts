import { v, type Infer } from 'convex/values'

export const bookmarkDescriptionReturnsValidator = v.object({
  success: v.boolean(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  error: v.optional(v.string()),
  remainingSciraQuota: v.optional(v.number()),
})

export type BookmarkDescriptionReturn = Infer<
  typeof bookmarkDescriptionReturnsValidator
>
