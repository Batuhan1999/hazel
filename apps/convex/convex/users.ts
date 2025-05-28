import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getUser = query({
	args: {
		id: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id)
	},
})

export const getUsers = query({
	handler: async (ctx) => {
		return await ctx.db.query("users").collect()
	},
})

export const createUser = mutation({
	args: {
		displayName: v.optional(v.string()),
		tag: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Called storeUser without authentication present")
		}

		const user = await ctx.db
			.query("users")
			.withIndex("bg_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique()

		if (user !== null) {
			if (user.displayName !== identity.name) {
				await ctx.db.patch(user._id, { displayName: identity.name })
			}
			return user._id
		}

		return await ctx.db.insert("users", {
			externalId: identity.subject,
			avatarUrl: identity.pictureUrl || `https://avatar.vercel.sh/${identity.subject}.svg`,
			displayName: args.displayName || identity.name || "Unknown",
			tag: args.tag?.toLowerCase() || identity.nickname?.toLowerCase() || identity.subject.toLowerCase(),
			lastSeen: Date.now(),
			tokenIdentifier: identity.tokenIdentifier,
			status: "offline",
		})
	},
})
