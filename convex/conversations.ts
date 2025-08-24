import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function keyFor(participants: string[]) {
  return [...participants].map((a) => a.toLowerCase()).sort().join(":");
}

export const upsertConversation = mutation({
  args: { participants: v.array(v.string()) },
  handler: async (ctx, { participants }) => {
    const key = keyFor(participants);
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("conversations", {
      key,
      participants,
      updatedAt: Date.now(),
    });
  },
});

export const updateLastMessage = mutation({
  args: { key: v.string(), lastMessage: v.string() },
  handler: async (ctx, { key, lastMessage }) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      lastMessage,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const getConversationsForAddress = query({
  args: { address: v.string() },
  handler: async (ctx, { address }) => {
    const lower = address.toLowerCase();
    const results = await ctx.db.query("conversations").collect();
    return results.filter((c) => c.participants.map((p) => p.toLowerCase()).includes(lower));
  },
});

