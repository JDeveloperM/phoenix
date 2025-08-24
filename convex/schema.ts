import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    address: v.string(),
    inboxId: v.optional(v.string()),
    ensName: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_address", ["address"])
    .index("by_inbox", ["inboxId"]),

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  conversations: defineTable({
    key: v.string(), // canonical key: sorted participants joined by ':'
    participants: v.array(v.string()),
    lastMessage: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});

