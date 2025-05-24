import { Model } from "@maki-chat/api-schema"
import { type ChannelId, Message, type MessageId } from "@maki-chat/api-schema/schema"
import { types } from "cassandra-driver"
import { Effect, pipe } from "effect"
import { MessageRepo } from "../repositories"

export class MessageService extends Effect.Service<MessageService>()("@hazel/Message/Service", {
	effect: Effect.gen(function* () {
		const repo = yield* MessageRepo

		const create = Effect.fn("Message.create")(function* (message: typeof Message.jsonCreate.Type) {
			yield* Effect.annotateCurrentSpan("message", message)

			const messageId = types.TimeUuid.now().toString() as MessageId

			yield* repo.insertVoid(
				Message.insert.make({
					id: messageId,
					...message,
				}),
			)

			return { id: messageId }
		})

		const findById = (id: MessageId) =>
			pipe(repo.findById(id), Effect.withSpan("Message.findById", { attributes: { id } }))

		const deleteMessage = (id: MessageId) =>
			pipe(repo.delete(id), Effect.withSpan("Message.delete", { attributes: { id } }))

		const update = Effect.fn("Message.update")(function* (id: MessageId, message: typeof Message.jsonUpdate.Type) {
			yield* Effect.annotateCurrentSpan("id", id)

			yield* repo.updateVoid({
				id,
				...message,
				updatedAt: undefined,
			})
		})

		const paginate = Effect.fn("Message.paginate")(function* (
			channelId: ChannelId,
			params: {
				cursor: MessageId | null
				limit?: number
			},
		) {
			yield* Effect.annotateCurrentSpan("params", params)

			const messagesByChannelPaginator = yield* Model.makePartitionedPaginatedQuery(Message, {
				tableName: "messages_by_channel",
				spanPrefix: "Message",
				partitionKey: "channelId",
				cursorField: "id",
				useCompoundCursor: true,
				orderDirection: "DESC",
			})

			const paginateByChannel = messagesByChannelPaginator(channelId)
			const result = yield* paginateByChannel({
				cursor: params.cursor ?? undefined,
				limit: params.limit ?? 20,
			})

			return result
		})

		return { create, findById, delete: deleteMessage, update, paginate }
	}),
	dependencies: [MessageRepo.Default],
}) {}
