import { HttpApiBuilder, HttpServer } from "@effect/platform"
import { Layer, Logger, pipe } from "effect"
import { LinkPreviewApi } from "./api"
import { makeKVCacheLayer } from "./cache"
import { HttpAppLive, HttpLinkPreviewLive, HttpTweetLive } from "./handle"

const HttpLive = HttpApiBuilder.api(LinkPreviewApi).pipe(
	Layer.provide([HttpAppLive, HttpLinkPreviewLive, HttpTweetLive]),
)

const makeHttpLiveWithKV = (env: Env) =>
	pipe(
		HttpApiBuilder.Router.Live,
		Layer.provideMerge(HttpLive),
		Layer.provideMerge(
			HttpApiBuilder.middlewareCors({
				allowedOrigins: ["*"],
			}),
		),
		Layer.provideMerge(HttpServer.layerContext),
		Layer.provide(makeKVCacheLayer(env.LINK_CACHE)),
		Layer.provide(Logger.pretty),
	)

export default {
	async fetch(request, env, _ctx): Promise<Response> {
		Object.assign(globalThis, {
			env,
		})

		const Live = makeHttpLiveWithKV(env)
		const handler = HttpApiBuilder.toWebHandler(Live)

		return handler.handler(request as unknown as Request)
	},
} satisfies ExportedHandler<Env>
