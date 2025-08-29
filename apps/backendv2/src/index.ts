import { OtlpTracer } from "@effect/opentelemetry"
import {
	FetchHttpClient,
	HttpApiScalar,
	HttpLayerRouter,
	HttpMiddleware,
	HttpServerResponse,
} from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { Layer } from "effect"
import { HazelApp } from "./api"
import { HttpApiRoutes } from "./http"
import { DatabaseLive } from "./services/db"

const HealthRouter = HttpLayerRouter.use((router) =>
	router.add("GET", "/health", HttpServerResponse.text("OK")),
)
const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
	api: HazelApp,
	path: "/docs",
})

const AllRoutes = Layer.mergeAll(HttpApiRoutes, HealthRouter, DocsRoute).pipe(
	Layer.provide(
		HttpLayerRouter.cors({
			allowedOrigins: ["*"],
			allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
			credentials: true,
		}),
	),
)

const TracerLive = OtlpTracer.layer({
	url: "http://localhost:4318/v1/traces",
	resource: {
		serviceName: "hazel-backend",
	},
}).pipe(Layer.provide(FetchHttpClient.layer))

const MainLive = Layer.mergeAll(DatabaseLive)

HttpLayerRouter.serve(AllRoutes).pipe(
	HttpMiddleware.withTracerDisabledWhen(
		(request) => request.url === "/health" || request.method === "OPTIONS",
	),
	Layer.provide(MainLive),
	Layer.provide(TracerLive),
	Layer.provide(BunHttpServer.layer({ port: 3003 })),
	Layer.launch,
	BunRuntime.runMain,
)
