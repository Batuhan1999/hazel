import { Schema } from "effect"
import { ChannelId, MessageId, PinnedMessageId, UserId } from "../lib/schema"
import * as M from "../services/model"

export class Model extends M.Class<Model>("PinnedMessage")({
	id: M.Generated(PinnedMessageId),
	channelId: ChannelId,
	messageId: MessageId,
	pinnedBy: UserId,
	pinnedAt: Schema.Date,
}) {}

export const Insert = Model.insert
export const Update = Model.update
