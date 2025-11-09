import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { MyHttpApi } from "./api"

export const HttpAppLive = HttpApiBuilder.group(MyHttpApi, "app", (handles) =>
	Effect.gen(function* () {
		yield* Effect.log("Hello")

		return handles.handle("health", () => Effect.succeed("ok"))
	}),
)
