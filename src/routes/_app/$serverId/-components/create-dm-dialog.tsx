import { createListCollection } from "@ark-ui/solid"
import { createQuery } from "@rocicorp/zero/solid"
import { useNavigate } from "@tanstack/solid-router"
import { type Accessor, For, Index, createMemo, createSignal } from "solid-js"
import { IconPlusSmall } from "~/components/icons/plus-small"
import { Avatar } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Dialog } from "~/components/ui/dialog"
import { ListBox } from "~/components/ui/list-box"
import { TextField } from "~/components/ui/text-field"
import { newId } from "~/lib/id-helpers"
import type { User } from "~/lib/zero/schema"
import { useZero } from "~/lib/zero/zero-context"

export interface CreateDmDialogProps {
	serverId: Accessor<string>
}

export const CreateDmDialog = (props: CreateDmDialogProps) => {
	const z = useZero()
	const friendQuery = z.query.users

	const navigate = useNavigate()

	const [friends] = createQuery(() => friendQuery)

	const [friendFilter, setFriendFilter] = createSignal<string>("")

	const [isDialogOpen, setDialogOpen] = createSignal(false)

	const filteredFriends = createMemo(() => {
		if (friendFilter() === "") return friends()
		return friends().filter(
			(friend) =>
				friend.displayName.toLowerCase().includes(friendFilter().toLowerCase()) ||
				friend.tag.includes(friendFilter().toLowerCase()),
		)
	})

	const friendCollection = createMemo(() =>
		createListCollection({
			items: filteredFriends(),
			itemToString: (item) => item.displayName,
			itemToValue: (item) => item.tag,
		}),
	)

	const [selectFriends, setSelectedFriends] = createSignal<User[]>([])

	return (
		<Dialog open={isDialogOpen()} onOpenChange={(details) => setDialogOpen(details.open)}>
			<Dialog.Trigger
				class="text-muted-foreground"
				asChild={(props) => (
					<Button intent="ghost" size="icon" {...props}>
						<IconPlusSmall />
					</Button>
				)}
			/>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Select friends</Dialog.Title>
					<Dialog.Description>
						You can add {10 - selectFriends().length} more friends to this DM.
					</Dialog.Description>
				</Dialog.Header>
				<div class="flex flex-col gap-2">
					<div class="flex w-full flex-wrap gap-2 overflow-hidden">
						<For each={selectFriends()}>{(friend) => <Badge>{friend.displayName}</Badge>}</For>
					</div>
					<TextField
						placeholder="Search friends"
						value={friendFilter()}
						onInput={(e) => {
							setFriendFilter(e.target.value)
						}}
					/>
					<ListBox
						id="friendList"
						collection={friendCollection()}
						value={selectFriends().map((friend) => friend.tag)}
						onValueChange={(e: any) => {
							setSelectedFriends(e.items)
						}}
						selectionMode="multiple"
						loopFocus
					>
						<ListBox.Content class="border-none">
							<Index each={friendCollection().items}>
								{(item) => (
									<ListBox.Item item={item()}>
										<div class="flex items-center gap-3">
											<Avatar size="xs" src={item().avatarUrl} name={item().displayName} />
											<ListBox.ItemText>{item().displayName}</ListBox.ItemText>
										</div>

										<ListBox.ItemIndicator />
									</ListBox.Item>
								)}
							</Index>
						</ListBox.Content>
					</ListBox>
				</div>
				<Dialog.Footer>
					<Button
						intent="default"
						onClick={async () => {
							const userIds = selectFriends().map((friend) => friend.id)

							if (userIds.length === 1) {
								const channel = await z.query.serverChannels
									.whereExists("users", (q) => q.where("id", "=", userIds[0]))
									.one()
									.run()

								if (channel) {
									navigate({
										to: "/$serverId/chat/$id",
										params: { id: channel.id, serverId: props.serverId() },
									})
									return
								}
							}

							const channelid = newId("serverChannels")

							await z.mutateBatch(async (tx) => {
								await tx.serverChannels.insert({
									id: channelid,
									createdAt: new Date().getTime(),
									serverId: props.serverId(),
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

							setDialogOpen(false)

							setSelectedFriends([])
							setFriendFilter("")

							navigate({
								to: "/$serverId/chat/$id" as const,
								params: { id: channelid, serverId: props.serverId() },
							})
						}}
					>
						Create DM
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	)
}
