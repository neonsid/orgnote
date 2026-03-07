import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    userProvidedId: v.string(),
    email: v.string(),
  }).index("by_userProvidedId", ["userProvidedId"]),
  userProfile: defineTable({
    isPublic: v.boolean(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          label: v.union(
            v.literal("GitHub"),
            v.literal("Twitter"),
            v.literal("Portfolio"),
          ),
          url: v.string(),
        }),
      ),
    ),
    userProvidedId: v.string(),
  })
    .index("by_userProvidedId", ["userProvidedId"])
    .index("by_username", ["username"]),
  groups: defineTable({
    title: v.string(),
    color: v.string(),
    userProvidedId: v.string(), // Denormalized for convenience
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    // Removed standalone by_userProvidedId — it's a prefix of by_userProvidedId_and_isPublic
    .index("by_userProvidedId_and_isPublic", ["userProvidedId", "isPublic"]),
  bookmarks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    imageUrl: v.string(),
    doneReading: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    groupId: v.id("groups"),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_createdAt", ["groupId", "createdAt"]),
  // Track Skyra API usage per user per day (20 requests/day limit)
  skyraUsage: defineTable({
    userProvidedId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    requestCount: v.number(),
  }).index("by_userProvidedId_and_date", ["userProvidedId", "date"]),
  // Track Scira API usage per user per day (20 requests/day limit)
  sciraUsage: defineTable({
    userProvidedId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    requestCount: v.number(),
  }).index("by_userProvidedId_and_date", ["userProvidedId", "date"]),
});
