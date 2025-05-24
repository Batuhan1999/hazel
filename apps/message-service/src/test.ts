import { Model, SqlClient } from "@effect/sql"
import { ChannelId, Message, MessageId, UserId } from "@maki-chat/api-schema/schema"
import { types } from "cassandra-driver"
import { String, pipe } from "effect"
import { Option } from "effect"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { nanoid } from "nanoid"
import * as CassandraClient from "./sql-cassandra"

const config = {
	contactPoints: ["127.0.0.1"],
	localDataCenter: "datacenter1",
	keyspace: "chat",
	transformQueryNames: String.camelToSnake,
}

const SqlLive = CassandraClient.layer(config)

export class MessageRepo extends Effect.Service<MessageRepo>()("@hazel/Message/Repo", {
	effect: Model.makeRepository(Message, {
		tableName: "messages",
		spanPrefix: "MessageRepo",
		idColumn: "id",
	}),
	dependencies: [SqlLive],
}) {}

const simpleTest = Effect.gen(function* () {
	const sql = yield* SqlClient.SqlClient
	const repo = yield* MessageRepo

	yield* Console.log("Testing Cassandra connection...")

	const messageId = types.TimeUuid.now()
	const create = (message: typeof Message.jsonCreate.Type) =>
		pipe(
			repo.insertVoid(
				Message.insert.make({
					id: MessageId.make(messageId.toString()),
					...message,
				}),
			),
			Effect.withSpan("Message.create", { attributes: { message } }),
		)

	const channelId = ChannelId.make(`cha_${nanoid(10)}`)
	const authorId = UserId.make(`usr_${nanoid(10)}`)

	yield* create({
		content: "Hello, world!",
		channelId: channelId,
		threadChannelId: Option.none(),
		authorId: authorId,
		replyToMessageId: Option.none(),
		attachedFiles: Option.none(),
	})

	const res = yield* sql` SELECT * FROM messages LIMIT 5`
	console.log("Query result:", res)

	// yield* Console.log("Inserting test message...")
	// yield* sql.executeRaw(insertQuery, ["Hello from Effect!", "test-channel", "test-user"])

	// yield* Console.log("Fetching messages...")
	// const selectQuery = "SELECT * FROM messages LIMIT 5"
	// const results = yield* client.executeRaw(selectQuery, [])
})

const main = simpleTest.pipe(
	Effect.provide(SqlLive),
	Effect.provide(MessageRepo.Default),
	Effect.catchAll((error) => Console.error(`Error: ${error}`)),
)

Effect.runPromise(main)
