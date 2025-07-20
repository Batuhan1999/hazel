"use node"

import { WorkOS } from "@workos-inc/node"
import { v } from "convex/values"
import { internalAction } from "./_generated/server"

export const verifyWorkosWebhook = internalAction({
	args: v.object({
		payload: v.string(),
		signature: v.string(),
	}),
	handler: async (_ctx, { payload, signature }) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY!)
		try {
			const event = await workos.webhooks.constructEvent({
				sigHeader: signature,
				payload,
				secret: process.env.WORKOS_WEBHOOK_SECRET!,
			})
			return { valid: true, event }
		} catch (err: any) {
			return { valid: false, error: err.message }
		}
	},
})

// Fetch all users from WorkOS
export const fetchWorkosUsers = internalAction({
	args: v.object({}),
	handler: async (_ctx, _args) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY!)
		const users = []
		let after: string | null = null
		
		try {
			// Paginate through all users
			do {
				const response = await workos.userManagement.listUsers({
					after: after || undefined,
					limit: 100,
				})
				
				users.push(...response.data)
				after = response.listMetadata?.after || null
			} while (after)
			
			return { success: true, users }
		} catch (err: any) {
			console.error("Error fetching WorkOS users:", err)
			return { success: false, error: err.message, users: [] }
		}
	},
})

// Fetch all organizations from WorkOS
export const fetchWorkosOrganizations = internalAction({
	args: v.object({}),
	handler: async (_ctx, _args) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY!)
		const organizations = []
		let after: string | null = null
		
		try {
			// Paginate through all organizations
			do {
				const response = await workos.organizations.listOrganizations({
					after: after || undefined,
					limit: 100,
				})
				
				organizations.push(...response.data)
				after = response.listMetadata?.after || null
			} while (after)
			
			return { success: true, organizations }
		} catch (err: any) {
			console.error("Error fetching WorkOS organizations:", err)
			return { success: false, error: err.message, organizations: [] }
		}
	},
})

// Fetch all organization memberships from WorkOS
export const fetchWorkosOrganizationMemberships = internalAction({
	args: v.object({
		organizationId: v.string(),
	}),
	handler: async (_ctx, { organizationId }) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY!)
		const memberships = []
		let after: string | null = null
		
		try {
			// Paginate through all memberships
			do {
				const response = await workos.userManagement.listOrganizationMemberships({
					organizationId,
					after: after || undefined,
					limit: 100,
				})
				
				memberships.push(...response.data)
				after = response.listMetadata?.after || null
			} while (after)
			
			return { success: true, memberships }
		} catch (err: any) {
			console.error(`Error fetching WorkOS memberships for org ${organizationId}:`, err)
			return { success: false, error: err.message, memberships: [] }
		}
	},
})
