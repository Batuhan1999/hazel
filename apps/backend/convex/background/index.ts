import { internalMutation } from "@hazel/backend/server"
import { v } from "convex/values"
import { asyncMap } from "convex-helpers"
import { api, internal } from "../_generated/api"

const markdownToPlainText = (markdown: string): string => {
	if (!markdown) return ""

	let text = markdown

	// Remove code blocks first (triple backticks)
	text = text.replace(/```[\s\S]*?```/g, "[code block]")

	// Remove inline code (single backticks)
	text = text.replace(/`([^`]+)`/g, "$1")

	// Convert bold (**text** or __text__)
	text = text.replace(/(\*\*|__)(.*?)\1/g, "$2")

	// Convert italic (*text* or _text_)
	text = text.replace(/(\*|_)(.*?)\1/g, "$2")

	// Convert strikethrough (~~text~~)
	text = text.replace(/~~(.*?)~~/g, "$1")

	// Convert links [text](url) to just the text
	text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

	// Remove headers (# ## ### etc)
	text = text.replace(/^#{1,6}\s+/gm, "")

	// Convert blockquotes (remove > )
	text = text.replace(/^>\s+/gm, "")

	// Convert unordered lists (remove - * +)
	text = text.replace(/^[\s]*[-*+]\s+/gm, "• ")

	// Convert ordered lists (remove numbers)
	text = text.replace(/^[\s]*\d+\.\s+/gm, "• ")

	// Remove horizontal rules
	text = text.replace(/^[-*_]{3,}$/gm, "")

	// Clean up extra whitespace and newlines
	text = text.replace(/\n{3,}/g, "\n\n")
	text = text.replace(/^\s+|\s+$/g, "")

	return text
}

export const sendNotification = internalMutation({
	args: {
		userId: v.id("users"),
		messageId: v.id("messages"),
		channelId: v.id("channels"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId)
		if (!message) return

		const author = await ctx.db.get(message.authorId)
		if (!author) return
		const channel = await ctx.db.get(args.channelId)
		if (!channel) return

		const organization = await ctx.db.get(channel.organizationId)
		if (!organization) return

		const channelMembers = await ctx.db
			.query("channelMembers")
			.withIndex("by_channelIdAndUserId", (q) => q.eq("channelId", args.channelId))
			.collect()

		const filteredChannelMembers = channelMembers.filter(
			(member) => !member.isMuted && member.userId !== args.userId,
		)

		await asyncMap(filteredChannelMembers, async (member) => {
			const user = await ctx.db.get(member.userId)
			if (!user) return
			
			// Find the user's organization membership
			const orgMember = await ctx.db
				.query("organizationMembers")
				.withIndex("by_organizationId_userId", (q) => 
					q.eq("organizationId", organization._id).eq("userId", user._id)
				)
				.first()
			
			if (!orgMember) return

			await ctx.db.insert("notifications", {
				memberId: orgMember._id,
				targetedResourceId: args.channelId,
				resourceId: args.messageId,
			})
		})

		const onlineUsers = await ctx.runQuery(internal.presence.listRoom, {
			roomId: args.channelId,
			onlineOnly: true,
		})

		await asyncMap(filteredChannelMembers, async (member) => {
			if (!onlineUsers.find((user) => user.userId === member.userId)) return

			await ctx.db.patch(member._id, {
				notificationCount: member.notificationCount + 1,
				lastSeenMessageId: member.lastSeenMessageId ?? message._id,
			})

			const user = await ctx.db.get(member.userId)

			if (!user) {
				return
			}

			const title =
				channel.type === "single" || channel.type === "direct"
					? `${author.firstName} ${author.lastName}`
					: `${author.firstName} ${author.lastName} (#${channel.name}, ${organization.name})`

			const plainTextContent = markdownToPlainText(message.content)

			await ctx.scheduler.runAfter(0, internal.expo.sendPushNotification, {
				title: title,
				to: user._id,
				body: plainTextContent,
			})
		})
	},
})
