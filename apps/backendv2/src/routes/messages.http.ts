import { HttpApiBuilder } from "@effect/platform"
import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Effect } from "effect"
import { HazelApp } from "../api"

import * as schema from "../schema/index"

export const HttpMessageLive = HttpApiBuilder.group(HazelApp, "messages", (handlers) =>
	Effect.gen(function* () {
		const db = yield* PgDrizzle

		return handlers.handle(
			"create",
			Effect.fnUntraced(function* ({ payload }) {
				yield* db.insert(schema.messagesTable).values(payload).pipe(Effect.orDie)
				return
			}),
		)
	}),
)
