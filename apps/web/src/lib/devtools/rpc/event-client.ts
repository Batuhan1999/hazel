import { EventClient } from "@tanstack/devtools-event-client"
import type { RpcDevtoolsEventMap } from "./types"

/**
 * Global key for the singleton event client
 * Using globalThis ensures the same instance is used across dynamic imports
 */
const GLOBAL_KEY = "__EFFECT_RPC_DEVTOOLS_CLIENT__" as const

declare global {
	var __EFFECT_RPC_DEVTOOLS_CLIENT__: EventClient<RpcDevtoolsEventMap, "effect-rpc"> | undefined
}

/**
 * Get or create the singleton event client
 */
function getOrCreateClient(): EventClient<RpcDevtoolsEventMap, "effect-rpc"> {
	if (!globalThis[GLOBAL_KEY]) {
		globalThis[GLOBAL_KEY] = new EventClient<RpcDevtoolsEventMap, "effect-rpc">({
			pluginId: "effect-rpc",
			debug: import.meta.env.DEV,
			enabled: import.meta.env.DEV,
		})
	}
	return globalThis[GLOBAL_KEY]
}

/**
 * TanStack Devtools event client for Effect RPC
 *
 * This client emits events when RPC requests are made and responses are received.
 * The devtools panel subscribes to these events to display the RPC traffic.
 *
 * Uses globalThis to ensure singleton across dynamic imports.
 */
export const rpcEventClient = getOrCreateClient()
