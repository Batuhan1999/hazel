import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"
import { NotFound } from "../errors"
import { Message, MessageCursorResult, MessageId } from "../schema/message"

export const MessageApiGroup = HttpApiGroup.make("Message")
	.add(
		HttpApiEndpoint.post("createMessage")`/messages`.setPayload(Message.jsonCreate).addSuccess(
			Schema.Struct({
				success: Schema.Boolean,
				id: MessageId,
			}),
		),
	)
	.add(
		HttpApiEndpoint.put("updateMessage")`/messages/:id`
			.setPath(Schema.Struct({ id: MessageId }))
			.setPayload(Message.jsonUpdate)
			.addSuccess(
				Schema.Struct({
					success: Schema.Boolean,
				}),
			),
	)
	.add(
		HttpApiEndpoint.del("deleteMessage")`/messages/:id`.setPath(Schema.Struct({ id: MessageId })).addSuccess(
			Schema.Struct({
				success: Schema.Boolean,
			}),
		),
	)
	.add(
		HttpApiEndpoint.get("getMessage")`/messages/:id`
			.setPath(
				Schema.Struct({
					id: Schema.Any,
				}),
			)
			.addSuccess(Message.json)
			.addError(NotFound),
	)
	.add(
		HttpApiEndpoint.get("getMessages")`/messages`
			.setUrlParams(
				Schema.Struct({
					cursor: Schema.optional(MessageId),
					limit: Schema.optional(
						Schema.NumberFromString.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(100)),
					),
				}),
			)
			.addSuccess(MessageCursorResult),
	)
