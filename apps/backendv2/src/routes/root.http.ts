import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { HazelApp } from "../api"

export const HttpRootLive = HttpApiBuilder.group(HazelApp, "root", (handlers) =>
	handlers.handle(
		"root",
		Effect.fnUntraced(function* () {
			return "Hello World"
		}),
	),
)
