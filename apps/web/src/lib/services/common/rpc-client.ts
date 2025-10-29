import { FetchHttpClient } from "@effect/platform"
import { RpcClient as RpcClientBuilder, RpcSerialization } from "@effect/rpc"
import { AttachmentRpcs } from "@hazel/backend/rpc/groups/attachments"
import { ChannelMemberRpcs } from "@hazel/backend/rpc/groups/channel-members"
import { ChannelRpcs } from "@hazel/backend/rpc/groups/channels"
import { DirectMessageParticipantRpcs } from "@hazel/backend/rpc/groups/direct-message-participants"
import { InvitationRpcs } from "@hazel/backend/rpc/groups/invitations"
import { MessageReactionRpcs } from "@hazel/backend/rpc/groups/message-reactions"
import { MessageRpcs } from "@hazel/backend/rpc/groups/messages"
import { NotificationRpcs } from "@hazel/backend/rpc/groups/notifications"
import { OrganizationMemberRpcs } from "@hazel/backend/rpc/groups/organization-members"
import { OrganizationRpcs } from "@hazel/backend/rpc/groups/organizations"
import { PinnedMessageRpcs } from "@hazel/backend/rpc/groups/pinned-messages"
import { TypingIndicatorRpcs } from "@hazel/backend/rpc/groups/typing-indicators"
import { UserPresenceStatusRpcs } from "@hazel/backend/rpc/groups/user-presence-status"
import { UserRpcs } from "@hazel/backend/rpc/groups/users"
import { AuthMiddlewareClientLive } from "@hazel/backend/rpc/middleware/client"
import { Effect, Layer } from "effect"

/**
 * RPC HTTP Protocol Layer
 *
 * Creates HTTP-based RPC client for backend communication.
 * Authentication is handled via cookies which are automatically sent
 * with each HTTP request.
 *
 * Uses FetchHttpClient which provides the browser's native fetch API.
 */

const backendUrl = import.meta.env.VITE_BACKEND_URL
const httpUrl = `${backendUrl}/rpc`

// Custom fetch client that includes credentials (cookies) with requests
const CustomFetchLive = FetchHttpClient.layer.pipe(
	Layer.provide(
		Layer.succeed(FetchHttpClient.RequestInit, {
			credentials: "include", // Include cookies in cross-origin requests
		}),
	),
)

export const RpcProtocolLive = RpcClientBuilder.layerProtocolHttp({
	url: httpUrl,
}).pipe(Layer.provide(CustomFetchLive), Layer.provide(RpcSerialization.layerJson))

// export const RpcProtocolLive = RpcClientBuilder.layerProtocolSocket({
// 	retryTransientErrors: true, // Auto-reconnect on connection issues
// }).pipe(Layer.provide(BrowserSocket.layerWebSocket(wsUrl)), Layer.provide(RpcSerialization.layerNdjson))

export const AllRpcs = MessageRpcs.merge(
	NotificationRpcs,
	InvitationRpcs,
	ChannelRpcs,
	ChannelMemberRpcs,
	OrganizationRpcs,
	OrganizationMemberRpcs,
	UserRpcs,
	MessageReactionRpcs,
	TypingIndicatorRpcs,
	PinnedMessageRpcs,
	AttachmentRpcs,
	DirectMessageParticipantRpcs,
	UserPresenceStatusRpcs,
)

export class RpcClient extends Effect.Service<RpcClient>()("RpcClient", {
	scoped: RpcClientBuilder.make(AllRpcs),
	dependencies: [RpcProtocolLive, AuthMiddlewareClientLive],
}) {}
