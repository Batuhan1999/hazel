import { v } from "convex/values"
import { accountQuery } from "./middleware/withAccount"

export const getFriends = accountQuery({
	args: {
		serverId: v.id("servers"),
	},
	handler: async (ctx, args) => {
		const friends = await ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) =>
				q.eq("accountId", ctx.account.doc._id).eq("serverId", args.serverId),
			)
			.collect()

		return friends
	},
})

export const getMembers = accountQuery({
	args: {
		serverId: v.id("servers"),
	},
	handler: async (ctx, args) => {
		const friends = await ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) =>
				q.eq("accountId", ctx.account.doc._id).eq("serverId", args.serverId),
			)
			.collect()

		return friends
	},
})
