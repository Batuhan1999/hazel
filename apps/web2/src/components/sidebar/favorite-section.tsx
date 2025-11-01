import type { OrganizationId } from "@hazel/db/schema"
import { and, eq, useLiveQuery } from "@tanstack/react-db"
import { useMemo } from "react"
import IconHashtag from "~/components/icons/icon-hashtag"
import { SidebarItem, SidebarLabel, SidebarSection } from "~/components/ui/sidebar"
import { Strong } from "~/components/ui/text"
import { channelCollection, channelMemberCollection } from "~/db/collections"
import { useAuth } from "~/lib/auth"
import { ChannelItem } from "./channel-item"

export const FavoriteSection = (props: { organizationId: OrganizationId }) => {
	const { user } = useAuth()

	const { data: favoriteChannels } = useLiveQuery(
		(q) =>
			q
				.from({ channel: channelCollection })
				.innerJoin({ member: channelMemberCollection }, ({ channel, member }) =>
					eq(member.channelId, channel.id),
				)
				.where((q) =>
					and(
						eq(q.channel.organizationId, props.organizationId),
						eq(q.member.userId, user?.id || ""),
						eq(q.member.isFavorite, true),
						eq(q.member.isHidden, false),
					),
				)
				.orderBy(({ channel }) => channel.createdAt, "asc"),
		[user?.id, props.organizationId],
	)

	const { publicPrivateChannels, dmChannels } = useMemo(() => {
		if (!favoriteChannels) return { publicPrivateChannels: [], dmChannels: [] }

		const publicPrivate: Array<{
			channel: (typeof favoriteChannels)[0]["channel"]
			member: (typeof favoriteChannels)[0]["member"]
		}> = []
		const dm: Array<(typeof favoriteChannels)[0]["channel"]> = []

		favoriteChannels.forEach((row) => {
			if (row.channel.type === "public" || row.channel.type === "private") {
				publicPrivate.push({ channel: row.channel, member: row.member })
			} else if (row.channel.type === "direct" || row.channel.type === "single") {
				dm.push(row.channel)
			}
		})

		return { publicPrivateChannels: publicPrivate, dmChannels: dm }
	}, [favoriteChannels])

	if (!favoriteChannels || favoriteChannels.length === 0) {
		return null
	}

	return (
		<SidebarSection>
			<div className="col-span-full flex items-center justify-between gap-x-2 pl-2.5 text-muted-fg text-xs/5">
				<Strong>Favorites</Strong>
			</div>
			{publicPrivateChannels.map(({ channel, member }) => (
				<ChannelItem key={channel.id} channel={channel} member={member} />
			))}
			{dmChannels.map((channel) => (
				<SidebarItem key={channel.id} href={"/"} tooltip={channel.name}>
					<IconHashtag />
					<SidebarLabel>{channel.name}</SidebarLabel>
				</SidebarItem>
			))}
		</SidebarSection>
	)
}
