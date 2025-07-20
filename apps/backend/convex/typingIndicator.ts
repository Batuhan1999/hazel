import { v } from "convex/values"
import { asyncMap } from "convex-helpers"
import { internalMutation, query } from "./_generated/server"
import { accountMutation, accountQuery } from "./middleware/withAccount"
import { userMutation, userQuery } from "./middleware/withUser"

// The duration in milliseconds to consider a user as "still typing".
// After this timeout, they will be considered to have stopped typing.
const TYPING_TIMEOUT = 5000 // 5 seconds

/**
 * Updates the "last typed" timestamp for a user in a room.
 * This is an "upsert" operation.
 * - If the user is not already marked as typing, a new document is created.
 * - If the user is already typing, their timestamp is updated.
 *
 * This mutation should be called from the client whenever the user types.
 */
export const update = userMutation({
	args: {
		channelId: v.id("channels"),
	},
	handler: async (ctx, { channelId }) => {
		const membership = ctx.user.membership
		if (!membership) throw new Error("User not a member of this organization")
		
		const existing = await ctx.db
			.query("typingIndicators")
			.withIndex("by_memberId", (q) => q.eq("channelId", channelId).eq("memberId", membership._id))
			.unique()

		if (existing) {
			await ctx.db.patch(existing._id, { lastTyped: Date.now() })
		} else {
			await ctx.db.insert("typingIndicators", {
				channelId,
				memberId: membership._id,
				lastTyped: Date.now(),
			})
		}
	},
})

/**
 * Returns a list of users who are actively typing in a room.
 * This query filters out users whose `lastTyped` timestamp is older
 * than the `TYPING_TIMEOUT`.
 */
export const list = userQuery({
	args: {
		channelId: v.id("channels"),
	},
	handler: async (ctx, { channelId }) => {
		const threshold = Date.now() - TYPING_TIMEOUT
		const membership = ctx.user.membership

		const typingIndicators = await ctx.db
			.query("typingIndicators")
			.withIndex("by_channel_timestamp", (q) => q.eq("channelId", channelId).gt("lastTyped", threshold))
			.collect()

		const typingIndicatorsWithUsers = await asyncMap(typingIndicators, async (indicator) => {
			if (membership && indicator.memberId === membership._id) return null

			// Get member details
			const orgMember = await ctx.db.get(indicator.memberId)
			if (!orgMember) return null
			
			// Get user details
			const user = await ctx.db.get(orgMember.userId)
			if (!user) return null

			return {
				...indicator,
				user,
			}
		})

		return typingIndicatorsWithUsers.filter((indicator) => indicator !== null)
	},
})

export const stop = userMutation({
	args: {
		channelId: v.id("channels"),
	},
	handler: async (ctx, { channelId }) => {
		const membership = ctx.user.membership
		if (!membership) throw new Error("User not a member of this organization")
		
		const existing = await ctx.db
			.query("typingIndicators")
			.withIndex("by_memberId", (q) => q.eq("channelId", channelId).eq("memberId", membership._id))
			.unique()

		if (existing) {
			await ctx.db.delete(existing._id)
		}
	},
})

const STALE_TIMEOUT = 60 * 60 * 1000

/**
 * Internal mutation to clean up old, stale typing indicators from the database.
 * This is run by a cron job and is not intended to be called by the client.
 */
export const cleanupOld = internalMutation({
	handler: async (ctx) => {
		const threshold = Date.now() - STALE_TIMEOUT

		const staleIndicators = await ctx.db
			.query("typingIndicators")
			.withIndex("by_timestamp", (q) => q.lt("lastTyped", threshold))
			.take(100)

		await Promise.all(staleIndicators.map((doc) => ctx.db.delete(doc._id)))

		console.log(`Cleaned up ${staleIndicators.length} stale typing indicators.`)
	},
})
