import { v } from "convex/values"
import { accountMutation } from "./middleware/withAccount"
import { organizationServerQuery } from "./middleware/withOrganization"
import { userQuery } from "./middleware/withUser"

export const getUsers = userQuery({
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

export const getUserForOrganization = organizationServerQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId)
		if (!user) throw new Error("User not found")

		// Check if user is a member of this organization
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId_userId", (q) =>
				q.eq("organizationId", ctx.organizationId).eq("userId", args.userId),
			)
			.first()

		if (!membership) throw new Error("User not in this organization")

		return { ...user, role: membership.role }
	},
})

export const getUser = userQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId)
		if (!user) throw new Error("User not found")

		// Check if user is in the same organization
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId_userId", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", args.userId),
			)
			.first()

		if (!membership) throw new Error("User not found in this organization")

		return { ...user, role: membership.role }
	},
})

export const addToOrganization = accountMutation({
	args: {
		organizationId: v.id("organizations"),
		role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
	},
	handler: async (ctx, args) => {
		// Check if user is already a member
		const existingMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId_userId", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", ctx.account.id),
			)
			.first()

		if (existingMembership) {
			throw new Error("User is already a member of this organization")
		}

		return await ctx.account.createOrganizationMembership({
			ctx,
			organizationId: args.organizationId,
			role: args.role,
		})
	},
})
