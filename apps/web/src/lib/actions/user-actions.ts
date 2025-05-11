import type { Zero } from "@rocicorp/zero"
import type { Schema } from "../../../../../packages/zero/src/drizzle-zero.gen"
import { newId } from "../id-helpers"

export const createJoinChannelMutation = async ({
	userIds,
	serverId,
	z,
}: { serverId: string; userIds: string[]; z: Zero<Schema> }) => {
	const isSingleUser = userIds.length === 1
	if (userIds.length === 1) {
		const potentialChannel = await z.query.serverChannels
			.where("channelType", "=", "single")
			.where("serverId", "=", serverId)
			.whereExists("users", (q) => q.where("id", "=", userIds[0]))
			.whereExists("users", (q) => q.where("id", "=", z.userID))
			.related("users")
			.limit(100)
			.one()
			.run()

		if (potentialChannel) {
			return {
				channelId: potentialChannel.id,
			}
		}
	}

	const channelid = newId("serverChannels")

	await z.mutateBatch(async (tx) => {
		await tx.serverChannels.insert({
			id: channelid,
			createdAt: new Date().getTime(),
			serverId: serverId,
			channelType: isSingleUser ? "single" : "direct",
			name: "DM",
		})

		await tx.channelMembers.insert({
			userId: z.userID,
			channelId: channelid,
		})

		const filteredUserIds = userIds.filter((id) => id !== z.userID)
		for (const userId of filteredUserIds) {
			await tx.channelMembers.insert({ userId: userId, channelId: channelid })
		}
	})

	return {
		channelId: channelid,
	}
}
