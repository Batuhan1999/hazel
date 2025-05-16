import { createFileRoute } from "@tanstack/solid-router"

import { createVirtualizer } from "@tanstack/solid-virtual"

import { faker } from "@faker-js/faker"
import { For, Index, createEffect, createMemo } from "solid-js"
import { Button } from "~/components/ui/button"
import { useChatMessages } from "~/lib/hooks/data/use-chat-messages"

export const Route = createFileRoute("/virtualized")({
	component: RouteComponent,
})

function RouteComponent() {
	let parentRef: HTMLDivElement | undefined

	const { messages } = useChatMessages(() => "cha_2xsesAW65pajuEFu")

	const virtualizer = createMemo(() =>
		createVirtualizer({
			count: messages().length,
			getScrollElement: () => parentRef!,
			estimateSize: () => 30,
			getItemKey: (index) => messages()[index].id,
			enabled: true,
			overscan: 5,
		}),
	)

	createEffect(() => {
		console.log(messages().length - 1)
		virtualizer().scrollToIndex(messages().length - 1, {
			align: "center",
			behavior: "smooth",
		})
	})

	return (
		<div>
			<Button>
				<span>Scroll to bottom</span>
			</Button>
			<div
				class="flex flex-col overflow-y-auto contain-strict"
				style={{ width: "400px", height: "400px", "overflow-y": "auto" }}
				ref={parentRef}
			>
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						transform: `translateY(${virtualizer().getVirtualItems()[0]?.start ?? 0}px)`,
					}}
				>
					<For each={virtualizer().getVirtualItems()}>
						{(row) => (
							<div
								data-index={row.index}
								ref={(el) => queueMicrotask(() => virtualizer().measureElement(el))}
							>
								<div style={{ padding: "10px 0" }}>
									<div>Row {row.index}</div>
									<div>Item :D</div>
								</div>
							</div>
						)}
					</For>
				</div>
			</div>
		</div>
	)
}
