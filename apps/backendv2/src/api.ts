import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

export class RootGroup extends HttpApiGroup.make("root").add(
	HttpApiEndpoint.get("root")`/`.addSuccess(Schema.String),
) {}

export class MessageGroup extends HttpApiGroup.make("messages")
	.add(HttpApiEndpoint.post("create")`/`.setPayload(Schema.Any).addSuccess(Schema.Void))
	.prefix("/messages") {}

export class HazelApp extends HttpApi.make("HazelApp").add(MessageGroup).add(RootGroup) {}
