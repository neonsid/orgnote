import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    userProvidedId: v.string(),
    email: v.string(),
  }).index("by_user_provided_id", ["userProvidedId"]),
  groups: defineTable({
    title: v.string(),
    color: v.string(),
    userProvidedId: v.string(), // Denormalized for convenience
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_user_provided_id", ["userProvidedId"]),
  bookmarks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    groupId: v.id("groups"),
  }),
});
