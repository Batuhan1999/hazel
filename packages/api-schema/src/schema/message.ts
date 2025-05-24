import { Predicate, Schema } from "effect"
import { UserId } from "./user"

import { HttpApiSchema } from "@effect/platform"
import { Model } from "@effect/sql"

export const ChannelId = Schema.String.pipe(Schema.brand("@hazel/channel-id"))
export type ChannelId = Schema.Schema.Type<typeof ChannelId>
export const MessageId = Schema.String.pipe(Schema.brand("@hazel/message-id"))
export type MessageId = Schema.Schema.Type<typeof MessageId>

export class Message extends Model.Class<Message>("@hazel/Message")({
	id: Model.GeneratedByApp(MessageId),
	content: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(4000)),
	channelId: ChannelId,
	threadChannelId: Model.FieldOption(ChannelId),
	authorId: UserId,
	replyToMessageId: Model.FieldOption(MessageId),
	attachedFiles: Schema.Array(Schema.String),
	createdAt: Model.DateTimeInsertFromDate,
	updatedAt: Model.DateTimeUpdateFromDate,
}) {}
