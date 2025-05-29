import type { TestConvex, TestConvexForDataModel } from "convex-test"
import { describe, expect, test } from "vitest"
import { api } from "../convex/_generated/api"
import {
	convexTest,
	createChannel,
	createServerAndAccount,
	randomIdentity,
	createUser,
	createAccount,
	createMessage,
} from "./utils/data-generator"
import type schema from "../convex/schema"
import type { Id } from "../convex/_generated/dataModel"

async function setupServerAndUser(convexTest: TestConvex<typeof schema>) {
	const t = randomIdentity(convexTest)
	const { server } = await createServerAndAccount(t)

	const users = await t.query(api.users.getUsers, { serverId: server })
	const channelId = await createChannel(t, { serverId: server })

	return { server, userId: users[0]._id, channelId, t }
}

async function setupMultipleUsers(convexTest: TestConvex<typeof schema>) {
	const t1 = randomIdentity(convexTest)
	const { server } = await createServerAndAccount(t1)

	const t2 = randomIdentity(convexTest)
	await createAccount(t2)
	const user2Id = await createUser(t2, { serverId: server, role: "member" })

	const users = await t1.query(api.users.getUsers, { serverId: server })
	const user1Id = users[0]._id

	const channelId = await createChannel(t1, { serverId: server })

	return { server, user1Id, user2Id, channelId, t1, t2 }
}

