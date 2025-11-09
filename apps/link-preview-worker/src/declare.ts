import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Schema } from "effect"

export class AppApi extends HttpApiGroup.make("app")

	.add(HttpApiEndpoint.get("health", "/health").addSuccess(Schema.String))
	.annotateContext(
		OpenApi.annotations({
			title: "App Api",
			description: "App Api",
		}),
	) {}
