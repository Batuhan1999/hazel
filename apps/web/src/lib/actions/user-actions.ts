import type { Zero } from "@rocicorp/zero"
import { newId } from "../id-helpers"
import type { Schema } from "../zero/drizzle-zero.gen"

export const createJoinChannelMutation = async ({
	userIds,
	serverId,
	z,
}: { serverId: string; userIds: string[]; z: Zero<Schema> }) => {
	if (userIds.length === 1) {
		const channel = await z.query.serverChannels
			.whereExists("users", (q) => q.where("id", "=", userIds[0]))
			.one()
			.run()

		return {
			channelId: channel?.id!,
		}
	}

	const channelid = newId("serverChannels")

	await z.mutateBatch(async (tx) => {
		await tx.serverChannels.insert({
			id: channelid,
			createdAt: new Date().getTime(),
			serverId: serverId,
			channelType: "direct",
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
