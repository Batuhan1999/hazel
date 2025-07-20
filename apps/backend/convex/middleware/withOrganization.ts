import type { Id } from "../_generated/dataModel"
import { mutation, query } from "../_generated/server"
import { Account } from "../lib/activeRecords/account"
import { customMutation, customQuery } from "../lib/customFunctions"

export const organizationServerQuery = customQuery(query, {
	args: {},
	input: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()

		if (identity === null) {
			throw new Error("Not authenticated")
		}

		const account = await Account.fromIdentity(ctx, identity)

		const workosOrganizationId = identity.organizationId as string | undefined

		if (!workosOrganizationId) {
			throw new Error("No organization associated with this account")
		}

		// Find the organization by WorkOS ID
		const organization = await ctx.db
			.query("organizations")
			.withIndex("by_workosId", (q) => q.eq("workosId", workosOrganizationId))
			.first()

		if (!organization) {
			throw new Error("Organization not found")
		}

		// Check if user is a member of the organization
		const organizationMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId_userId", (q) =>
				q.eq("organizationId", organization._id).eq("userId", account.doc._id),
			)
			.first()

		if (!organizationMembership) {
			throw new Error("You are not a member of this organization")
		}

		return {
			ctx: {
				...ctx,
				account,
				identity,
				organization,
				organizationId: organization._id as Id<"organizations">,
				organizationMembership,
			},
			args,
		}
	},
})

export const organizationServerMutation = customMutation(mutation, {
	args: {},
	input: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()

		if (identity === null) {
			throw new Error("Not authenticated")
		}

		const account = await Account.fromIdentity(ctx, identity)

		const workosOrganizationId = identity.organizationId as string | undefined

		if (!workosOrganizationId) {
			throw new Error("No organization associated with this account")
		}

		// Find the organization by WorkOS ID
		const organization = await ctx.db
			.query("organizations")
			.withIndex("by_workosId", (q) => q.eq("workosId", workosOrganizationId))
			.first()

		if (!organization) {
			throw new Error("Organization not found")
		}

		// Check if user is a member of the organization
		const organizationMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId_userId", (q) =>
				q.eq("organizationId", organization._id).eq("userId", account.doc._id),
			)
			.first()

		if (!organizationMembership) {
			throw new Error("You are not a member of this organization")
		}

		return {
			ctx: {
				...ctx,
				account,
				identity,
				organization,
				organizationId: organization._id as Id<"organizations">,
				organizationMembership,
			},
			args,
		}
	},
})
