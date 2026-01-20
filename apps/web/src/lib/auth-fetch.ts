/**
 * @module Shared authenticated fetch for desktop and web
 * @description Platform-aware fetch that uses Bearer tokens for desktop and cookies for web
 *
 * Desktop auth flow:
 * 1. Wait for any in-progress token refresh before making request
 * 2. On 401, attempt token refresh and retry once
 * 3. Only clear tokens if retry also fails
 */

import { Effect, Option } from "effect"
import { forceRefresh, waitForRefresh } from "~/atoms/desktop-auth"
import { TokenStorage } from "./services/desktop/token-storage"
import { isTauri } from "./tauri"

const TokenStorageLive = TokenStorage.Default

/**
 * Get access token from Tauri store (Promise-based for fetch compatibility)
 */
const getAccessToken = async (): Promise<string | null> => {
	if (!isTauri()) return null

	return Effect.runPromise(
		Effect.gen(function* () {
			const tokenStorage = yield* TokenStorage
			const tokenOpt = yield* tokenStorage.getAccessToken
			return Option.getOrNull(tokenOpt)
		}).pipe(
			Effect.provide(TokenStorageLive),
			Effect.catchAll(() => Effect.succeed(null)),
		),
	)
}

/**
 * Clear tokens from Tauri store (Promise-based for fetch compatibility)
 */
const clearTokens = async (): Promise<void> => {
	if (!isTauri()) return

	return Effect.runPromise(
		Effect.gen(function* () {
			const tokenStorage = yield* TokenStorage
			yield* tokenStorage.clearTokens
		}).pipe(
			Effect.provide(TokenStorageLive),
			Effect.catchAll(() => Effect.void),
		),
	)
}

/**
 * Make an authenticated request with a token
 */
const makeAuthenticatedRequest = async (
	input: RequestInfo | URL,
	init: RequestInit | undefined,
	token: string,
): Promise<Response> => {
	return fetch(input, {
		...init,
		headers: {
			...init?.headers,
			Authorization: `Bearer ${token}`,
		},
	})
}

/**
 * Authenticated fetch that handles both Tauri (Bearer token) and web (cookies)
 * - Tauri: Reads access token from Tauri store and sends as Authorization header
 *   - Waits for any in-progress refresh before making request
 *   - On 401, attempts token refresh and retries once
 * - Web: Uses credentials: "include" to send cookies
 */
export const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
	// Desktop: use Bearer token from Tauri store
	if (isTauri()) {
		// Wait for any in-progress token refresh before making the request
		await waitForRefresh()

		const token = await getAccessToken()
		if (token) {
			const response = await makeAuthenticatedRequest(input, init, token)

			// If 401 (expired/invalid token), try to refresh and retry once
			if (response.status === 401) {
				console.log("[auth-fetch] Got 401, attempting token refresh...")

				// Try to refresh the token
				const refreshed = await forceRefresh()

				if (refreshed) {
					// Get the new token and retry the request
					const newToken = await getAccessToken()
					if (newToken) {
						console.log("[auth-fetch] Token refreshed, retrying request...")
						const retryResponse = await makeAuthenticatedRequest(input, init, newToken)

						// If retry also fails with 401, clear tokens
						if (retryResponse.status === 401) {
							console.error("[auth-fetch] Retry failed with 401, clearing tokens")
							try {
								await clearTokens()
							} catch (error) {
								console.error("[auth-fetch] Failed to clear tokens:", error)
							}
						}

						return retryResponse
					}
				}

				// Refresh failed or no new token available, clear tokens
				console.error("[auth-fetch] Token refresh failed, clearing tokens")
				try {
					await clearTokens()
				} catch (error) {
					console.error("[auth-fetch] Failed to clear tokens:", error)
				}
			}

			return response
		}
	}

	// Web: use cookies
	const response = await fetch(input, { ...init, credentials: "include" })

	// If 401 (expired/invalid session), trigger session expired event for redirect to login
	if (response.status === 401) {
		window.dispatchEvent(new CustomEvent("auth:session-expired"))
	}

	return response
}
