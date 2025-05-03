import { Link, useParams } from "@tanstack/solid-router"
import { useAuth } from "clerk-solidjs"
import { For, createMemo } from "solid-js"
import { twMerge } from "tailwind-merge"
import { useDmChannels } from "~/lib/hooks/data/use-dm-channels"
import { useServerChannels } from "~/lib/hooks/data/use-server-channels"
import type { Channel } from "~/lib/schema"
import { IconHashtag } from "./icons/hashtag"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Sidebar, SidebarItem } from "./ui/sidebar"

export interface SidebarProps {
	class?: string
}

export const AppSidebar = (props: SidebarProps) => {
	const params = useParams({ from: "/_app/$serverId" })
	const serverId = createMemo(() => params().serverId)

	const { channels: dmChannels } = useDmChannels(serverId)
	const { channels: serverChannels } = useServerChannels(serverId)

	const { userId } = useAuth()

	const computedChannels = createMemo(() => {
		return dmChannels()
			.map((channel) => {
				const friends = channel.users.filter((user) => user.id !== userId())
				const isSingleDm = friends.length === 1

				if (friends.length === 0) return null

				return {
					...channel,
					isSingleDm,
					friends,
				}
			})
			.filter((channel) => channel !== null)
	})

	return (
		<Sidebar {...props}>
			<ul class="flex flex-col gap-3">
				<For each={serverChannels()}>
					{(channel) => <ChannelItem channel={channel} serverId={serverId()} />}
				</For>
				<For each={computedChannels()}>
					{(channel) => <DmChannelLink channel={channel} serverId={serverId()} />}
				</For>
			</ul>
		</Sidebar>
	)
}

export interface ChannelItemProps {
	channel: Channel
	serverId: string
}

export const ChannelItem = (props: ChannelItemProps) => {
	return (
		<Link to="/$serverId/chat/$id" params={{ serverId: props.serverId, id: props.channel.id }}>
			<SidebarItem>
				<IconHashtag class="size-5 text-muted-foreground" />
				<p class="text-muted-foreground group-hover/sidebar-item:text-foreground">{props.channel.name}</p>
			</SidebarItem>
		</Link>
	)
}

interface Friend {
	id: string
	avatarUrl: string
	tag: string
	displayName: string
}

interface ComputedChannel {
	id: string
	friends: Friend[]
}

interface DmChannelLinkProps {
	channel: ComputedChannel
	serverId: string
}

const DmChannelLink = (props: DmChannelLinkProps) => {
	return (
		<Link to="/$serverId/chat/$id" params={{ serverId: props.serverId, id: props.channel.id }}>
			<SidebarItem>
				<div class="-space-x-4 flex items-center justify-center">
					<For each={props.channel.friends}>
						{(friend) => (
							<div class="inline-block">
								<Avatar class="size-7">
									<AvatarImage src={friend.avatarUrl} alt={friend.tag} />
									<AvatarFallback>{friend.displayName}</AvatarFallback>
								</Avatar>
							</div>
						)}
					</For>
				</div>
				<p class="text-muted-foreground group-hover/sidebar-item:text-foreground">
					{/* Derive display name directly from props */}
					{props.channel.friends.map((friend) => friend.displayName).join(", ")}
				</p>
			</SidebarItem>
		</Link>
	)
}
