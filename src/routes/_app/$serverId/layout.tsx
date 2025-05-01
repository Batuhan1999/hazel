import { Splitter } from "@ark-ui/solid"
import { Outlet, createFileRoute } from "@tanstack/solid-router"
import { createMemo } from "solid-js"
import { Sidebar } from "~/components/sidebar"
import { useDmChannels } from "~/lib/hooks/data/use-dm-channels"

export const Route = createFileRoute("/_app/$serverId")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<Splitter.Root panels={[{ id: "a", minSize: 15, maxSize: 20 }, { id: "b" }]}>
			<Splitter.Panel id="a">
				<Sidebar />
			</Splitter.Panel>
			<Splitter.ResizeTrigger class="h-12 w-1 bg-primary" id="a:b" aria-label="Resize" />
			<Splitter.Panel id="b">
				<Outlet />
			</Splitter.Panel>
		</Splitter.Root>
	)
}
