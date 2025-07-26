import type { Doc, Id } from "@hazel/backend"
import type { MutationCtx } from "@hazel/backend/server"
import type { UserIdentity } from "convex/server"
import type { GenericContext } from "./user"

// This class now represents a User from the users table
export class Account {
	private constructor(public readonly doc: Doc<"users">) {}

	public get id() {
		return this.doc._id
	}

	static async fromIdentity(ctx: GenericContext, identity: UserIdentity) {
		// Find user by externalId (from WorkOS)
		const user = await ctx.db
			.query("users")
			.withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
			.unique()

		if (!user) throw new Error("User not found")

		return new Account(user)
	}

	public async validateCanViewUser(args: { ctx: GenericContext; userId: Id<"users"> }) {
		if (args.userId !== this.id) {
			throw new Error("You do not have permission to view this user")
		}
	}

	public async createOrganizationMembership(args: {
		ctx: MutationCtx
		organizationId: Id<"organizations">
		role?: string
	}) {
		const membership = await args.ctx.db
			.query("organizationMembers")
			.withIndex("by_organizationId_userId", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", this.id),
			)
			.unique()

		if (membership) throw new Error("User is already a member of this organization")

		return await args.ctx.db.insert("organizationMembers", {
			organizationId: args.organizationId,
			userId: this.id,
			role: args.role || "member",
			joinedAt: Date.now(),
		})
	}
}
