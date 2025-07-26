import { organizationServerQuery } from "./middleware/withOrganization"
import { userQuery } from "./middleware/withUser"

export const getFriendsForOrganization = organizationServerQuery({
	args: {},
	handler: async (ctx) => {
		// Get all members of the organization
		const members = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", ctx.organizationId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect()

		// Get user details for each member
		const users = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId)
				return user
			}),
		)

		return users.filter((u) => u !== null && u._id !== ctx.account.doc._id)
	},
})

export const getFriends = userQuery({
	args: {},
	handler: async (ctx, args) => {
		// Get all members of the organization
		const members = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect()

		// Get user details for each member
		const users = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId)
				return user
			}),
		)

		return users.filter((u) => u !== null && u._id !== ctx.user.id)
	},
})

export const getMembers = userQuery({
	args: {},
	handler: async (ctx, args) => {
		// Get all members of the organization
		const members = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect()

		// Get user details for each member
		const users = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId)
				return user ? { ...user, role: member.role } : null
			}),
		)

		return users.filter((u) => u !== null)
	},
})

export const getMembersForOrganization = organizationServerQuery({
	args: {},
	handler: async (ctx) => {
		// Get all members of the organization
		const members = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", ctx.organizationId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect()

		// Get user details for each member
		const users = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId)
				return user ? { ...user, role: member.role } : null
			}),
		)

		return users.filter((u) => u !== null)
	},
})
