import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getMessages = query({
	args: {
		channelId: v.id("serverChannels"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		console.log("identity", identity)
		if (identity === null) {
			throw new Error("Not authenticated")
		}

		// TODO: Set limits on pagination numbers
		const messages = await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("channelId"), args.channelId))
			.order("desc")
			.paginate(args.paginationOpts)

		return messages
	},
})

export const createMessage = mutation({
	args: {
		content: v.string(),
		channelId: v.id("serverChannels"),
		threadChannelId: v.optional(v.id("serverChannels")),
		authorId: v.id("users"),
		replyToMessageId: v.optional(v.id("messages")),
		attachedFiles: v.array(v.string()),
		updatedAt: v.number(),
	},
	handler: async (ctx, args) => {
		const messageId = await ctx.db.insert("messages", {
			channelId: args.channelId,
			content: args.content,
			threadChannelId: args.threadChannelId,
			authorId: args.authorId,
			replyToMessageId: args.replyToMessageId,
			attachedFiles: args.attachedFiles,
			updatedAt: args.updatedAt,
		})

		return messageId
	},
})

export const updateMessage = mutation({
	args: {
		id: v.id("messages"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			content: args.content,
		})
	},
})

export const deleteMessage = mutation({
	args: {
		id: v.id("messages"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			deletedAt: Date.now(),
		})
	},
})
