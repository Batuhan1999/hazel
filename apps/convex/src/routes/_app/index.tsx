import { createFileRoute } from "@tanstack/solid-router"
import { createEffect } from "solid-js"
import { createPaginatedQuery } from "~/lib/convex"
import { useConvexAuth } from "~/lib/convex/convex-auth-state"

export const Route = createFileRoute("/_app/")({
	component: RouteComponent,
})

function RouteComponent() {
	const context = Route.useRouteContext()

	const { isLoading, isAuthenticated } = useConvexAuth()

	createEffect(() => {
		console.log("isLoggedIn", context().auth.isSignedIn())
	})

	return <div>Hello "/"!</div>
}
