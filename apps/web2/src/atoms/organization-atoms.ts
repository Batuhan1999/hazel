import { HazelRpcClient } from "~/lib/services/common/rpc-atom-client"

/**
 * Mutation atom for creating organizations
 */
export const createOrganizationMutation = HazelRpcClient.mutation("organization.create")

/**
 * Mutation atom for updating organizations
 */
export const updateOrganizationMutation = HazelRpcClient.mutation("organization.update")

/**
 * Mutation atom for deleting organizations
 */
export const deleteOrganizationMutation = HazelRpcClient.mutation("organization.delete")

/**
 * Mutation atom for setting organization slug
 */
export const setOrganizationSlugMutation = HazelRpcClient.mutation("organization.setSlug")
