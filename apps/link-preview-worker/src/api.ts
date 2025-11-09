import { HttpApi, OpenApi } from "@effect/platform"
import { AppApi } from "./declare"

export class MyHttpApi extends HttpApi.make("api")
	.add(AppApi)
	.annotateContext(
		OpenApi.annotations({
			title: "Public Api",
			description: "Public Api",
		}),
	) {}
