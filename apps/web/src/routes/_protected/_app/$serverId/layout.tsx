import type { Id } from "@hazel/backend"
import { api } from "@hazel/backend/api"

import { useQuery } from "@tanstack/solid-query"
import { Outlet, createFileRoute, redirect } from "@tanstack/solid-router"
import { Suspense, createEffect } from "solid-js"
import { Sidebar } from "~/components/ui/sidebar"
import { convexQuery } from "~/lib/convex-query"
import { removeCurrentServerId, setCurrentServerId } from "~/lib/helpers/localstorage"
import { AppSidebar } from "./-components/app-sidebar"

export const Route = createFileRoute("/_protected/_app/$serverId")({
	component: RouteComponent,
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(
			convexQuery(api.channels.getChannels, { serverId: params.serverId as Id<"servers"> }),
		),
})

function RouteComponent() {
	const navigate = Route.useNavigate()
	const params = Route.useParams()
	const serverQuery = useQuery(() =>
		convexQuery(api.servers.getServerForUser, {
			serverId: params().serverId as Id<"servers">,
		}),
	)

	createEffect(() => {
		if (!serverQuery.data && serverQuery.status !== "pending") {
			removeCurrentServerId()
			navigate({
				to: "/",
			})
		}
	})

	return (
		<Suspense>
			<Sidebar.Provider>
				<AppSidebar />
				{/* <div class="fixed inset-y-0 border-r bg-sidebar/90 pb-4 lg:left-0 lg:z-50 lg:block lg:w-14 lg:overflow-y-auto">
				<ServerSelectSidebar />
			</div> */}
				<Sidebar.Inset>
					<Outlet />
				</Sidebar.Inset>
			</Sidebar.Provider>
		</Suspense>
	)
}
