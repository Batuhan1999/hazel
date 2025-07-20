import type { Id } from "@hazel/backend"
import { convexTest as _convexTest, type TestConvex, type TestConvexForDataModel } from "convex-test"
import { vi } from "vitest"
import { api } from "../../convex/_generated/api"
import schema from "../../convex/schema"
import { modules } from "../../convex/test.setup"

export function randomIdentity(convexTest: TestConvex<typeof schema>) {
	return convexTest.withIdentity({ tokenIdentifier: crypto.randomUUID(), subject: crypto.randomUUID() })
}

export function convexTest() {
	const t = _convexTest(schema, modules)

	return t
}

export async function createUser(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
	props?: { firstName?: string; lastName?: string },
) {
	const firstName = props?.firstName || "Alice"
	const lastName = props?.lastName || "Smith"
	return await t.mutation(api.users.createUser, { firstName, lastName })
}

export async function createOrganization(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
	props?: { name?: string; slug?: string },
) {
	const name = props?.name || "Test Organization"
	const slug = props?.slug || "test-org"
	return await t.mutation(api.organizations.create, { name, slug })
}

// Servers are replaced by organizations - keeping for compatibility
export async function createServer(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
	props?: { name?: string },
) {
	return await createOrganization(t, { name: props?.name })
}

export async function createOrganizationAndUser(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
) {
	const user = await createUser(t)
	const organization = await createOrganization(t)
	return { user, organization }
}

export async function addUserToOrganization(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
	props: { role?: "member" | "admin" | "owner"; organizationId: Id<"organizations"> },
) {
	const role = props.role || "member"
	return await t.mutation(api.users.addToOrganization, { role, organizationId: props.organizationId })
}

export async function createChannel(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
	props: { organizationId: Id<"organizations">; type?: "public" | "private" },
) {
	return await t.mutation(api.channels.createChannel, {
		organizationId: props.organizationId,
		name: "Test Channel",
		type: props.type || "public",
	})
}

export async function createMessage(
	t: TestConvex<typeof schema> | TestConvexForDataModel<(typeof schema)["schemaValidation"]>,
	props: {
		organizationId: Id<"organizations">
		channelId: Id<"channels">
		content?: string
		replyToMessageId?: Id<"messages">
		threadChannelId?: Id<"channels">
		attachedFiles?: string[]
	},
) {
	vi.useFakeTimers()

	const message = await t.mutation(api.messages.createMessage, {
		organizationId: props.organizationId,
		channelId: props.channelId,
		content: props.content ?? "Test message content",
		replyToMessageId: props.replyToMessageId,
		threadChannelId: props.threadChannelId,
		attachedFiles: props.attachedFiles || [],
	})

	await t.finishAllScheduledFunctions(vi.runAllTimers)

	return message
}
