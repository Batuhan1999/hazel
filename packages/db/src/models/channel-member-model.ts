import { Schema } from "effect"
import { ChannelId, ChannelMemberId, MessageId, UserId } from "../lib/schema"
import * as M from "../services/model"

export class Model extends M.Class<Model>("ChannelMember")({
	id: M.Generated(ChannelMemberId),
	channelId: ChannelId,
	userId: UserId,
	isHidden: Schema.Boolean,
	isMuted: Schema.Boolean,
	isFavorite: Schema.Boolean,
	lastSeenMessageId: Schema.NullOr(MessageId),
	notificationCount: Schema.Number,
	joinedAt: M.GeneratedByApp(
		Schema.DateFromSelf.annotations({
			jsonSchema: { type: "string", format: "date-time" },
		}),
	),
	createdAt: M.Generated(
		Schema.DateFromSelf.annotations({
			jsonSchema: { type: "string", format: "date-time" },
		}),
	),
	deletedAt: M.GeneratedByApp(
		Schema.NullOr(
			Schema.DateFromSelf.annotations({
				jsonSchema: { type: "string", format: "date-time" },
			}),
		),
	),
}) {}

export const Insert = Model.insert
export const Update = Model.update
