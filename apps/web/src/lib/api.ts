import { FetchHttpClient, HttpApiClient, HttpClient } from "@effect/platform/index"
import { MakiApi } from "@maki-chat/api-schema"
import { Effect } from "effect/index"

const apiClient = HttpApiClient.make(MakiApi, {
	baseUrl: "http://localhost:8787",

	transformClient: (client) => client.pipe(HttpClient.tapRequest(Effect.logDebug)),
})