describe("messages", () => {
	test("creation and retrieval works", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		const messageId = await createMessage(t, {
			serverId: server,
			channelId,
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		expect(messages.page).toHaveLength(1)
		expect(messages.page[0]?._id).toEqual(messageId)
		expect(messages.page[0]?.content).toEqual("Test message content")
		expect(messages.page[0]?.authorId).toEqual(userId)
		expect(messages.page[0]?.channelId).toEqual(channelId)
	})

	test("creates message with attached files", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		const attachedFiles = ["file1.jpg", "file2.pdf", "file3.txt"]

		const messageId = await createMessage(t, {
			serverId: server,
			channelId,

			attachedFiles,
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		expect(messages.page[0]?.attachedFiles).toEqual(attachedFiles)
	})

	test("creates reply message", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		// Create original message
		const originalMessageId = await createMessage(t, {
			serverId: server,
			channelId,

			content: "Original message",
		})

		// Create reply
		const replyMessageId = await createMessage(t, {
			serverId: server,
			channelId,

			content: "This is a reply",
			replyToMessageId: originalMessageId,
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		// Messages should be ordered by creation time (newest first)
		expect(messages.page).toHaveLength(2)
		const replyMessage = messages.page.find((m: any) => m._id === replyMessageId)
		expect(replyMessage?.replyToMessageId).toEqual(originalMessageId)
		expect(replyMessage?.content).toEqual("This is a reply")
	})

	test("creates thread message", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		const threadChannelId = await createChannel(t, { serverId: server })

		const messageId = await createMessage(t, {
			serverId: server,
			channelId,

			content: "Message in thread",
			threadChannelId,
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		expect(messages.page[0]?.threadChannelId).toEqual(threadChannelId)
	})

	test("user can update their own message", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		const messageId = await createMessage(t, {
			serverId: server,
			channelId,

			content: "Original content",
		})

		// Update the message
		await t.mutation(api.messages.updateMessage, {
			serverId: server,
			id: messageId,
			content: "Updated content",
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		expect(messages.page[0]?.content).toEqual("Updated content")
	})

	test("user cannot update another user's message", async () => {
		const ct = convexTest()
		const { server, user1Id, user2Id, channelId, t1, t2 } = await setupMultipleUsers(ct)

		// User 2 joins the channel
		await t2.mutation(api.channels.joinChannel, {
			serverId: server,
			channelId,
		})

		// User 1 creates a message
		const messageId = await createMessage(t1, {
			serverId: server,
			channelId,
			content: "User 1's message",
		})

		// User 2 tries to update User 1's message
		await expect(
			t2.mutation(api.messages.updateMessage, {
				serverId: server,
				id: messageId,
				content: "Hacked content",
			}),
		).rejects.toThrow()
	})

	test("user can delete their own message", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		const messageId = await createMessage(t, {
			serverId: server,
			channelId,
		})

		// Delete the message
		await t.mutation(api.messages.deleteMessage, {
			serverId: server,
			id: messageId,
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		// Message should be marked as deleted (soft delete)
		expect(messages.page[0]?.deletedAt).toBeDefined()
	})

	test("user cannot delete another user's message", async () => {
		const ct = convexTest()
		const { server, user1Id, user2Id, channelId, t1, t2 } = await setupMultipleUsers(ct)

		// User 2 joins the channel
		await t2.mutation(api.channels.joinChannel, {
			serverId: server,
			channelId,
		})

		// User 1 creates a message
		const messageId = await createMessage(t1, {
			serverId: server,
			channelId,
		})

		// User 2 tries to delete User 1's message
		await expect(
			t2.mutation(api.messages.deleteMessage, {
				serverId: server,
				id: messageId,
			}),
		).rejects.toThrow()
	})

	test("pagination works correctly", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		// Create multiple messages
		const messageIds = []
		for (let i = 0; i < 5; i++) {
			const messageId = await createMessage(t, {
				serverId: server,
				channelId,

				content: `Message ${i + 1}`,
			})
			messageIds.push(messageId)
		}

		// Get first page with limit of 3
		const firstPage = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 3, cursor: null },
		})
		expect(firstPage.page).toHaveLength(3)
		expect(firstPage.isDone).toBe(false)

		// Get next page
		const secondPage = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 3, cursor: firstPage.continueCursor },
		})

		expect(secondPage.page).toHaveLength(2)
		expect(secondPage.isDone).toBe(true)

		// Verify no overlap between pages
		const firstPageIds = firstPage.page.map((m: any) => m._id)
		const secondPageIds = secondPage.page.map((m: any) => m._id)
		const overlap = firstPageIds.filter((id: any) => secondPageIds.includes(id))
		expect(overlap).toHaveLength(0)
	})

	test("user cannot create message in channel they're not member of", async () => {
		const ct = convexTest()
		const { server, user1Id, user2Id, t1, t2 } = await setupMultipleUsers(ct)

		// User 1 creates a separate channel
		const separateChannelId = await createChannel(t1, { serverId: server })

		// User 2 tries to create a message without being a member
		await expect(
			createMessage(t2, {
				serverId: server,
				channelId: separateChannelId,
			}),
		).rejects.toThrow()
	})

	// TODO: This is not implemented yet
	// test("user cannot view messages in channel they're not member of", async () => {
	// 	const ct = convexTest()
	// 	const { server, user1Id, user2Id, t1, t2 } = await setupMultipleUsers(ct)

	// 	// User 1 creates a separate channel and message
	// 	const separateChannelId = await createChannel(t1, { serverId: server })
	// 	await createMessage(t1, {
	// 		serverId: server,
	// 		channelId: separateChannelId,
	// 	})

	// 	// User 2 tries to view messages without being a member
	// 	await expect(
	// 		t2.query(api.messages.getMessages, {
	// 			serverId: server,
	// 			channelId: separateChannelId,
	// 			paginationOpts: { numItems: 10, cursor: null },
	// 		}),
	// 	).rejects.toThrow()
	// })

	test("messages are ordered by creation time (newest first)", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		// Create messages with slight delays to ensure different timestamps
		const message1Id = await createMessage(t, {
			serverId: server,
			channelId,

			content: "First message",
		})

		// Small delay to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 10))

		const message2Id = await createMessage(t, {
			serverId: server,
			channelId,

			content: "Second message",
		})

		await new Promise((resolve) => setTimeout(resolve, 10))

		const message3Id = await createMessage(t, {
			serverId: server,
			channelId,

			content: "Third message",
		})

		const messages = await t.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		// Should be ordered newest first
		expect(messages.page).toHaveLength(3)
		expect(messages.page[0]?.content).toEqual("Third message")
		expect(messages.page[1]?.content).toEqual("Second message")
		expect(messages.page[2]?.content).toEqual("First message")
	})

	test("empty content message is rejected", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		await expect(
			createMessage(t, {
				serverId: server,
				channelId,
				content: "",
			}),
		).rejects.toThrow()
	})

	test("message with only whitespace is rejected", async () => {
		const ct = convexTest()
		const { server, userId, channelId, t } = await setupServerAndUser(ct)

		await expect(
			createMessage(t, {
				serverId: server,
				channelId,
				content: "   \n\t   ",
			}),
		).rejects.toThrow()
	})

	test("multiple users can create messages in same channel", async () => {
		const ct = convexTest()
		const { server, user1Id, user2Id, channelId, t1, t2 } = await setupMultipleUsers(ct)

		// User 2 joins the channel
		await t2.mutation(api.channels.joinChannel, {
			serverId: server,
			channelId,
		})

		// Both users create messages
		const message1Id = await createMessage(t1, {
			serverId: server,
			channelId,
			content: "Message from user 1",
		})

		const message2Id = await createMessage(t2, {
			serverId: server,
			channelId,
			content: "Message from user 2",
		})

		// Both users should see both messages
		const messages1 = await t1.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		const messages2 = await t2.query(api.messages.getMessages, {
			serverId: server,
			channelId,
			paginationOpts: { numItems: 10, cursor: null },
		})

		expect(messages1.page).toHaveLength(2)
		expect(messages2.page).toHaveLength(2)

		// Verify authors
		const user1Message = messages1.page.find((m: any) => m.authorId === user1Id)
		const user2Message = messages1.page.find((m: any) => m.authorId === user2Id)

		expect(user1Message?.content).toEqual("Message from user 1")
		expect(user2Message?.content).toEqual("Message from user 2")
	})
})
