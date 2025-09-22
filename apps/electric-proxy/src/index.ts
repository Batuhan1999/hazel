// import { Config, ConfigProvider, Effect, Layer, ManagedRuntime, Redacted, Runtime, Runtime } from "effect"

// const makeProxyService = Effect.gen(function* () {
// 	const electricUrl = yield* Config.string("ELECTRIC_URL")
// 	const electricSecret = yield* Config.redacted("ELECTRIC_SECRET")
// 	const electricSourceId = yield* Config.string("ELECTRIC_SOURCE_ID")
// 	const port = yield* Config.withDefault(Config.number("PORT"), 3004)

// 	const handleRequest = (request: Request): Effect.Effect<Response, Error> =>
// 		Effect.gen(function* () {
// 			const url = new URL(request.url)

// 			if (url.pathname !== "/electric/proxy") {
// 				return new Response("Not Found", { status: 404 })
// 			}

// 			const table = url.searchParams.get("table")
// 			if (!table) {
// 				return new Response(JSON.stringify({ message: "Needs to have a table param" }), {
// 					status: 400,
// 					headers: { "Content-Type": "application/json" },
// 				})
// 			}

// 			const originUrl = new URL("/v1/shape", electricUrl)

// 			const allowedParams = ["live", "table", "handle", "offset", "cursor"]
// 			url.searchParams.forEach((value, key) => {
// 				if (allowedParams.includes(key)) {
// 					originUrl.searchParams.set(key, value)
// 				}
// 			})

// 			originUrl.searchParams.set("source_id", electricSourceId)
// 			originUrl.searchParams.set("source_secret", Redacted.value(electricSecret))

// 			const resp = yield* Effect.tryPromise({
// 				try: () => fetch(originUrl.toString()),
// 				catch: (error) => new Error(`Proxy fetch failed: ${error}`),
// 			})

// 			const newHeaders = new Headers(resp.headers)
// 			newHeaders.delete("content-encoding")
// 			newHeaders.delete("content-length")
// 			newHeaders.set("Vary", "Authorization")
// 			newHeaders.set("Access-Control-Allow-Origin", "*")
// 			newHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS")
// 			newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

// 			return new Response(resp.body, {
// 				status: resp.status,
// 				statusText: resp.statusText,
// 				headers: newHeaders,
// 			})
// 		})

// 	return { handleRequest, port }
// })

// class ProxyService extends Effect.Tag("ProxyService")<
// 	ProxyService,
// 	Effect.Effect.Success<typeof makeProxyService>
// >() {}

// const ProxyServiceLive = Layer.effect(ProxyService, makeProxyService)

// const MainLive = ProxyServiceLive.pipe(Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())))

// const MainRuntime = ManagedRuntime.make(Layer.empty)

// const program = Effect.gen(function* () {
// 	const { handleRequest, port } = yield* ProxyService

// 	const server = Bun.serve({
// 		port,
// 		async fetch(request) {
// 			const response = await MainRuntime.runPromise(handleRequest(request))
// 			return response
// 		},
// 	})

// 	console.log(`Electric SQL Proxy running on http://localhost:${server.port}`)

// 	return server
// })

// const runnable = program.pipe(Effect.provide(MainLive))

// Effect.runPromise(runnable).catch((error) => {
// 	console.error("Failed to start Electric SQL Proxy:", error)
// 	process.exit(1)
// })

// process.on("SIGTERM", () => {
// 	console.log("Shutting down Electric SQL Proxy...")
// 	process.exit(0)
// })

// process.on("SIGINT", () => {
// 	console.log("Shutting down Electric SQL Proxy...")
// 	process.exit(0)
// })

Bun.serve({
	idleTimeout: 255,

	routes: {
		"/electric/proxy": async (req) => {
			const proxyUrl = new URL(req.url)

			const originUrl = new URL(`/v1/shape`, `https://api.electric-sql.cloud`)
			proxyUrl.searchParams.forEach((value, key) => {
				originUrl.searchParams.set(key, value)
			})

			originUrl.searchParams.set(`source_id`, process.env.ELECTRIC_SOURCE_ID!)
			originUrl.searchParams.set(`secret`, process.env.ELECTRIC_SECRET!)

			const response = await fetch(originUrl)

			// Fetch decompresses the body but doesn't remove the
			// content-encoding & content-length headers which would
			// break decoding in the browser.
			//
			// See https://github.com/whatwg/fetch/issues/1729
			const headers = new Headers(response.headers)
			headers.delete(`content-encoding`)
			headers.delete(`content-length`)

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			})
		},
	},
})
