import { createFileRoute } from "@tanstack/solid-router"
import { For, createMemo, createSignal } from "solid-js"
import { IconChat } from "~/components/icons/chat"
import { IconHorizontalDots } from "~/components/icons/horizontal-dots"
import { IconSearch } from "~/components/icons/search"
import { Avatar } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { TextField } from "~/components/ui/text-field"
import { createJoinChannelMutation } from "~/lib/actions/user-actions"
import { useServerMembers } from "~/lib/hooks/data/use-server-members"
import { useZero } from "~/lib/zero/zero-context"

export const Route = createFileRoute("/_app/$serverId/")({
	component: RouteComponent,
})

function RouteComponent() {
	const z = useZero()

	const params = Route.useParams()
	const serverId = createMemo(() => params().serverId)

	const [searchQuery, setSearchQuery] = createSignal("")

	const { members } = useServerMembers({ serverId, searchQuery })

	const navigate = Route.useNavigate()

	const handleOpenChat = async ({ targetUserId, serverId }: { targetUserId: string; serverId: string }) => {
		if (!targetUserId) {
			return
		}

		const { channelId } = await createJoinChannelMutation({
			z,
			serverId: serverId,
			userIds: [targetUserId],
		})

		navigate({ to: "/$serverId/chat/$id" as const, params: { id: channelId, serverId } })
	}

	return (
		<div class="container mx-auto px-6 py-12">
			<div class="flex flex-col gap-2">
				<TextField
					value={searchQuery()}
					onInput={(props) => {
						setSearchQuery(props.target.value)
					}}
					prefix={<IconSearch class="ml-3 size-5" />}
					placeholder="Search Members"
				/>
				<For each={members()}>
					{(member) => (
						<div class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
							<div class="flex items-center gap-2">
								<Avatar src={member.user!.avatarUrl} name={member.user!.displayName} />

								<div>
									<p>{member.user?.displayName}</p>
									<p class="text-muted-foreground">{member.user?.tag}</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Button
									intent="ghost"
									size="square"
									onClick={() =>
										handleOpenChat({
											targetUserId: member.user!.id,
											serverId: serverId(),
										})
									}
								>
									<IconChat />
								</Button>
								<Button intent="ghost" size="square">
									<IconHorizontalDots />
								</Button>
							</div>
						</div>
					)}
				</For>
			</div>
		</div>
	)
}
