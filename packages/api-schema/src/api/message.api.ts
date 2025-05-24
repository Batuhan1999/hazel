import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"
import { NotFound } from "../errors"
import { Message, MessageId } from "../schema/message"

export const MessageApiGroup = HttpApiGroup.make("Message")
	.add(HttpApiEndpoint.post("createMessage")`/messages`.setPayload(Message.jsonCreate).addSuccess(Schema.Void))
	.add(
		HttpApiEndpoint.put("updateMessage")`/messages/:id`
			.setPath(Schema.Struct({ id: MessageId }))
			.setPayload(Message.jsonUpdate),
	)
	.add(HttpApiEndpoint.del("deleteMessage")`/messages/:id`.setPath(Schema.Struct({ id: MessageId })))
	.add(
		HttpApiEndpoint.get("getMessage")`/messages/:id`
			.setPath(
				Schema.Struct({
					id: MessageId,
				}),
			)
			.addSuccess(Message.json)
			.addError(NotFound),
	)
