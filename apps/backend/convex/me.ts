import { v } from "convex/values"
import { accountQuery } from "./middleware/withAccount"

export const get = accountQuery({
	args: {},
	handler: async (ctx) => {
		return ctx.account.doc
	},
})

export const getOrganization = accountQuery({
	args: {},
	handler: async (ctx) => {
		const organizationId = ctx.identity.organizationId as string | undefined

		if (!organizationId) {
			throw new Error("You must be part of an organization to get your organization")
		}

		const server = await ctx.db
			.query("servers")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", organizationId))
			.first()

		if (!server)
			return {
				directive: "redirect",
				to: "/onboarding",
			} as const

		const serverMember = await ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) =>
				q.eq("accountId", ctx.account.doc._id).eq("serverId", server?._id),
			)
			.first()

		if (!serverMember)
			return {
				directive: "redirect",
				to: "/sign-in",
			} as const

		return {
			directive: "success",
			data: server,
		} as const
	},
})

export const getUser = accountQuery({
	args: {
		serverId: v.id("servers"),
	},
	handler: async (ctx, args) => {
		return ctx.db
			.query("users")
			.withIndex("by_accountId_serverId", (q) =>
				q.eq("accountId", ctx.account.id).eq("serverId", args.serverId),
			)
			.first()
	},
})

export const getLatestNotifcation = accountQuery({
	args: {},
	handler: async (ctx, _args) => {
		return ctx.db
			.query("notifications")
			.withIndex("by_accountId_targetedResourceId", (q) => q.eq("accountId", ctx.account.id))
			.order("desc")
			.first()
	},
})
