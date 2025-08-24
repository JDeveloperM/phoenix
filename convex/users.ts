import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: { address: v.string(), ensName: v.optional(v.string()), inboxId: v.optional(v.string()) },
  handler: async (ctx, { address, ensName, inboxId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_address", (q) => q.eq("address", address))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ensName, inboxId });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      address,
      ensName,
      inboxId,
      createdAt: Date.now(),
    });
  },
});

export const getUserByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, { address }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_address", (q) => q.eq("address", address))
      .unique();
  },
});

export const getUserByInboxId = query({
  args: { inboxId: v.string() },
  handler: async (ctx, { inboxId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_inbox", (q) => q.eq("inboxId", inboxId))
      .unique();
  },
});

export const getProfilesForInboxIds = query({
  args: { inboxIds: v.array(v.string()) },
  handler: async (ctx, { inboxIds }) => {
    const result: Record<string, any> = {}
    for (const inboxId of inboxIds) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_inbox", (q) => q.eq("inboxId", inboxId))
        .unique()
      if (!user) continue
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique()
      if (!profile) continue
      const avatarUrl = profile.avatarStorageId
        ? await ctx.storage.getUrl(profile.avatarStorageId)
        : profile.avatarUrl
      result[inboxId] = {
        displayName: profile.displayName,
        avatarUrl,
        bio: profile.bio,
      }
    }
    return result
  },
})

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, { userId, displayName, avatarUrl, avatarStorageId, bio }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        displayName,
        avatarUrl,
        avatarStorageId,
        bio,
        updatedAt: Date.now(),
      });
      return profile._id;
    }

    return await ctx.db.insert("profiles", {
      userId,
      displayName,
      avatarUrl,
      avatarStorageId,
      bio,
      updatedAt: Date.now(),
    });
  },
});

export const getProfileByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, { address }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_address", (q) => q.eq("address", address))
      .unique();
    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) return null;
    // Hydrate a signed URL if stored via storage
    const avatarUrl = profile.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : profile.avatarUrl;
    return { ...profile, avatarUrl };
  },
});

