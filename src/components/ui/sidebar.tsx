import { Show, splitProps } from "solid-js"
import type { JSX } from "solid-js/jsx-runtime"
import { twMerge } from "tailwind-merge"

const SidebarRoot = (props: JSX.IntrinsicElements["div"]) => {
	const [local, rest] = splitProps(props, ["class", "children"])

	return (
		<div
			class={twMerge("flex h-full flex-col gap-6 bg-sidebar px-2 py-3 text-sidebar-foreground", local.class)}
			{...rest}
		>
			{local.children}
		</div>
	)
}

export type SidebarGroupProps = {
	title?: string
	action?: JSX.Element
} & JSX.IntrinsicElements["ul"]

const SidebarGroup = (props: SidebarGroupProps) => {
	const [local, rest] = splitProps(props, ["class", "children", "title", "action"])

	return (
		<ul class={twMerge("group/sidebar-group flex flex-col gap-2", local.class)} {...rest}>
			<Show when={local.title}>
				<div class="flex items-center justify-between px-2">
					<div class="text-muted-foreground text-xs">{local.title}</div>
					<Show when={local.action}>{local.action}</Show>
				</div>
			</Show>
			{local.children}
		</ul>
	)
}

const SidebarItem = (props: JSX.IntrinsicElements["li"]) => {
	const [local, rest] = splitProps(props, ["class", "children"])

	return (
		<li
			class={twMerge(
				"group/sidebar-item flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted",
				local.class,
			)}
			{...rest}
		>
			{local.children}
		</li>
	)
}

export const Sidebar = Object.assign(SidebarRoot, {
	Group: SidebarGroup,
	Item: SidebarItem,
})
