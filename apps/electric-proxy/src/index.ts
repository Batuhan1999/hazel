import { ConfigProvider, Effect } from "effect"
import { type AuthenticationError, validateSession } from "./auth"
import { prepareElectricUrl, proxyElectricRequest } from "./electric-proxy"
import { validateTable } from "./tables"

/**
 * Get CORS headers for response
 * Note: When using credentials, we must specify exact origin instead of "*"
 */
function getCorsHeaders(request: Request, allowedOrigin: string): HeadersInit {
	const requestOrigin = request.headers.get("Origin")

	// Only set Access-Control-Allow-Origin if the request origin matches the allowed origin
	const origin = requestOrigin === allowedOrigin ? allowedOrigin : "null"

	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Cookie, Authorization",
		"Access-Control-Allow-Credentials": "true",
		Vary: "Origin, Cookie",
	}
}

/**
 * Main proxy handler using Effect-based flow
 */
const handleRequest = (request: Request, env: Env) =>
	Effect.gen(function* () {
		const allowedOrigin = env.ALLOWED_ORIGIN || "http://localhost:3000"

		// Handle CORS preflight
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: getCorsHeaders(request, allowedOrigin),
			})
		}

		// Only allow GET and DELETE methods (Electric protocol)
		if (request.method !== "GET" && request.method !== "DELETE") {
			return new Response("Method not allowed", {
				status: 405,
				headers: {
					Allow: "GET, DELETE, OPTIONS",
					...getCorsHeaders(request, allowedOrigin),
				},
			})
		}

		// Validate configuration
		if (!env.ELECTRIC_URL) {
			return new Response("ELECTRIC_URL not configured", {
				status: 500,
				headers: getCorsHeaders(request, allowedOrigin),
			})
		}

		if (!env.WORKOS_API_KEY || !env.WORKOS_CLIENT_ID || !env.WORKOS_COOKIE_PASSWORD) {
			return new Response("WorkOS configuration missing", {
				status: 500,
				headers: getCorsHeaders(request, allowedOrigin),
			})
		}

		console.log("env", env)

		// Authenticate user
		const _user = yield* validateSession(request, {
			WORKOS_API_KEY: env.WORKOS_API_KEY,
			WORKOS_CLIENT_ID: env.WORKOS_CLIENT_ID,
			WORKOS_COOKIE_PASSWORD: env.WORKOS_COOKIE_PASSWORD,
		})
		// TODO: Use user context for table-specific WHERE clause filtering

		// Extract and validate table parameter
		const searchParams = new URL(request.url).searchParams
		const tableParam = searchParams.get("table")

		const tableValidation = validateTable(tableParam)
		if (!tableValidation.valid) {
			return new Response(
				JSON.stringify({
					error: tableValidation.error,
				}),
				{
					status: tableParam ? 403 : 400,
					headers: {
						"Content-Type": "application/json",
						...getCorsHeaders(request, allowedOrigin),
					},
				},
			)
		}

		// Prepare Electric URL and proxy the request
		const originUrl = prepareElectricUrl(request.url)
		originUrl.searchParams.set("table", tableValidation.table!)

		// Proxy request to Electric
		const response = yield* Effect.promise(() => proxyElectricRequest(originUrl))

		// Add CORS headers to response
		const headers = new Headers(response.headers)
		for (const [key, value] of Object.entries(getCorsHeaders(request, allowedOrigin))) {
			headers.set(key, value)
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		})
	})

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const allowedOrigin = env.ALLOWED_ORIGIN || "http://localhost:3000"

		console.log("env", env)
		// Run Effect pipeline
		const program = handleRequest(request, env).pipe(
			Effect.catchTag("AuthenticationError", (error: AuthenticationError) =>
				Effect.succeed(
					new Response(
						JSON.stringify({
							error: error.message,
							detail: error.detail,
						}),
						{
							status: 401,
							headers: {
								"Content-Type": "application/json",
								...getCorsHeaders(request, allowedOrigin),
							},
						},
					),
				),
			),
			Effect.catchAll((error) =>
				Effect.succeed(
					new Response(
						JSON.stringify({
							error: "Internal server error",
							detail: String(error),
						}),
						{
							status: 500,
							headers: {
								"Content-Type": "application/json",
								...getCorsHeaders(request, allowedOrigin),
							},
						},
					),
				),
			),
		)

		return await Effect.runPromise(program.pipe(Effect.withConfigProvider(ConfigProvider.fromJson(env))))
	},
} satisfies ExportedHandler<Env>
