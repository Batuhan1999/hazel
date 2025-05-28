import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	servers: defineTable({
		name: v.string(),
		slug: v.string(),
		imageUrl: v.optional(v.string()),
		ownerId: v.id("users"),
		type: v.union(v.literal("public"), v.literal("private")),
		updatedAt: v.number(),
	}),
	serverChannels: defineTable({
		name: v.string(),
		serverId: v.id("servers"),
		type: v.union(
			v.literal("public"),
			v.literal("private"),
			v.literal("thread"),
			v.literal("direct"),
			v.literal("single"),
		),
		parentChannelId: v.optional(v.id("serverChannels")),
		updatedAt: v.number(),
	}),
	serverMembers: defineTable({
		userId: v.id("users"),
		serverId: v.id("servers"),
		role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
		joinedAt: v.number(),
	}),
	messages: defineTable({
		attachedFiles: v.array(v.string()),
		authorId: v.id("users"),
		channelId: v.id("serverChannels"),
		content: v.string(),
		replyToMessageId: v.optional(v.id("messages")),
		threadChannelId: v.optional(v.id("serverChannels")),
		deletedAt: v.optional(v.number()),
		updatedAt: v.number(),
	}),
	users: defineTable({
		externalId: v.string(),
		displayName: v.string(),
		tag: v.string(),
		avatarUrl: v.string(),
		lastSeen: v.number(),
		tokenIdentifier: v.string(),
		status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
	})
		.index("by_externalId", ["externalId"])
		.index("bg_tokenIdentifier", ["tokenIdentifier"]),
	channelMembers: defineTable({
		userId: v.id("users"),
		channelId: v.id("serverChannels"),
		isHidden: v.boolean(),
		isMuted: v.boolean(),
		joinedAt: v.number(),
	}),
	pinnedMessages: defineTable({
		messageId: v.id("messages"),
		channelId: v.id("serverChannels"),
	}),
	reactions: defineTable({
		messageId: v.id("messages"),
		userId: v.id("users"),
		emoji: v.string(),
	}),
})
