import { HttpApiBuilder, HttpApiScalar, HttpMiddleware, HttpServer } from "@effect/platform"
import { ConfigProvider, Effect, Layer } from "effect"

import { oldUploadHandler } from "./http/old-upload"

import { MakiApi } from "@maki-chat/api-schema"
import { HttpLive } from "./http"

const Live = HttpLive.pipe()

const HttpApiScalarLayer = HttpApiScalar.layer().pipe(Layer.provide(Live))

declare global {
	var env: Env
	var waitUntil: (promise: Promise<any>) => Promise<void>
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		Object.assign(globalThis, {
			env,
			waitUntil: ctx.waitUntil,
		})

		const url = new URL(request.url)
		if (url.pathname === "/upload") {
			return await oldUploadHandler(request)!
		}

		const ConfigLayer = Layer.setConfigProvider(
			ConfigProvider.fromJson({ ...env, DATABASE_URL: env.HYPERDRIVE.connectionString }),
		)

		const { dispose, handler } = HttpApiBuilder.toWebHandler(
			Layer.mergeAll(Live, HttpApiScalarLayer, HttpServer.layerContext).pipe(Layer.provide(ConfigLayer)),
			{
				middleware: HttpMiddleware.cors(),
			},
		)

		const res = await handler(request)

		ctx.waitUntil(dispose())

		return res
	},
} satisfies ExportedHandler<Env>
