import { Outlet, createRootRouteWithContext } from "@tanstack/solid-router"

import type { useAuth } from "clerk-solidjs"
import type { ConvexSolidClient } from "~/lib/convex"
import { useConvexAuth } from "~/lib/convex/convex-auth-state"

interface RootContext {
	auth: ReturnType<typeof useAuth>
	convex: ConvexSolidClient
}

export const Route = createRootRouteWithContext<RootContext>()({
	component: RootComponent,
})

function RootComponent() {
	const { isLoading } = useConvexAuth()

	if (isLoading()) return <p>Loading...</p>

	return <Outlet />
}
