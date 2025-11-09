import { HttpApiBuilder, HttpPlatform, HttpServer } from "@effect/platform"
import { Layer, Logger, pipe } from "effect"
import { MyHttpApi } from "./api"
import { HttpAppLive } from "./handle"

const HttpLive = HttpApiBuilder.api(MyHttpApi).pipe(Layer.provide([HttpAppLive]))

const Live = pipe(
	HttpApiBuilder.Router.Live,
	Layer.provideMerge(HttpLive),
	Layer.provideMerge(HttpServer.layerContext),
	Layer.provide(Logger.pretty),
)

export default {
	async fetch(request, env, _v_ctxtx): Promise<Response> {
		Object.assign(globalThis, {
			env,
		})

		const handler = HttpApiBuilder.toWebHandler(Live)

		return handler.handler(request as unknown as Request)
	},
} satisfies ExportedHandler<Env>
