import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Message } from "../schema/message"

export const MessageApiGroup = HttpApiGroup.make("Message").add(
	HttpApiEndpoint.post("createMessage")`/messages`.setPayload(Message.jsonCreate).addSuccess(Message.json),
)
