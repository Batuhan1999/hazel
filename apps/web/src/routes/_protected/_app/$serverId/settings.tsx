import { api } from "@hazel/backend/api"
import { createFileRoute } from "@tanstack/solid-router"
import { Show } from "solid-js"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { createQuery } from "~/lib/convex"

export const Route = createFileRoute("/_protected/_app/$serverId/settings")({
	component: RouteComponent,
})

function RouteComponent() {
	const notificationStatus = createQuery(api.expo.getStatusForUser)

	return (
		<div>
			<Card>
				<Card.Header>
					<Card.Title>Notifications</Card.Title>
				</Card.Header>
				<Card.Content>
					<Show when={notificationStatus()} keyed>
						{(status) => (
							<>
								<div class="flex grid-rows-subgrid flex-col gap-2">
									<div class="flex items-center gap-2">
										<div class="text-muted-foreground text-sm">
											{status.paused ? "Paused" : "Active"}
										</div>
										<Button
										// onClick={() => api.expo.pauseNotificationsForUser({})}
										>
											{status.paused ? "Resume" : "Pause"}
										</Button>
									</div>
									<div class="flex items-center gap-2">
										<div class="text-muted-foreground text-sm">
											{status.hasToken ? "Registered" : "Not Registered"}
										</div>
										<Button
										// onClick={() => api.expo.recordPushNotificationToken({})}
										>
											{status.hasToken ? "Unregister" : "Register"}
										</Button>
									</div>
								</div>
							</>
						)}
					</Show>
				</Card.Content>
			</Card>
		</div>
	)
}
