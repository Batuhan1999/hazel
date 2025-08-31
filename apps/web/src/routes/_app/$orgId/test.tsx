import { ChannelId, MessageId, UserId } from "@hazel/db/schema"
import { useLiveQuery } from "@tanstack/react-db"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { Button } from "~/components/base/buttons/button"
import { messageCollection } from "~/db/collections"

export const Route = createFileRoute("/_app/$orgId/test")({
	component: RouteComponent,
})

function RouteComponent() {
	const { data } = useLiveQuery((q) => q.from({ messages: messageCollection }))

	const addMessage = () => {
		messageCollection.insert({
			id: MessageId.make(crypto.randomUUID()),
			channelId: ChannelId.make(crypto.randomUUID()),
			content: "XD",

			createdAt: new Date().toISOString() as unknown as Date,
			authorId: UserId.make(crypto.randomUUID()),

			replyToMessageId: null,
			threadChannelId: null,
			deletedAt: null,
			updatedAt: null,
		})
	}

	return (
		<div>
			{data.map((message, length) => (
				<div key={message.id}>{length}</div>
			))}
			<Button onClick={() => addMessage()}>Send</Button>
		</div>
	)
}
