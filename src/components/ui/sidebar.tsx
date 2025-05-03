import { splitProps } from "solid-js"
import type { JSX } from "solid-js/jsx-runtime"
import { twMerge } from "tailwind-merge"

export const Sidebar = (props: JSX.IntrinsicElements["div"]) => {
	const [local, rest] = splitProps(props, ["class", "children"])

	return (
		<div
			class={twMerge("flex h-full flex-col bg-sidebar px-2 py-3 text-sidebar-foreground", local.class)}
			{...rest}
		>
			{local.children}
		</div>
	)
}

export const SidebarItem = (props: JSX.IntrinsicElements["li"]) => {
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
