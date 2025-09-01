import { Schema } from "effect"
import { ChannelId, ChannelMemberId, MessageId, UserId } from "../lib/schema"
import * as M from "../services/model"
import { baseFields } from "./utils"

export class Model extends M.Class<Model>("ChannelMember")({
	id: M.Generated(ChannelMemberId),
	channelId: ChannelId,
	userId: UserId,
	isHidden: Schema.Boolean,
	isMuted: Schema.Boolean,
	isFavorite: Schema.Boolean,
	lastSeenMessageId: Schema.NullOr(MessageId),
	notificationCount: Schema.Number,
	joinedAt: Schema.Date,
	...baseFields,
}) {}

export const Insert = Model.insert
export const Update = Model.update
