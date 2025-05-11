import postgres from "postgres"

import { PostgresJSConnection, PushProcessor, ZQLDatabase } from "@rocicorp/zero/pg"

import { HttpApiBuilder } from "@effect/platform"
import { MakiApi } from "@maki-chat/api-schema"
import { schema } from "@maki-chat/zero"
import { Effect } from "effect"

const processor = new PushProcessor(
	new ZQLDatabase(new PostgresJSConnection(postgres(process.env.ZERO_UPSTREAM_DB! as string)), schema),
)

export const ZeroApiLive = HttpApiBuilder.group(MakiApi, "Zero", (handlers) =>
	Effect.gen(function* () {
		return handlers.handle("push", () => Effect.succeed("Maki Chat API"))
	}),
)
